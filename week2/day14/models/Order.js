'use strict';

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user']
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
      }
    }
  ],
  shippingAddress: {
    street: { type: String, required: [true, 'Street address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    zipCode: { type: String, required: [true, 'Zip code is required'] },
    country: { type: String, required: [true, 'Country is required'] }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate totalAmount if not explicitly set
orderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  } else {
    this.totalAmount = 0;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
