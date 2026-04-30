const express = require('express');
const router = express.Router();
const { getMenu, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } = require('../controllers/menuController');
const { protectRestaurant } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public
router.get('/:restaurantId', getMenu);

// Restaurant protected
router.post('/', protectRestaurant, upload.single('image'), addMenuItem);
router.put('/:id', protectRestaurant, upload.single('image'), updateMenuItem);
router.delete('/:id', protectRestaurant, deleteMenuItem);
router.put('/:id/toggle', protectRestaurant, toggleAvailability);

module.exports = router;
