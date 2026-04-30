const https = require('https');
const Order = require('../models/Order');

// Initialize Paystack payment
exports.initializePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const params = JSON.stringify({
      email: req.user.email,
      amount: order.total * 100, // Paystack uses kobo
      reference: `chowfast_${orderId}_${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/order-success.html`,
      metadata: {
        orderId: orderId,
        userId: req.user._id
      }
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let data = '';
      paystackRes.on('data', (chunk) => { data += chunk; });
      paystackRes.on('end', async () => {
        const response = JSON.parse(data);
        if (response.status) {
          // Save reference to order
          order.paystackReference = response.data.reference;
          await order.save();
          res.json({ authorizationUrl: response.data.authorization_url, reference: response.data.reference });
        } else {
          res.status(400).json({ message: 'Payment initialization failed' });
        }
      });
    });

    paystackReq.on('error', (err) => res.status(500).json({ message: err.message }));
    paystackReq.write(params);
    paystackReq.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify Paystack payment (webhook or callback)
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    };

    https.request(options, (paystackRes) => {
      let data = '';
      paystackRes.on('data', (chunk) => { data += chunk; });
      paystackRes.on('end', async () => {
        const response = JSON.parse(data);

        if (response.data?.status === 'success') {
          const orderId = response.data.metadata.orderId;
          const order = await Order.findByIdAndUpdate(orderId, {
            paymentStatus: 'paid',
            status: 'confirmed',
            $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed' } }
          }, { new: true });

          // Notify restaurant
          const io = req.app.get('io');
          io.to(`restaurant:${order.restaurant}`).emit('order:new', order);

          res.json({ message: 'Payment verified', order });
        } else {
          res.status(400).json({ message: 'Payment verification failed' });
        }
      });
    }).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
