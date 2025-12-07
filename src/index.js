// Detect if we're running on Vercel
const isVercel = process.env.VERCEL || process.env.NOW_REGION;

// Load environment variables - different approach for Vercel
if (!isVercel) {
  require("dotenv").config();   // Load .env file only in local development
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const reportRoutes = require("./routes/report.routes");
const spareRoutes = require("./routes/spare.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static folder - only for local development
if (!isVercel) {
  const path = require('path');
  const uploadStaticDir = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'));
  app.use("/uploads", express.static(uploadStaticDir));
}

// Connect DB with better error handling and Vercel compatibility
console.log("Environment:", isVercel ? "Vercel" : "Local");
console.log("MONGO_URI available:", !!process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI environment variable is not set!");
  console.error("Please set MONGO_URI in Vercel environment variables");
  // Don't exit on Vercel - let the server start but show error
}

// MongoDB connection with serverless compatibility
const connectDB = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
       
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds timeout
      });
      console.log("MongoDB Connected successfully!");
    } else {
      console.warn("MongoDB not connected - MONGO_URI not set");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // On Vercel, we don't want to crash the server completely
    if (!isVercel) {
      process.exit(1);
    }
  }
};

connectDB();

// Routes
app.use("/reports", reportRoutes);
app.use("/spares", spareRoutes);

// Simple endpoint to check if server is working
app.use("/", (req, res) => {
  res.json({ 
    message: "Server is running!",
    environment: process.env.VERCEL ? "Vercel" : "Local",
    mongoConnected: !!mongoose.connection.readyState
  });
});

// Start server
 // http://omar-dev.local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
