const { se } = require("date-fns/locale");
const prisma = require("./prisma");

//USER QUERIES
async function createUser(username, password) {
  try {
    const alreadyExists = await returnUserByUsername(username);

    if (alreadyExists) {
        throw new Error("Username already in use")
    }

    const user = await prisma.user.create({
      data: {
        username: username,
        password: password
      },
    });
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnUserByUsername(username) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      }
    });
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        password: false
      }
    });
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnUserByUsernamePartial(username) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
      select: {
        username: true,
        profilePic: true,
        bio: true,
        location: true,
        website: true,
        isPrivate: true,
        _count: {
          select: {
            followers: true,
            following: true,
          }
        },
        posts: false,
        password: false
      }
    });
    return {
      ...user,
      haveBeenBlocked: true,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}


async function returnAllUsersExceptSelf(userId) {
  try {
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          id: userId,
        },
        blockList: {
          none: {
            id: userId
          }
        }
      },
      select: {
        id: true,
        githubId: true,
        username: true,
        profilePic: true,
        bio: true,
        location: true,
        website: true,
        isPrivate: true,
        password: false
      }
    });

    return await Promise.all(users.map(async user => ({
        ...user,
        isFollowing: await checkIfFollowingUser(user.id, userId),
        isPending: await checkIfPendingFollowRequest(user.id, userId)
      }))
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function checkIfFollowingUser(userId, selfId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        followers: {
          where: {
            id: selfId
          },
          select: {
            id: true
          }
        },
      }
    });

    if (!user) return null;
    if (user.followers.length === 0) return false;

    return true;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function checkIfPendingFollowRequest(userId, selfId) {
  try {
    const pending = await prisma.followRequest.findUnique({
      where: {
        senderId_recipientId: {
          senderId: selfId,
          recipientId: userId,
        }
      },
    });

    if (!pending) return false;
    return true;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function verifyAccessToUser(userId, selfId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: userId
      },
      select: {
        id: true,
        isPrivate: true,
        followers: {
          where: {
            id: selfId
          },
          select: {
            id: true
          }
        },
        blockList: {
          where: {
            id: selfId
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!user) return null;

    if (user.id === selfId) return user;

    if (user.blockList.length > 0) return null;
    if (user.isPrivate && user.followers.length === 0) return null;

    return user;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateUserPassword(userId, newPassword) {
  try {
    const result = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: newPassword,
      }
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateUserPrivate(userId) {
  try {
    const { isPrivate } = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            isPrivate: true
        }
    });

    let result;

    if (!isPrivate) {
        result = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                isPrivate: true
            }
        });
    } else if (isPrivate === true) {
        result = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                isPrivate: false
            }
        })
    }
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateUserDetails(userId, profilePic, bio, location, website) {
  try {
    const result = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profilePic: profilePic,
        bio: bio,
        location: location,
        website: website
      }
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function handleBlockUser(selfId, toBlockId) {
  try {

    const alreadyBlocked = await prisma.user.findUnique({
        where: {
            id: selfId,
            blockList: {
              some: { username: toBlockId }
            }
        }
    });

    let result;

    if (alreadyBlocked) {
      result = await prisma.user.update({
          where: {
              id: selfId
          },
          data: {
              blockList: {
                  disconnect: {
                    username: toBlockId
                  }
              }
          }
      });
    } else {
      const isFollower = await prisma.user.findUnique({
          where: {
              id: selfId,
              followers: {
                some: { username: toBlockId }
              }
          }
      });

      if (isFollower) {
        await prisma.user.update({
          where: {
            id: selfId
          },
          data: {
            followers: {
              disconnect : {
                username: toBlockId
              }
            }
          }
        });
      }

      const isFollowing = await prisma.user.findUnique({
          where: {
              id: selfId,
              following: {
                some: { username: toBlockId }
              }
          }
      });

      if (isFollowing) {
        await prisma.user.update({
          where: {
            id: selfId
          },
          data: {
            following: {
              disconnect : {
                username: toBlockId
              }
            }
          }
        });
      }

      result = await prisma.user.update({
          where: {
              id: selfId
          },
          data: {
              blockList: {
                  connect: {
                    username: toBlockId
                  }
              }
          }
      });
    }

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//POST QUERIES
async function createPost(content, userId, attachment) {
  try {
    const hashtagList = await parseHashtags(content);

    const addHashtags = await prisma.hashtag.createMany({
        data: hashtagList.map(name => ({ name })),
        skipDuplicates: true
    });

    const post = await prisma.post.create({
      data: {
        content,
        userId,
        ...(attachment && { attachment }),
        ...(hashtagList.length > 0 && { 
            hashtags: {
                connect: hashtagList.map(name => ({ name }))
            }
        })
      },
    });

    return post;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function parseHashtags(content) {
  const splitContent = content.split(" ");
  let hashtagList = splitContent
                      .filter((word) => word.startsWith("#"))
                      .map((hashtag) => hashtag.toLowerCase().slice(1))
                      .filter((hashtag) => /^[a-zA-Z0-9_]+$/.test(hashtag));
  return hashtagList;
}

async function returnPostById(postId, selfId) {
  try {
    const result = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        User: {
          select: {
            username: true,
            profilePic: true,
            isPrivate: true,
          }
        },
        _count: {
          select: {
            comments: true,
            reposts: true,
            likedBy: true,
          }
        },
        reposts: true,
        likedBy: true,  
        comments: {
          include: {
            User: {
              select: {
                username: true,
                profilePic: true,
                isPrivate: true,
              }
            }
          },
          orderBy: {
            postedAt: "desc"
          }
        }
      }
    });

    return {
      ...result,
      isReposted: result.reposts.some(user => user.userId === selfId),
      isLiked: result.likedBy.some(user => user.userId === selfId)
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnAllPostsFromAllUsers() {
  try {
    const result = await prisma.post.findMany({
      select: {
        content: true,
        attachment: true,
        postedAt: true,
        User: true,
        _count: {
          select: {
            comments: true,
            reposts: true,
            likedBy: true,
          }
        },
      },
      orderBy: {
        postedAt: "desc"
      }
    });
    
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnAllPostsByHashtag(hashtag, selfId) {
  try {

    const result = await prisma.hashtag.findUnique({
      where: {
        name: hashtag.toLowerCase()
      },
      select: {
        posts: {
          select: {
            id: true,
            content: true,
            attachment: true,
            postedAt: true,
            User: true,
            _count: {
                select: {
                  comments: true,
                  reposts: true,
                  likedBy: true,
                }
            },
            reposts: true,
            likedBy: true,
          },
          orderBy: {
            postedAt: "desc"
          }
        }
      },
    });

    const posts = result.posts.map(post => ({
        type: "post",
        datetime: post.postedAt,
        data: post,
        isReposted: post.reposts.some(user => user.userId === selfId),
        isLiked: post.likedBy.some(user => user.userId === selfId) 
    }))
    
    return posts;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnAllPostsRepostsByUser(userId, selfId) {
  try {
    const isBlocked = await prisma.user.findFirst({
      where: {
        username: userId,
        blockedBy: {
          some: {
            id: selfId
          }
        }
      }
    }) !== null;

    const result = await prisma.user.findUnique({
      where: {
        username: userId,
      },
      include: {
        posts: {
          include: {
            User: {
              select: {
                username: true,
                profilePic: true,
                isPrivate: true,
              }
            },
            _count: {
              select: {
                comments: true,
                reposts: true,
                likedBy: true,
              }
            },
            reposts: true,
            likedBy: true,
          }
        },
        reposts: {
          where: {
            originalPost: {
              User: {
                blockedBy: {
                  none: {
                    id: selfId
                  }
                },
                blockList: {
                  none: {
                    id: selfId
                  }
                }
              }
            }
          },
          include: {
            repostedBy: {
              select: {
                username: true,
                profilePic: true,
                isPrivate: true,
              }
            },
            originalPost: {
              include: {
                User: {
                  select: {
                    username: true,
                    profilePic: true,
                    isPrivate: true,
                  }
                },
                _count: {
                  select: {
                    comments: true,
                    reposts: true,
                    likedBy: true,
                  }
                },
                reposts: true,
                likedBy: true,
              }
            },
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          }
        },
        password: false
      }
    });

    if (!result) return null;

    const combinedPosts = [
        ...result.posts.map(post => ({
            type: "post",
            datetime: post.postedAt,
            data: post,
            isReposted: post.reposts.some(user => user.userId === selfId),
            isLiked: post.likedBy.some(user => user.userId === selfId) 
        })),
        ...result.reposts.map(repost => ({
            type: "repost",
            datetime: repost.repostedAt,
            data: repost.originalPost,
            repostedBy: repost.repostedBy,
            isReposted: repost.originalPost.reposts.some(user => user.userId === selfId),
            isLiked: repost.originalPost.likedBy.some(user => user.userId === selfId)
        }))
    ];

    combinedPosts.sort((a, b) => b.datetime - a.datetime);

    return {
        ...result,
        combinedPosts: combinedPosts,
        isBlocked: isBlocked,
        isFollowing: await checkIfFollowingUser(result.id, selfId),
        isPending: await checkIfPendingFollowRequest(result.id, selfId)
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnAllPostsRepostsFromFollowing(userId) {
  try {
    const result = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        following: {
          select: {
            posts: {
              include: {
                User: {
                  select: {
                    username: true,
                    profilePic: true,
                    isPrivate: true,
                  }
                },
                _count: {
                  select: {
                    comments: true,
                    reposts: true,
                    likedBy: true,
                  }
                },
                reposts: true,
                likedBy: true,
              }
            },
            reposts: {
              include: {
                repostedBy: {
                  select: {
                    username: true,
                    profilePic: true,
                    isPrivate: true,
                  }
                },
                originalPost: {
                  include: {
                    User: {
                      select: {
                        username: true,
                        profilePic: true,
                        isPrivate: true,
                      }
                    },
                    _count: {
                      select: {
                        comments: true,
                        reposts: true,
                        likedBy: true,
                      }
                    },
                    reposts: true,
                    likedBy: true,
                  }
                },
              },
            }
          }
        }
      }
    });

    if (!result) return null;

    const combinedPosts = [
        ...result.following.flatMap(follow => 
          (follow.posts.map(post => ({
            type: "post",
            datetime: post.postedAt,
            data: post,
            isReposted: post.reposts.some(user => user.userId === userId),
            isLiked: post.likedBy.some(user => user.userId === userId) 
        })))),
        ...result.following.flatMap(follow => 
          (follow.reposts.map(repost => ({
            type: "repost",
            datetime: repost.repostedAt,
            data: repost.originalPost,
            repostedBy: repost.repostedBy,
            isReposted: repost.originalPost.reposts.some(user => user.userId === userId),
            isLiked: repost.originalPost.likedBy.some(user => user.userId === userId)
        })))),
    ];

    combinedPosts.sort((a, b) => b.datetime - a.datetime);

    return {
        ...result,
        combinedPosts: combinedPosts,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnAllLikesByUser(userId, selfId) {
  try {
    const result = await prisma.user.findUnique({
      where: {
        username: userId,
      },
      select: {
        likes: {
          where: {
            originalPost: {
              User: {
                blockedBy: {
                  none: {
                    id: selfId
                  }
                },
                blockList: {
                  none: {
                    id: selfId
                  }
                }
              }
            }
          },
          select: {
              originalPost: {
                include: {
                  User: {
                    select: {
                      username: true,
                      profilePic: true,
                      isPrivate: true,
                    }
                  },
                  _count: {
                    select: {
                      comments: true,
                      reposts: true,
                      likedBy: true,
                    }
                  },
                  reposts: true,
                  likedBy: true,
                },
              },
          },
          orderBy: {
            likedAt: "desc",
          }
        }
      }
    });

    if (!result) return null;

    const likes = [
        ...result.likes.map(like => ({
            type: "post",
            datetime: like.originalPost.postedAt,
            data: like.originalPost,
            isReposted: like.originalPost.reposts.some(user => user.userId === selfId),
            isLiked: like.originalPost.likedBy.some(user => user.userId === selfId) 
        }))
    ];
    
    return {
      ...result,
      likes: likes
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function handleRepost(postId, userId) {
    try {
        const isReposted = await prisma.repost.findUnique({
            where: {
                postId_userId: {
                    postId: postId,
                    userId: userId,
                }
            }
        });

        let repost;

        if (isReposted) {
            repost = await prisma.repost.delete({
                where: {
                    postId_userId: {
                        postId: postId,
                        userId: userId,
                    }  
                }
            });
        } else {
            repost = await prisma.repost.create({
                data: {
                    postId: postId,
                    userId: userId,  
                }
            });
        }

        return repost;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function handleLike(postId, userId) {
    try {
        const isLiked = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId: postId,
                    userId: userId,
                }
            }
        });

        let like;

        if (isLiked) {
            like = await prisma.like.delete({
                where: {
                    postId_userId: {
                        postId: postId,
                        userId: userId,
                    }
                }
            });
        } else {
            like = await prisma.like.create({
                data: {
                    postId: postId,
                    userId: userId,  
                }
            });
        }

        return like;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function deletePost(postId) {
  try {
    const result = await prisma.post.delete({
      where: {
        id: postId,
      },
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//COMMENT QUERIES
async function createComment(content, userId, postId) {
  try {
    const comment = await prisma.comment.create({
      data: {
        content: content,
        userId: userId,
        postId: postId
      },
    });
    return comment;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnCommentById(id) {
  try {
    const comment = await prisma.comment.findUnique({
      where: {
        id: id,
      }
    });
    return comment;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deleteComment(commentId) {
  try {
    const result = await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//FOLLOW QUERIES
async function handleSendFollowRequest(senderId, recipientId) {
    try {
        const alreadyRequested = await prisma.followRequest.findUnique({
            where: {
                senderId_recipientId: {
                    senderId: senderId,
                    recipientId: recipientId,
                }
            }
        });

        const alreadyFollowing = await prisma.user.findUnique({
            where: {
                id: senderId,
                following: {
                  some: { id: recipientId }
                }
            }
        });

        let followRequest;
        
        if (alreadyRequested) return null;
        if (alreadyFollowing) {
          result = await prisma.user.update({
          where: {
              id: senderId
          },
          data: {
                  following: {
                      disconnect: {
                        id: recipientId
                      }
                  }
              }
          });
        } else {
            followRequest = await prisma.followRequest.create({
                data: {
                    senderId: senderId,
                    recipientId: recipientId,
                }
            })
        }
    
        return followRequest;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function returnFollowRequest(senderId, recipientId) {
  try {
      const followRequest = await prisma.followRequest.findUnique({
          where: {
              senderId_recipientId: {
                  senderId: senderId,
                  recipientId: recipientId,
              }
          }
      });
  
      return followRequest;

  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function returnIncomingFollowRequests(recipientId) {
  try {
      const followRequests = await prisma.followRequest.findMany({
          where: {
              recipientId: recipientId
          }
      });

      const detailedRequests = await Promise.all(
        followRequests.map((request) => (
        returnUserById(request.senderId)))  
      );
  
      return detailedRequests;

  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function handleAcceptFollowRequest(senderId, recipientId) {
  try {
      const acceptedRequest = await prisma.followRequest.delete({
          where: {
              senderId_recipientId: {
                  senderId: senderId,
                  recipientId: recipientId
              }
          }
      })
      
      await prisma.user.update({
          where: {
              id: senderId
          },
          data: {
              following: {
                  connect: {
                    id: recipientId
                  }
              }
          }
      });
  
      return acceptedRequest;

  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function handleDenyFollowRequest(senderId, recipientId) {
  try {
      const deniedRequest = await prisma.followRequest.delete({
          where: {
              senderId_recipientId: {
                  senderId: senderId,
                  recipientId: recipientId,
              }
          }
      });

      return deniedRequest;

  } catch (error) {
      console.error(error);
      throw error;
  }
}

//FILE QUERIES
async function createFile(name, size, userId, url) {
  try {
    const file = await prisma.file.create({
      data: {
        name: name,
        size: size,
        userId: userId,
        url: url,
      },
    });
    return file;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  createUser,
  returnUserByUsername,
  returnUserById,
  returnUserByUsernamePartial,
  returnAllUsersExceptSelf,
  verifyAccessToUser,
  updateUserPassword,
  updateUserPrivate,
  updateUserDetails,
  handleBlockUser,

  createPost,
  returnPostById,
  returnAllPostsFromAllUsers,
  returnAllPostsByHashtag,
  returnAllPostsRepostsByUser,
  returnAllPostsRepostsFromFollowing,
  returnAllLikesByUser,
  handleRepost,
  handleLike,
  deletePost,

  createComment,
  returnCommentById,
  deleteComment,

  handleSendFollowRequest,
  returnFollowRequest,
  returnIncomingFollowRequests,
  handleAcceptFollowRequest,
  handleDenyFollowRequest,

  createFile
};
