const DeviceType = require("../models/DeviceType");
const Brand = require("../models/Brand");
const Model = require("../models/Model");

const Report = require("../models/Report");
const SparePart = require("../models/SparePart");



const SparePartModel = require("../models/SparePartModel");

exports.createReport = async (req, res) => {
  try {
     console.log(req.body)

   const sparePartDoc = req.body.sparePart
      ? await SparePart.findOne({ name: new RegExp(`^${req.body.sparePart}$`, "i") })
      : null;
    const spareBrandName = req.body.spareBrand || req.body.sparePartModel;
    const sparePartModelDoc = sparePartDoc && spareBrandName
      ? await SparePartModel.findOne({ name: new RegExp(`^${spareBrandName}$`, "i"), sparePart: sparePartDoc?._id })
      : null;

   
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

      

    

    // Handle both disk storage (local) and memory storage (Vercel)
    let image = null;
    let imageUrl = null;
    
    if (req.file) {
      if (req.file.filename) {
        // Disk storage - use filename (local development)
        image = req.file.filename;
      } else if (req.file.buffer) {
        // Vercel environment - use blob URL
        image = `upload-${Date.now()}-${req.file.originalname}`;
        // Use the blob URL from the middleware if available
        imageUrl = req.blobUrl || null;
        console.log("Image uploaded in memory (Vercel environment). Size:", req.file.buffer.length, "bytes");
      }
    }

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
      imageUrl,
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
    
    // Use the imageUrl from the database (already set during upload)
    const data = { 
      ...fresh
    };
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

// New function to get image by report ID
exports.getReportImage = async (req, res) => {
  try {
    console.log("Getting image for report:", req.params.id);
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      console.log("Report not found:", req.params.id);
      return res.status(404).json({ error: "Report not found" });
    }
    
    if (!report.imageData) {
      console.log("Image data not found for report:", req.params.id, "Image field:", report.image);
      return res.status(404).json({ error: "Image not found" });
    }
    
    console.log("Sending image data. Size:", report.imageData.length, "bytes, Type:", report.imageContentType);
    
    // Set appropriate content type and headers for web browsers
    res.set('Content-Type', report.imageContentType || 'image/jpeg');
    res.set('Content-Length', report.imageData.length);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the image data
    res.send(report.imageData);
    
  } catch (e) {
    console.error("getReportImage error", e);
    
    // Return proper error response instead of crashing
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to load image" });
    }
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
      
      // Handle image URL based on environment
      if (obj.image) {
        // Check if we're in Vercel environment
        const isVercel = process.env.VERCEL || process.env.NOW_REGION;
        if (isVercel) {
          // Vercel environment - images cannot be served statically
          obj.imageUrl = null;
        } else {
          // Local development - construct file URL
          obj.imageUrl = `${base}/uploads/${obj.image}`;
        }
      } else {
        obj.imageUrl = '';
      }
      
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
