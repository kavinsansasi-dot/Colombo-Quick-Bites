const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getPromotions,
  getActivePromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromoCode
} = require('../controllers/promotionController');

const router = express.Router();

const createPromotionValidation = [
  body('title').trim().notEmpty().withMessage('Promotion title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be non-negative'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('promoCode').isAlphanumeric().withMessage('Promo code must be alphanumeric')
];

const updatePromotionValidation = [
  body('title').optional().trim().notEmpty().withMessage('Promotion title is required'),
  body('description').optional().trim().notEmpty().withMessage('Description is required'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').optional().isFloat({ min: 0 }).withMessage('Discount value must be non-negative'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('promoCode').optional().isAlphanumeric().withMessage('Promo code must be alphanumeric')
];

const validatePromoValidation = [
  body('promoCode').isAlphanumeric().withMessage('Promo code must be alphanumeric'),
  body('orderAmount').isFloat({ min: 0 }).withMessage('Order amount must be non-negative')
];

router.get('/', auth, authorize('admin'), getPromotions);
router.get('/active', getActivePromotions);
router.post('/validate', validatePromoValidation, validatePromoCode);
router.post('/', auth, authorize('admin'), createPromotionValidation, createPromotion);
router.put('/:id', auth, authorize('admin'), updatePromotionValidation, updatePromotion);
router.delete('/:id', auth, authorize('admin'), deletePromotion);

module.exports = router;
