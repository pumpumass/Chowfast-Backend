const express = require('express');
const router = express.Router();
const {
  getRiderProfile, toggleOnline, updateLocation,
  getAvailableOrders, acceptOrder, completeDelivery, getDeliveryHistory
} = require('../controllers/riderController');
const { protectRider } = require('../middleware/auth');

router.get('/profile', protectRider, getRiderProfile);
router.put('/toggle-online', protectRider, toggleOnline);
router.put('/location', protectRider, updateLocation);
router.get('/orders/available', protectRider, getAvailableOrders);
router.put('/orders/:orderId/accept', protectRider, acceptOrder);
router.put('/orders/:orderId/complete', protectRider, completeDelivery);
router.get('/orders/history', protectRider, getDeliveryHistory);

module.exports = router;
