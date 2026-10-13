const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats
} = require('../controllers/orderController');

const router = express.Router();

const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.city').notEmpty().withMessage('City is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required')
];

const updateStatusValidation = [
  body('status').isIn(['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled']).withMessage('Invalid status'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid staff ID')
];

router.post('/', auth, createOrderValidation, createOrder);
router.get('/', auth, getOrders);
router.get('/dashboard', auth, authorize('admin'), getDashboardStats);
router.get('/:id', auth, getOrderById);
router.put('/:id/status', auth, authorize('admin', 'staff'), updateStatusValidation, updateOrderStatus);

module.exports = router;
