const { Router } = require("express");
const upload = require("../config/multer.js");
const uploadRouter = Router();

const verifyToken = require("../middleware/authMiddleware.js");
const uploadController = require("../controllers/uploadController.js");

uploadRouter.post("/", verifyToken, upload.single("file"), uploadController.handleUpload);

module.exports = uploadRouter;
