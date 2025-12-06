const DeviceType = require("../models/DeviceType");
const Brand = require("../models/Brand");
const Model = require("../models/Model");

const Report = require("../models/Report");
const SparePart = require("../models/SparePart");



const SparePartModel = require("../models/SparePartModel");
// exports.createReport = async (req, res) => {
//   try {


//     console.log("REQ BODY:", req.body);
// console.log("LOOKUP:", {
//   dt: await DeviceType.findOne({ name: req.body.deviceType }),
//   br: await Brand.findOne({ name: req.body.brand }),
//   md: await Model.findOne({ name: req.body.model }),
// });
//     const image = req.file ? req.file.filename : null;


// const deviceTypeDoc = await DeviceType.findOne({ name: new RegExp(`^${req.body.deviceType.trim()}$`, "i") });
// const brandDoc = await Brand.findOne({ name: new RegExp(`^${req.body.brand.trim()}$`, "i") });
// const modelDoc = await Model.findOne({ name: new RegExp(`^${req.body.model.trim()}$`, "i") });


//     if (!deviceTypeDoc || !brandDoc || !modelDoc) {
//       return res.status(400).json({ error: "Invalid deviceType / brand / model" });
//     }

//     const payload = {
//       region: req.body.region,
//       technicianName: req.body.technicianName,
//       serialNumber: req.body.serialNumber,
//       date: req.body.date ? new Date(req.body.date) : undefined,
//       // deviceType: req.body.deviceType,
//       // brand: req.body.brand,
//       // model: req.body.model,
//       deviceType: deviceTypeDoc._id,
//       brand: brandDoc._id,
//       model: modelDoc._id,
//       image
//     };
//     Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

//     const report = await Report.create(payload);
//     const base = `${req.protocol}://${req.get('host')}`;
//     const response = { ...report.toObject(), imageUrl: image ? `${base}/uploads/${image}` : null };
//     res.status(201).json(response);
//   } catch (e) {
//     console.error('createReport error', e);
//     res.status(500).json({ error: e.message });
//   }
// };

exports.createReport = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

   const sparePartDoc = req.body.sparePart
      ? await SparePart.findOne({ name: new RegExp(`^${req.body.sparePart}$`, "i") })
      : null;
    const spareBrandName = req.body.spareBrand || req.body.sparePartModel;
    const sparePartModelDoc = sparePartDoc && spareBrandName
      ? await SparePartModel.findOne({ name: new RegExp(`^${spareBrandName}$`, "i"), sparePart: sparePartDoc?._id })
      : null;

    // const { sparePart: spName, sparePartModel: spModelName } = req.body;

    // // Lookup sparePart
    // const sparePartDoc = spName ? await SparePart.findOne({ name: spName }) : null;

    // // Lookup sparePartModel (اختياري)
    // let sparePartModelDoc = null;
    // if (sparePartDoc && spModelName) {
    //   sparePartModelDoc = await SparePartModel.findOne({ 
    //     name: spModelName,
    //     sparePart: sparePartDoc._id
    //   });
    // }

    // normalize incoming strings (avoid "null" string)
    const dtName = req.body.deviceType ? req.body.deviceType.toString().trim() : "";
    const brName = req.body.brand ? req.body.brand.toString().trim() : "";
    const mdName = req.body.model ? req.body.model.toString().trim() : "";

    // treat literal "null" or empty as missing
    const clean = (s) => (!s || s.toLowerCase() === "null" ? "" : s);

    const deviceTypeName = clean(dtName);
    const brandName = clean(brName);
    const modelName = clean(mdName);

    // console.log("LOOKUP NAMES:", { deviceTypeName, brandName, modelName });

    // find documents by name (case-insensitive, trim)
    let deviceTypeDoc = deviceTypeName
      ? await DeviceType.findOne({ name: new RegExp(`^${deviceTypeName}$`, "i") })
      : null;
    let brandDoc = brandName
      ? await Brand.findOne({ name: new RegExp(`^${brandName}$`, "i") })
      : null;
    let modelDoc = modelName
      ? await Model.findOne({ name: new RegExp(`^${modelName}$`, "i") })
      : null;

    if (!deviceTypeDoc && deviceTypeName) {
      deviceTypeDoc = await DeviceType.create({ name: deviceTypeName });
    }
    if (!brandDoc && brandName) {
      brandDoc = await Brand.create({ name: brandName, deviceType: deviceTypeDoc?._id });
    }
    if (!modelDoc && modelName) {
      modelDoc = await Model.create({ name: modelName, brand: brandDoc?._id });
    }

      

    

    const image = req.file ? req.file.filename : null;

    const payload = {
       sparePart: sparePartDoc?._id,
      sparePartModel: sparePartModelDoc?._id,
      region: req.body.region,
      technicianName: req.body.technicianName,
      serialNumber: req.body.serialNumber,
      date: req.body.date ? new Date(req.body.date) : undefined,
      deviceType: deviceTypeDoc ? deviceTypeDoc._id : undefined,
      brand: brandDoc ? brandDoc._id : undefined,
      model: modelDoc ? modelDoc._id : undefined,
      deviceTypeName,
      brandName,
      modelName,
      image,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const report = await Report.create(payload);
    const base = `${req.protocol}://${req.get("host")}`;
    const fresh = await Report.findById(report._id)
      .populate('deviceType')
      .populate('brand')
      .populate('model')
      .populate('sparePart')
      .populate('sparePartModel')
      .lean();
    const data = { ...fresh, imageUrl: fresh?.image ? `${base}/uploads/${fresh.image}` : null };
    if (data.sparePartModel && !data.spareBrand) data.spareBrand = data.sparePartModel;
    if (!data.deviceType && data.deviceTypeName) data.deviceType = data.deviceTypeName;
    if (!data.brand && data.brandName) data.brand = data.brandName;
    if (!data.model && data.modelName) data.model = data.modelName;
    res.status(201).json({ data });
  } catch (e) {
    console.error("createReport error", e);
    res.status(500).json({ error: e.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { region, deviceType, brand, model, technician, start, end, page = 1, limit = 10 } = req.query;

    let filter = {};

    if (region) filter.region = region;
    if (technician) filter.technicianName = technician;
    if (deviceType) filter.deviceType = deviceType;
    if (brand) filter.brand = brand;
    if (model) filter.model = model;

    if (start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    const skip = (page - 1) * limit;

    const data = await Report.find(filter)
    .populate('deviceType')
    .populate('brand')
    .populate('model')
    .populate("sparePart")
    .populate("sparePartModel")
    .skip(skip)
    .limit(Number(limit));

    const count = await Report.countDocuments(filter);

    const base = `${req.protocol}://${req.get("host")}`;
    const normalized = data.map((d) => {
      const obj = d.toObject();
      if (obj.sparePartModel && !obj.spareBrand) obj.spareBrand = obj.sparePartModel;
      obj.imageUrl = obj.image ? `${base}/uploads/${obj.image}` : '';
      if (!obj.deviceType && obj.deviceTypeName) obj.deviceType = obj.deviceTypeName;
      if (!obj.brand && obj.brandName) obj.brand = obj.brandName;
      if (!obj.model && obj.modelName) obj.model = obj.modelName;
      return obj;
    });

    res.json({
      total: count,
      page: Number(page),
      limit: Number(limit),
      data: normalized
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
