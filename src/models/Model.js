const mongoose = require("mongoose");

const ModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" }
});

module.exports = mongoose.model("Model", ModelSchema);