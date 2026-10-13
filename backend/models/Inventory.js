const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  item: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    enum: ['kg', 'liters', 'pieces', 'boxes'],
    default: 'pieces'
  },
  category: {
    type: String,
    enum: ['Vegetables', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Packaging'],
    required: true
  },
  minimumStock: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  supplier: {
    name: String,
    contact: String
  }
}, {
  timestamps: true
});

inventorySchema.pre('save', function() {
  if (this.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.minimumStock) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  this.lastUpdated = new Date();
});

module.exports = mongoose.model('Inventory', inventorySchema);
