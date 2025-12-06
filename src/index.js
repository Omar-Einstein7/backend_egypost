require("dotenv").config();   // <-- مهم جداً

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const reportRoutes = require("./routes/report.routes");
const spareRoutes = require("./routes/spare.routes");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Static folder
const path = require('path');
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
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
 // http://omar-dev.local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
