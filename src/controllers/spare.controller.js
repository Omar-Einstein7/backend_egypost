const SparePart = require("../models/SpareParts");
const SparePartModel = require("../models/SparePartsModel");

exports.createSparePart = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });

    const existing = await SparePart.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (existing) return res.status(200).json({ data: existing });

    const created = await SparePart.create({ name });
    res.status(201).json({ data: created });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createSpareBrand = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const sparePartId = req.body.sparePartId || req.body.sparePart;
    const sparePartName = req.body.sparePartName || req.body.sparePart;

    if (!name) return res.status(400).json({ error: "name is required" });

    let sparePartDoc = null;
    if (sparePartId) {
      sparePartDoc = await SparePart.findById(sparePartId).catch(() => null);
    }
    if (!sparePartDoc && sparePartName) {
      sparePartDoc = await SparePart.findOne({ name: new RegExp(`^${sparePartName}$`, "i") });
    }
    if (!sparePartDoc) return res.status(400).json({ error: "sparePart not found" });

    const existing = await SparePartModel.findOne({ name: new RegExp(`^${name}$`, "i"), sparePart: sparePartDoc._id });
    if (existing) return res.status(200).json({ data: existing });

    const created = await SparePartModel.create({ name, sparePart: sparePartDoc._id });
    res.status(201).json({ data: created });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getSpareParts = async (req, res) => {
  try {
    const list = await SparePart.find({}).sort({ name: 1 });
    res.json({ data: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getSpareBrands = async (req, res) => {
  try {
    const { sparePart, sparePartName } = req.query;
    let filter = {};

    if (sparePart || sparePartName) {
      let sparePartDoc = null;
      if (sparePart) {
        sparePartDoc = await SparePart.findById(sparePart).catch(() => null);
      }
      if (!sparePartDoc && sparePartName) {
        sparePartDoc = await SparePart.findOne({ name: new RegExp(`^${sparePartName}$`, "i") });
      }
      if (sparePartDoc) {
        filter.sparePart = sparePartDoc._id;
      }
    }

    const list = await SparePartModel.find(filter).sort({ name: 1 });
    res.json({ data: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

