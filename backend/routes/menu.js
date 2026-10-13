const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  getStockStatus,
  updateMenuItemStock,
  upload
} = require('../controllers/menuController');

const router = express.Router();

const createMenuItemValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('category').isIn(['Burger', 'Pizza', 'Drinks', 'Rice', 'Desserts']).withMessage('Invalid category'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Price must be greater than 0'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

const updateMenuItemValidation = [
  body('name').optional().trim().notEmpty().withMessage('Item name is required'),
  body('category').optional().isIn(['Burger', 'Pizza', 'Drinks', 'Rice', 'Desserts']).withMessage('Invalid category'),
  body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be greater than 0'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

// Validation middleware wrapper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const uploadSingleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'Image must be 5MB or smaller' });
      }
      return res.status(400).json({ message: err.message });
    }

    return res.status(400).json({ message: err.message || 'Invalid image upload' });
  });
};

router.get('/', getMenuItems);
router.get('/categories', getCategories);
router.get('/:id/stock', getStockStatus);
router.get('/:id', getMenuItemById);
router.post('/', uploadSingleImage, createMenuItemValidation, handleValidationErrors, createMenuItem);
router.put('/stock', auth, updateMenuItemStock);
router.put('/:id', auth, authorize('admin'), uploadSingleImage, updateMenuItemValidation, handleValidationErrors, updateMenuItem);
router.delete('/:id', auth, authorize('admin'), deleteMenuItem);

module.exports = router;
