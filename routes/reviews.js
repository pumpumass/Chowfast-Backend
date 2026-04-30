const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { protectUser } = require('../middleware/auth');

// Submit review
router.post('/', protectUser, async (req, res) => {
  try {
    const { orderId, rating, comment, riderRating } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id, status: 'delivered' });
    if (!order) return res.status(404).json({ message: 'Order not found or not delivered' });

    const existing = await Review.findOne({ order: orderId });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });

    const review = await Review.create({
      user: req.user._id,
      restaurant: order.restaurant,
      order: orderId,
      rating, comment, riderRating
    });

    // Update restaurant rating
    const reviews = await Review.find({ restaurant: order.restaurant });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Restaurant.findByIdAndUpdate(order.restaurant, {
      rating: avgRating.toFixed(1),
      totalRatings: reviews.length
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get reviews for a restaurant
router.get('/:restaurantId', async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
