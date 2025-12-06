require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const reportRoutes = require("../src/routes/report.routes");
const spareRoutes = require("../src/routes/spare.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder - مهم لملفات الـ uploads
const uploadStaticDir = path.resolve(process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'));
app.use("/uploads", express.static(uploadStaticDir));

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.log(err.message));

// Routes
app.use("/reports", reportRoutes);
app.use("/spares", spareRoutes);

// الراوت الرئيسي
app.get("/", (req, res) => {
  res.send("API is working on Vercel!");
});

// تصدير app كـ handler لـ Vercel (بدون app.listen)
module.exports = app;