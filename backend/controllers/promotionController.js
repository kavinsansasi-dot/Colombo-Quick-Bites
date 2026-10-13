const Promotion = require('../models/Promotion');
const { validationResult } = require('express-validator');

const getPromotions = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const promotions = await Promotion.find(query)
      .populate('applicableItems', 'name price')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Promotion.countDocuments(query);

    res.json({
      success: true,
      promotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { usageCount: { $lt: '$usageLimit' } }
      ]
    }).populate('applicableItems', 'name price');

    res.json({
      success: true,
      promotions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPromotion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const promotionData = req.body;
    promotionData.promoCode = promotionData.promoCode.toUpperCase();

    const existingPromo = await Promotion.findOne({ promoCode: promotionData.promoCode });
    if (existingPromo) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const promotion = await Promotion.create(promotionData);

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      promotion
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePromotion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    if (updates.promoCode) {
      updates.promoCode = updates.promoCode.toUpperCase();
      
      const existingPromo = await Promotion.findOne({ 
        promoCode: updates.promoCode,
        _id: { $ne: id }
      });
      if (existingPromo) {
        return res.status(400).json({ message: 'Promo code already exists' });
      }
    }

    const promotion = await Promotion.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('applicableItems', 'name price');

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json({
      success: true,
      message: 'Promotion updated successfully',
      promotion
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findByIdAndDelete(id);
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const validatePromoCode = async (req, res) => {
  try {
    const { promoCode, orderAmount } = req.body;
    
    const promotion = await Promotion.findOne({
      promoCode: promoCode.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!promotion) {
      return res.status(400).json({ message: 'Invalid or expired promo code' });
    }

    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    if (orderAmount < promotion.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount is ${promotion.minOrderAmount}` 
      });
    }

    let discount = 0;
    if (promotion.discountType === 'percentage') {
      discount = (orderAmount * promotion.discountValue) / 100;
    } else {
      discount = promotion.discountValue;
    }

    res.json({
      success: true,
      promotion,
      discount,
      finalAmount: orderAmount - discount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPromotions,
  getActivePromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromoCode
};
