const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  getUserTransactions,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getPlatformStatistics,
} = require("../controllers/adminController");

// All admin routes require authentication AND admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/statistics", getPlatformStatistics);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/users/:id/transactions", getUserTransactions);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

module.exports = router;
