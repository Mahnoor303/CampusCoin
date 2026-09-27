const express = require('express');
const router = express.Router();
const multer = require('multer');

const { importTransactions } = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for in-memory buffer storage (up to 5MB CSV)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files (.csv) are supported'), false);
    }
  },
});

router.use(protect);

// Endpoint accepting file upload (field: 'file') or JSON/raw body
router.post(
  '/transactions',
  upload.single('file'),
  importTransactions
);

module.exports = router;
