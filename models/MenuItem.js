const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  extras: [{
    name: String,
    price: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
