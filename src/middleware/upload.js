require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = process.env.UPLOAD_PATH || "uploads";
const uploadDirAbs = path.resolve(uploadDir);
fs.mkdirSync(uploadDirAbs, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirAbs);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

module.exports = multer({ storage });
