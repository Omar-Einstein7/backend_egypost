require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const reportRoutes = require("./routes/report.routes");
const spareRoutes = require("./routes/spare.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder
const path = require('path');
const uploadStaticDir = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'));
app.use("/uploads", express.static(uploadStaticDir));

// Connect DB with better timeout settings
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    console.log("MongoDB Connected!");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// Routes
app.use("/reports", reportRoutes);
app.use("/spares", spareRoutes);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Export as Vercel serverless function
module.exports = async (req, res) => {
  // Connect to DB on first request if not connected
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  
  return app(req, res);
};
