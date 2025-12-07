const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const ctrl = require("../controllers/report.controller");

router.post("/", upload.single("image"), ctrl.createReport);
router.get("/", ctrl.getReports);
router.get("/:id/image", ctrl.getReportImage);

module.exports = router;
