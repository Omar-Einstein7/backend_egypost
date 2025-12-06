const mongoose = require("mongoose");


const SparePartSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model("SparePart", SparePartSchema);