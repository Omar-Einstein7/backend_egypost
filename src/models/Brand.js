const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  deviceType: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceType" }
});

module.exports = mongoose.model("Brand", BrandSchema);