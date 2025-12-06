require("dotenv").config();
const mongoose = require("mongoose");
const SparePart = require("../models/SparePart");
const SparePartModel = require("../models/SparePartModel");

async function upsertSparePart(name) {
  const doc = await SparePart.findOne({ name: new RegExp(`^${name}$`, "i") });
  if (doc) return doc;
  return SparePart.create({ name });
}

async function upsertSpareBrand(name, sparePartId) {
  const doc = await SparePartModel.findOne({ name: new RegExp(`^${name}$`, "i"), sparePart: sparePartId });
  if (doc) return doc;
  return SparePartModel.create({ name, sparePart: sparePartId });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const parts = {
    "مازربورد": ["ASUS", "MSI", "Gigabyte"],
    "باور سبلاي": ["Corsair", "Cooler Master", "Thermaltake"],
    "رامات": ["Kingston", "Crucial", "G.Skill"],
    "هارد": ["Seagate", "Western Digital", "Toshiba"],
    "كابل طاقة": ["Generic"],
    "كابل بيانات": ["Generic"],
  };

  for (const [partName, brands] of Object.entries(parts)) {
    const part = await upsertSparePart(partName);
    for (const b of brands) {
      await upsertSpareBrand(b, part._id);
    }
  }

  await mongoose.disconnect();
}

run().then(() => {
  console.log("Seeded spare parts and brands");
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});

