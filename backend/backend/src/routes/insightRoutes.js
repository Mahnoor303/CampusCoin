const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getInsights,
  generateInsights,
  getTips,
  markInsightRead,
  toggleInsightPin,
} = require("../controllers/insightController");

// All insight routes require authentication
router.use(protect);

// Tips (real-time, not persisted)
router.get("/tips", getTips);

// Persisted insights
router.get("/", getInsights);
router.post("/generate", generateInsights);
router.patch("/:id/read", markInsightRead);
router.patch("/:id/pin", toggleInsightPin);

module.exports = router;
