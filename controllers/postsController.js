const db = require("../db/queries");

async function handleCreatePost(req, res) {
  try {
    if (!req.body.content) {
      return res.status(422).json("Post is empty");
    }

    const newPost = await db.createPost(req.body.content, req.user.id, req.body.attachment);

    return res.status(201).json(newPost);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleReturnPostIndividual(req, res) {
  const { postId } = req.params;
  const post = await db.returnPostById(postId);
 
  if (!post) {
    return res.status(404).json({ error: "Post not found"});
  }

  try {
    return res.status(200).json(post);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleRepost(req, res) {
  try {
    const { postId } = req.params;

    const newRepost = await db.handleRepost(postId, req.user.id);

    return res.status(201).json(newRepost);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleLike(req, res) {
  try {
    const { postId } = req.params;

    const newLike = await db.handleLike(postId, req.user.id);

    return res.status(201).json(newLike);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleDeletePost(req, res) {
  try {
    const { postId } = req.params;

    const post = await db.returnPostById(postId);

    if (post.userId !== req.user.id) {
      return res.status(404).json({ error: "Forbidden"});
    }

    const deletedPost = await db.deletePost(postId);

    return res.status(201).json(deletedPost);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  handleCreatePost,
  handleReturnPostIndividual,
  handleRepost,
  handleLike,
  handleDeletePost
};
