const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    maxlength: [300, 'Comment cannot exceed 300 characters'],
    default: ''
  },
  foodQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  deliveryTime: {
    type: Number,
    min: 1,
    max: 5
  },
  service: {
    type: Number,
    min: 1,
    max: 5
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  adminResponse: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

feedbackSchema.index({ customer: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
