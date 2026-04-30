const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Rider = require('../models/Rider');
const { generateToken } = require('../middleware/auth');

// ========== USER AUTH ==========
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password });
    const token = generateToken(user._id, 'user');

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: 'user' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, 'user');
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: 'user' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========== RESTAURANT AUTH ==========
exports.registerRestaurant = async (req, res) => {
  try {
    const { name, email, phone, password, address, cuisine } = req.body;
    const exists = await Restaurant.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const restaurant = await Restaurant.create({ name, email, phone, password, address, cuisine });
    const token = generateToken(restaurant._id, 'restaurant');

    res.status(201).json({
      token,
      restaurant: { id: restaurant._id, name: restaurant.name, email: restaurant.email, role: 'restaurant' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginRestaurant = async (req, res) => {
  try {
    const { email, password } = req.body;
    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant || !(await restaurant.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(restaurant._id, 'restaurant');
    res.json({
      token,
      restaurant: { id: restaurant._id, name: restaurant.name, email: restaurant.email, role: 'restaurant' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========== RIDER AUTH ==========
exports.registerRider = async (req, res) => {
  try {
    const { name, email, phone, password, vehicleType, vehiclePlate } = req.body;
    const exists = await Rider.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const rider = await Rider.create({ name, email, phone, password, vehicleType, vehiclePlate });
    const token = generateToken(rider._id, 'rider');

    res.status(201).json({
      token,
      rider: { id: rider._id, name: rider.name, email: rider.email, role: 'rider' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginRider = async (req, res) => {
  try {
    const { email, password } = req.body;
    const rider = await Rider.findOne({ email });
    if (!rider || !(await rider.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(rider._id, 'rider');
    res.json({
      token,
      rider: { id: rider._id, name: rider.name, email: rider.email, role: 'rider' }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
