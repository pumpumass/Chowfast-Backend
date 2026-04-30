const express = require('express');
const router = express.Router();
const { initializePayment, verifyPayment } = require('../controllers/paymentController');
const { protectUser } = require('../middleware/auth');

router.post('/initialize', protectUser, initializePayment);
router.get('/verify/:reference', verifyPayment);

module.exports = router;
