const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Burger', 'Pizza', 'Drinks', 'Rice', 'Desserts']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be greater than 0']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  // Stock management fields
  stockQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  lastStockUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update stock status based on quantity
menuItemSchema.pre('save', function() {
  if (this.stockQuantity === 0) {
    this.stockStatus = 'out_of_stock';
    this.isAvailable = false; // Automatically hide from customer menu
  } else if (this.stockQuantity <= this.lowStockThreshold) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
    this.isAvailable = true; // Show in customer menu when in stock
  }
  this.lastStockUpdate = new Date();
});

// Method to update stock
menuItemSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
  } else if (operation === 'add') {
    this.stockQuantity += quantity;
  }
  
  // Update stock status and availability
  if (this.stockQuantity === 0) {
    this.stockStatus = 'out_of_stock';
    this.isAvailable = false;
  } else if (this.stockQuantity <= this.lowStockThreshold) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
    this.isAvailable = true;
  }
  
  this.lastStockUpdate = new Date();
  return this.save();
};

module.exports = mongoose.model('MenuItem', menuItemSchema);
