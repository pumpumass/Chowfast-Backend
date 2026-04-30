const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware

app.use(express.json());
app.use(cors({ origin: '*', credentials: false }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/riders', require('./routes/riders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/', (req, res) => res.json({ message: 'ChowFast API running 🍔' }));

// Socket.io real-time events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Rider joins their own room
  socket.on('rider:join', (riderId) => {
    socket.join(`rider:${riderId}`);
    console.log(`Rider ${riderId} joined their room`);
  });

  // User joins order tracking room
  socket.on('order:track', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Tracking order ${orderId}`);
  });

  // Restaurant joins their room
  socket.on('restaurant:join', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
  });

  // Rider updates location
  socket.on('rider:location', ({ orderId, location }) => {
    io.to(`order:${orderId}`).emit('rider:locationUpdate', location);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 ChowFast server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
