const { Router } = require("express");
const router = Router();
const verifyToken = require("../middleware/authMiddleware.js");

const commentsController = require("../controllers/commentsController.js");
const postsController = require("../controllers/postsController.js");

router.post("/new", verifyToken, postsController.handleCreatePost);

router.get("/all", verifyToken, postsController.handleReturnAllPostsFromAllUsers);
router.get("/following", verifyToken, postsController.handleReturnAllPostsFromFollowing);
router.get("/:postId", verifyToken, postsController.handleReturnPostIndividual);
router.get("/hashtag/:hashtagName", verifyToken, postsController.handleReturnAllPostsByHashtag);

router.post("/:postId/comment", verifyToken, commentsController.handleCreateComment);

router.post("/:postId/repost", verifyToken, postsController.handleRepost);
router.post("/:postId/like", verifyToken, postsController.handleLike);
router.delete("/:postId/delete", verifyToken, postsController.handleDeletePost);

module.exports = router;
