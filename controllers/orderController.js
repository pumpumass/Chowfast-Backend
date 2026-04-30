const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// Place a new order (user)
exports.placeOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, note } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    if (!restaurant.isOpen) return res.status(400).json({ message: 'Restaurant is currently closed' });

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ message: `${item.name} is not available` });
      }
      const extrasTotal = (item.extras || []).reduce((sum, e) => sum + e.price, 0);
      const itemTotal = (menuItem.price + extrasTotal) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        extras: item.extras || []
      });
    }

    if (subtotal < restaurant.minOrder) {
      return res.status(400).json({ message: `Minimum order is ₦${restaurant.minOrder}` });
    }

    const deliveryFee = restaurant.deliveryFee;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      deliveryAddress,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      note,
      estimatedDeliveryTime: restaurant.estimatedDeliveryTime,
      statusHistory: [{ status: 'pending', note: 'Order placed' }]
    });

    await order.populate(['user', 'restaurant']);

    // Notify restaurant via socket
    const io = req.app.get('io');
    io.to(`restaurant:${restaurantId}`).emit('order:new', order);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name logo address')
      .populate('rider', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single order (user)
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('restaurant', 'name logo address phone')
      .populate('rider', 'name phone currentLocation avatar');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel order (user, only if pending)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel order at this stage' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by user' });
    await order.save();

    const io = req.app.get('io');
    io.to(`restaurant:${order.restaurant}`).emit('order:cancelled', { orderId: order._id });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
