require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// استخدام memory storage على Vercel و disk storage محلياً
let storage;

if (process.env.VERCEL) {
  // على Vercel - memory storage
  storage = multer.memoryStorage();
} else {
  // محلياً - disk storage
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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
