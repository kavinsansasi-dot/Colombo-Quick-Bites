const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true,
    min: [0, 'Total must be greater than 0']
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String
  },
  phone: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online'],
    default: 'Cash'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedDeliveryTime: {
    type: Date,
    default: () => new Date(Date.now() + 45 * 60 * 1000)
  }
}, {
  timestamps: true
});

orderSchema.methods.calculateTotal = function() {
  this.total = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  return this.total;
};

module.exports = mongoose.model('Order', orderSchema);
