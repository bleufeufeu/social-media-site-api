const { Router } = require("express");
const router = Router();
const verifyToken = require("../middleware/authMiddleware.js");

const followRequestController = require("../controllers/followRequestController.js");

router.post("/:recipientId/new", verifyToken, followRequestController.handleSendFollowRequest);
router.put("/:senderId/accept", verifyToken, followRequestController.handleAcceptFollowRequest);
router.put("/:senderId/deny", verifyToken, followRequestController.handleDenyFollowRequest);

router.get("/incoming", verifyToken, followRequestController.returnIncomingFollowRequests);

module.exports = router;
