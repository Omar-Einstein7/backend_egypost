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

// Static folder - لن يعمل على Vercel لأنها لا تدعم تخزين ملفات ثابتة
// const path = require('path');
// const uploadStaticDir = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'));
// app.use("/uploads", express.static(uploadStaticDir));

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.log(err.message));

// Routes
app.use("/reports", reportRoutes);
app.use("/spares", spareRoutes);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Export as Vercel serverless function
module.exports = app;
