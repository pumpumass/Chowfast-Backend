const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  vehicleType: { type: String, enum: ['bicycle', 'motorcycle', 'car'], default: 'motorcycle' },
  vehiclePlate: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  currentLocation: {
    lat: Number,
    lng: Number
  },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  }
}, { timestamps: true });

riderSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

riderSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Rider', riderSchema);
