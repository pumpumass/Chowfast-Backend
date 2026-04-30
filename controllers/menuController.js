const MenuItem = require('../models/MenuItem');

// Get menu for a restaurant
exports.getMenu = async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant: req.params.restaurantId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add menu item (restaurant only)
exports.addMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, extras } = req.body;
    const image = req.file?.path || '';

    const item = await MenuItem.create({
      restaurant: req.restaurant._id,
      name, description, price, category, extras, image
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, restaurant: req.restaurant._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const updates = req.body;
    if (req.file) updates.image = req.file.path;

    Object.assign(item, updates);
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: req.restaurant._id });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle item availability
exports.toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, restaurant: req.restaurant._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({ isAvailable: item.isAvailable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
