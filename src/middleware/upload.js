require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// For Vercel/serverless environments, use memory storage
// For local development, use disk storage
const isVercel = process.env.VERCEL || process.env.NOW_REGION;

let storage;

if (isVercel) {
  // Use memory storage for serverless environments
  storage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  const uploadDir = process.env.UPLOAD_PATH || "uploads";
  const uploadDirAbs = path.resolve(uploadDir);
  fs.mkdirSync(uploadDirAbs, { recursive: true });
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirAbs);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
}

module.exports = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});
