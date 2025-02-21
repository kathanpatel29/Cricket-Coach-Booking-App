const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All report routes need admin authentication
router.use(protect);
router.use(authorize("admin"));

// Dashboard reports
router.get("/summary", reportController.getSummaryReport);
router.get("/earnings", reportController.getEarningsReport);
router.get("/user-activity", reportController.getUserActivityReport);
router.get("/user-stats", reportController.getUserStats);
router.get("/booking-stats", reportController.getBookingStats);
router.get("/revenue-stats", reportController.getRevenueStats);

// Analytics reports
router.get("/coach-performance", reportController.getCoachPerformanceReport);
router.get("/user-analytics", reportController.getUserAnalytics);
router.get("/booking-analytics", reportController.getBookingAnalytics);

// Export reports
router.get("/export/users", reportController.exportUserReport);
router.get("/export/bookings", reportController.exportBookingReport);
router.get("/export/earnings", reportController.exportEarningReport);

// Custom report generation
router.post("/custom", reportController.generateCustomReport);

module.exports = router;