const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/spare.controller");

router.post("/parts", ctrl.createSparePart);
router.post("/brands", ctrl.createSpareBrand);

router.get("/parts", ctrl.getSpareParts);
router.get("/brands", ctrl.getSpareBrands);

module.exports = router;

