const db = require("../db/queries");

async function handleCreateComment(req, res) {
    const { postId } = req.params;
    const post = await db.returnPostById(postId);

    if (!post) {
        return res.status(404).json({ error: "Post not found"});
    }

    try {
        if (!req.body.content) {
            return res.status(422).json("Comment is empty");
        }

        const newComment = await db.createComment(req.body.content, req.user.id, postId);

        return res.status(201).json(newComment);
        
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

async function handleDeleteComment(req, res) {
    const { commentId } = req.params;
    const comment = await db.returnCommentById(commentId);

    if (!comment) {
        return res.status(404).json({ error: "Comment not found"});
    }

    if (comment.userId !== req.user.id) {
      return res.status(404).json({ error: "Forbidden"});
    }

    try {
        const deletedComment = await db.deleteComment(comment.id);

        return res.status(201).json(deletedComment);
        
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}


module.exports = {
    handleCreateComment,
    handleDeleteComment
};
