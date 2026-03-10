const db = require("../db/queries");
const cloudinary = require("../config/cloudinary");

async function uploadToCloudinary(fileBuffer, originalname) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "Files", public_id: `${Date.now()}-${originalname}` },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded!");
    }

    const file = req.file;

    const result = await uploadToCloudinary(file.buffer, file.originalname);

    await db.createFile(
      file.originalname,
      file.size,
      req.user.id,
      result.secure_url,
    );
    return res.status(200).json({ message: "File uploaded successfully", url: result.secure_url });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

module.exports = {
  handleUpload,
};
