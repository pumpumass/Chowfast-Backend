const express = require('express');
const router = express.Router();
const { placeOrder, getUserOrders, getOrder, cancelOrder } = require('../controllers/orderController');
const { protectUser } = require('../middleware/auth');

router.post('/', protectUser, placeOrder);
router.get('/', protectUser, getUserOrders);
router.get('/:id', protectUser, getOrder);
router.put('/:id/cancel', protectUser, cancelOrder);

module.exports = router;
