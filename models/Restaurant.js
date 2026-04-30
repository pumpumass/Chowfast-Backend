const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  logo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  description: { type: String, default: '' },
  cuisine: [{ type: String }],
  address: {
    street: String,
    city: { type: String, default: 'Lagos' },
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  openingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '22:00' }
  },
  isOpen: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  deliveryFee: { type: Number, default: 500 },
  minOrder: { type: Number, default: 1000 },
  estimatedDeliveryTime: { type: Number, default: 30 }, // minutes
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  }
}, { timestamps: true });

restaurantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

restaurantSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
