const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({

  region: String,
  technicianName: String,
  deviceType: { type: mongoose.Schema.Types.ObjectId, ref: "DeviceType" },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  model: { type: mongoose.Schema.Types.ObjectId, ref: "Model" },        // اسم قطعة الغيار

  // raw names fallback when no linked docs exist
  deviceTypeName: String,
  brandName: String,
  modelName: String,

  sparePart: { type: mongoose.Schema.Types.ObjectId, ref: "SparePart" },
  sparePartModel: { type: mongoose.Schema.Types.ObjectId, ref: "SparePartModel" },


  serialNumber: String,
  date: Date,
  image: String,
  imageData: Buffer, // Store image binary data
  imageContentType: String, // Store image MIME type
});

module.exports = mongoose.model("Report", ReportSchema);
