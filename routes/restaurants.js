const express = require('express');
const router = express.Router();
const {
  getRestaurants, getRestaurant, updateRestaurant,
  toggleOpen, getRestaurantOrders, updateOrderStatus, getStats
} = require('../controllers/restaurantController');
const { protectRestaurant } = require('../middleware/auth');

// Public
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);

// Restaurant protected
router.put('/profile/update', protectRestaurant, updateRestaurant);
router.put('/profile/toggle-open', protectRestaurant, toggleOpen);
router.get('/dashboard/orders', protectRestaurant, getRestaurantOrders);
router.put('/dashboard/orders/:orderId/status', protectRestaurant, updateOrderStatus);
router.get('/dashboard/stats', protectRestaurant, getStats);

module.exports = router;
