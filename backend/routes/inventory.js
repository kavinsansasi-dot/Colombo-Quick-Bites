const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockAlerts
} = require('../controllers/inventoryController');

const router = express.Router();

const createInventoryValidation = [
  body('item').trim().notEmpty().withMessage('Item name is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('category').isIn(['Vegetables', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Packaging']).withMessage('Invalid category'),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be non-negative')
];

const updateInventoryValidation = [
  body('item').optional().trim().notEmpty().withMessage('Item name is required'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('category').optional().isIn(['Vegetables', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Packaging']).withMessage('Invalid category'),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be non-negative')
];

router.get('/', auth, authorize('admin', 'staff'), getInventory);
router.get('/alerts', auth, authorize('admin', 'staff'), getLowStockAlerts);
router.post('/', auth, authorize('admin'), createInventoryValidation, createInventoryItem);
router.put('/:id', auth, authorize('admin', 'staff'), updateInventoryValidation, updateInventoryItem);
router.delete('/:id', auth, authorize('admin'), deleteInventoryItem);

module.exports = router;
