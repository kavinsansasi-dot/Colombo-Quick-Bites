const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Promotion title is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'Discount cannot be negative'],
    max: function() {
      return this.discountType === 'percentage' ? 100 : 10000;
    }
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  promoCode: {
    type: String,
    unique: true,
    uppercase: true,
    required: true
  }
}, {
  timestamps: true
});

promotionSchema.pre('save', function() {
  if (this.startDate >= this.endDate) {
    throw new Error('Start date must be before end date');
  }
});

promotionSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate && 
         (this.usageLimit === null || this.usageCount < this.usageLimit);
});

module.exports = mongoose.model('Promotion', promotionSchema);
