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

async function returnAllUsersExceptSelf(userId) {
  try {
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          id: userId
        }
      },
      include: {
        password: false
      }
    });
    return users;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function verifyAccessToUser(userId, selfId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
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
              some: { id: toBlockId }
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
                    id: toBlockId
                  }
              }
          }
      });
    } else {
      const isFollower = await prisma.user.findUnique({
          where: {
              id: selfId,
              followers: {
                some: { id: toBlockId }
              }
          }
      });

      console.log(isFollower);

      if (isFollower) {
        await prisma.user.update({
          where: {
            id: selfId
          },
          data: {
            followers: {
              disconnect : {
                id: toBlockId
              }
            }
          }
        });
      }

      const isFollowing = await prisma.user.findUnique({
          where: {
              id: selfId,
              following: {
                some: { id: toBlockId }
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
                id: toBlockId
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
                    id: toBlockId
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
                      .map((hashtag) => hashtag.slice(1))
                      .filter((hashtag) => /^[a-zA-Z0-9_]+$/.test(hashtag));
  return hashtagList;
}

async function returnPostById(postId) {
  try {
    const result = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        User: {
          select: {
            username: true
          }
        },
        comments: true
      }
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function returnAllPostsRepostsByUser(userId) {
  try {
    const result = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        posts: true,
        reposts: {
            select: {
                originalPost: true,
                repostedAt: true,
            }
        }
      }
    });

    if (!result) return null;

    const combinedPosts = [
        ...result.posts.map(post => ({
            type: "post",
            datetime: post.postedAt,
            data: post
        })),
        ...result.reposts.map(repost => ({
            type: "repost",
            datetime: repost.repostedAt,
            data: repost.originalPost
        }))
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

async function returnAllPostsRepostsFromFollowing(userId) {
  try {
    const result = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        posts: true,
        reposts: {
            select: {
                originalPost: true,
                repostedAt: true,
            }
        }
      }
    });

    if (!result) return null;

    const combinedPosts = [
        ...result.posts.map(post => ({
            type: "post",
            datetime: post.postedAt,
            data: post
        })),
        ...result.reposts.map(repost => ({
            type: "repost",
            datetime: repost.repostedAt,
            data: repost.originalPost
        }))
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

async function returnAllLikesByUser(userId) {
  try {
    const result = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        likes: {
            select: {
                originalPost: true,
                likedAt: true,
            }
        }
      }
    });
    
    return result;
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
        if (alreadyFollowing) return null;
        else {
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

module.exports = {
  createUser,
  returnUserByUsername,
  returnUserById,
  returnAllUsersExceptSelf,
  verifyAccessToUser,
  updateUserPassword,
  updateUserPrivate,
  updateUserDetails,
  handleBlockUser,

  createPost,
  returnPostById,
  // returnAllPostsReposts,
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
  handleAcceptFollowRequest,
  handleDenyFollowRequest,
};
