const { Router } = require("express");
const router = Router();
const verifyToken = require("../middleware/authMiddleware.js");

const commentsController = require("../controllers/commentsController.js");

router.delete("/:commentId/delete", verifyToken, commentsController.handleDeleteComment)

module.exports = router;
