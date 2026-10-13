const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  createFeedback,
  getFeedback,
  getCustomerFeedback,
  respondToFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');

const router = express.Router();

const createFeedbackValidation = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 300 }).withMessage('Comment cannot exceed 300 characters'),
  body('foodQuality').optional().isInt({ min: 1, max: 5 }).withMessage('Food quality rating must be between 1 and 5'),
  body('deliveryTime').optional().isInt({ min: 1, max: 5 }).withMessage('Delivery time rating must be between 1 and 5'),
  body('service').optional().isInt({ min: 1, max: 5 }).withMessage('Service rating must be between 1 and 5')
];

const respondFeedbackValidation = [
  body('adminResponse').trim().notEmpty().withMessage('Admin response is required')
];

router.get('/', auth, authorize('admin'), getFeedback);
router.get('/stats', auth, authorize('admin'), getFeedbackStats);
router.get('/my-feedback', auth, getCustomerFeedback);
router.post('/', auth, createFeedbackValidation, createFeedback);
router.put('/:id/respond', auth, authorize('admin'), respondFeedbackValidation, respondToFeedback);

module.exports = router;
