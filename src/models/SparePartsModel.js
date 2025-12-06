const mongoose = require("mongoose");

const SparePartModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sparePart: { type: mongoose.Schema.Types.ObjectId, ref: "SparePart", required: true }
});

module.exports = mongoose.model("SparePartModel", SparePartModelSchema);