const Rider = require('../models/Rider');
const Order = require('../models/Order');

// Get rider profile
exports.getRiderProfile = async (req, res) => {
  try {
    const rider = await Rider.findById(req.rider._id).select('-password');
    res.json(rider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle rider online/offline
exports.toggleOnline = async (req, res) => {
  try {
    const rider = await Rider.findById(req.rider._id);
    rider.isOnline = !rider.isOnline;
    await rider.save();
    res.json({ isOnline: rider.isOnline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update rider location
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const rider = await Rider.findByIdAndUpdate(
      req.rider._id,
      { currentLocation: { lat, lng } },
      { new: true }
    );

    // If rider has an active order, broadcast location
    if (rider.currentOrder) {
      const io = req.app.get('io');
      io.to(`order:${rider.currentOrder}`).emit('rider:locationUpdate', { lat, lng });
    }

    res.json({ lat, lng });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get available orders for pickup (ready orders near rider)
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'ready', rider: null })
      .populate('restaurant', 'name address logo')
      .populate('user', 'name phone')
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Accept an order
exports.acceptOrder = async (req, res) => {
  try {
    const rider = await Rider.findById(req.rider._id);
    if (rider.currentOrder) {
      return res.status(400).json({ message: 'You already have an active order' });
    }

    const order = await Order.findOne({ _id: req.params.orderId, status: 'ready', rider: null });
    if (!order) return res.status(404).json({ message: 'Order not available' });

    order.rider = rider._id;
    order.status = 'picked_up';
    order.statusHistory.push({ status: 'picked_up', note: 'Rider picked up order' });
    await order.save();

    rider.currentOrder = order._id;
    await rider.save();

    // Notify user
    const io = req.app.get('io');
    io.to(`order:${order._id}`).emit('order:statusUpdate', {
      status: 'picked_up',
      rider: { id: rider._id, name: rider.name, phone: rider.phone }
    });

    await order.populate(['restaurant', 'user']);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark order as delivered
exports.completeDelivery = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, rider: req.rider._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'delivered';
    order.paymentStatus = 'paid';
    order.statusHistory.push({ status: 'delivered', note: 'Order delivered successfully' });
    await order.save();

    // Update rider stats
    await Rider.findByIdAndUpdate(req.rider._id, {
      currentOrder: null,
      $inc: { totalDeliveries: 1, earnings: 500 } // ₦500 per delivery
    });

    const io = req.app.get('io');
    io.to(`order:${order._id}`).emit('order:statusUpdate', { status: 'delivered' });

    res.json({ message: 'Delivery confirmed', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get rider's delivery history
exports.getDeliveryHistory = async (req, res) => {
  try {
    const orders = await Order.find({ rider: req.rider._id, status: 'delivered' })
      .populate('restaurant', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
