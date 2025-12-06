const mongoose = require("mongoose");

const DeviceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model("DeviceType", DeviceTypeSchema);