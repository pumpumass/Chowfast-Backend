const express = require('express');
const router = express.Router();
const {
  registerUser, loginUser,
  registerRestaurant, loginRestaurant,
  registerRider, loginRider
} = require('../controllers/authController');

// User
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);

// Restaurant
router.post('/restaurant/register', registerRestaurant);
router.post('/restaurant/login', loginRestaurant);

// Rider
router.post('/rider/register', registerRider);
router.post('/rider/login', loginRider);

module.exports = router;
