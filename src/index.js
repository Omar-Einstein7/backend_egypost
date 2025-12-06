require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

// Import controllers directly
const reportController = require("./controllers/report.controller");
const spareController = require("./controllers/spare.controller");
const upload = require("./middleware/upload");

const app = express();

// Middleware - applied manually without app.use
const applyMiddleware = (req, res, next) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // JSON parsing
  if (req.method === "POST" || req.method === "PUT") {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try {
        req.body = JSON.parse(data);
        next();
      } catch {
        req.body = {};
        next();
      }
    });
  } else {
    next();
  }
};

// Connect DB with optimized timeout settings for serverless
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return;
    }
    
    console.log("Connecting to MongoDB...");
    
    // Close any existing connection first (important for serverless)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 3, // Smaller pool for serverless
      minPoolSize: 1,
      bufferMaxEntries: 0, // Critical for serverless - no buffering
      bufferCommands: false, // Critical for serverless - no buffering
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4, // Force IPv4
    });
    
    console.log("MongoDB Connected successfully!");
    
    // Handle connection events for better error handling
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Error stack:", err.stack);
    throw err;
  }
};

// Export as Vercel serverless function
module.exports = async (req, res) => {
  // Apply middleware manually
  await new Promise(resolve => {
    applyMiddleware(req, res, resolve);
  });

  // Connect to DB on first request if not connected
   if (mongoose.connection.readyState === 0) {
     try {
       await connectDB();
     } catch (err) {
       res.writeHead(500, { "Content-Type": "application/json" });
       res.end(JSON.stringify({ 
         error: "Database connection failed", 
         message: err.message 
       }));
       return;
     }
   }

  // Handle routes directly without app.use
  const { method, url } = req;

  if (url === "/" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Hello World!" }));
    return;
  }

  if (url.startsWith("/reports")) {
    if (method === "GET" && url === "/reports") {
      await reportController.getReports(req, res);
      return;
    }
    if (method === "POST" && url === "/reports") {
      await upload.single("image")(req, res, async (err) => {
        if (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        await reportController.createReport(req, res);
      });
      return;
    }
  }

  if (url.startsWith("/spares")) {
    if (method === "GET" && url === "/spares/parts") {
      await spareController.getSpareParts(req, res);
      return;
    }
    if (method === "GET" && url === "/spares/brands") {
      await spareController.getSpareBrands(req, res);
      return;
    }
    if (method === "POST" && url === "/spares/parts") {
      await spareController.createSparePart(req, res);
      return;
    }
    if (method === "POST" && url === "/spares/brands") {
      await spareController.createSpareBrand(req, res);
      return;
    }
  }

  // Handle static files for uploads
  if (url.startsWith("/uploads/")) {
    const path = require("path");
    const fs = require("fs");
    const filePath = path.join(__dirname, "..", "uploads", url.replace("/uploads/", ""));
    
    if (fs.existsSync(filePath)) {
      const fileStream = fs.createReadStream(filePath);
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      fileStream.pipe(res);
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
};
