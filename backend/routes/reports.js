const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect, restrictTo } = require("../middleware/auth");

router.get("/summary", protect, restrictTo("admin"), reportController.getSummaryReport);
router.get("/earnings", protect, restrictTo("admin"), reportController.getEarningsReport);
router.get("/user-activity", protect, restrictTo("admin"), reportController.getUserActivityReport);

module.exports = router;
