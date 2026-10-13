const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, rating, comment, foodQuality, deliveryTime, service } = req.body;

    const order = await Order.findOne({ _id: orderId, customer: req.user.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Feedback can only be given for delivered orders' });
    }

    const existingFeedback = await Feedback.findOne({ customer: req.user.id, order: orderId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this order' });
    }

    const feedback = await Feedback.create({
      customer: req.user.id,
      order: orderId,
      rating,
      comment,
      foodQuality,
      deliveryTime,
      service
    });

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('customer', 'name')
      .populate('order', 'total createdAt');

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: populatedFeedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, isResolved } = req.query;
    const query = {};
    
    if (rating) query.rating = parseInt(rating);
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';

    const feedback = await Feedback.find(query)
      .populate('customer', 'name email')
      .populate('order', 'total createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      feedback,
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

const getCustomerFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ customer: req.user.id })
      .populate('order', 'total createdAt status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const respondToFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { adminResponse } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { adminResponse, isResolved: true },
      { new: true }
    ).populate('customer', 'name email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({
      success: true,
      message: 'Response added successfully',
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const averageRating = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const ratingDistribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const unresolvedCount = await Feedback.countDocuments({ isResolved: false });

    res.json({
      success: true,
      stats: {
        totalFeedback,
        averageRating: averageRating[0]?.avgRating || 0,
        ratingDistribution,
        unresolvedCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFeedback,
  getFeedback,
  getCustomerFeedback,
  respondToFeedback,
  getFeedbackStats
};
