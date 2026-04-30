const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { upload } = require('../config/cloudinary');

// Get all restaurants (with optional search & filter)
exports.getRestaurants = async (req, res) => {
  try {
    const { search, cuisine, city } = req.query;
    const query = { isActive: true };

    if (search) query.name = { $regex: search, $options: 'i' };
    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (city) query['address.city'] = { $regex: city, $options: 'i' };

    const restaurants = await Restaurant.find(query)
      .select('-password -bankDetails')
      .sort({ rating: -1 });

    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single restaurant with menu
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select('-password -bankDetails');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const menu = await MenuItem.find({ restaurant: req.params.id, isAvailable: true });

    // Group menu by category
    const menuByCategory = menu.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ restaurant, menu: menuByCategory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update restaurant profile (restaurant only)
exports.updateRestaurant = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.email;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      updates,
      { new: true }
    ).select('-password');

    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle restaurant open/closed
exports.toggleOpen = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant._id);
    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();
    res.json({ isOpen: restaurant.isOpen });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get restaurant orders (dashboard)
exports.getRestaurantOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { restaurant: req.restaurant._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name phone')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update order status (restaurant confirms/prepares/marks ready)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, restaurant: req.restaurant._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({ status, note });
    await order.save();

    // Notify user via socket
    const io = req.app.get('io');
    io.to(`order:${order._id}`).emit('order:statusUpdate', { status, note });

    // If ready, notify available riders
    if (status === 'ready') {
      io.emit('order:newPickup', {
        orderId: order._id,
        restaurant: { id: req.restaurant._id, name: req.restaurant.name, address: req.restaurant.address }
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get restaurant stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, revenue] = await Promise.all([
      Order.countDocuments({ restaurant: req.restaurant._id, status: 'delivered' }),
      Order.countDocuments({ restaurant: req.restaurant._id, createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { restaurant: req.restaurant._id, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$subtotal' } } }
      ])
    ]);

    res.json({
      totalOrders,
      todayOrders,
      totalRevenue: revenue[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
