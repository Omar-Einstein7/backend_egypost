require("dotenv").config();
const multer = require("multer");

// على Vercel، لا يمكننا حفظ الملفات على القرص، لذلك نستخدم memory storage
const storage = multer.memoryStorage();

module.exports = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
