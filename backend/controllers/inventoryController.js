const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');

const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, search } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { item: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } }
      ];
    }

    const inventory = await Inventory.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ category: 1, item: 1 });

    const total = await Inventory.countDocuments(query);
    const lowStockItems = await Inventory.countDocuments({ status: 'Low Stock' });
    const outOfStockItems = await Inventory.countDocuments({ status: 'Out of Stock' });

    res.json({
      success: true,
      inventory,
      stats: {
        totalItems: total,
        lowStockItems,
        outOfStockItems
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryItem = await Inventory.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      inventoryItem
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = { ...req.body };
    const existingItem = await Inventory.findById(id);

    if (!existingItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const quantity =
      updates.quantity !== undefined ? Number(updates.quantity) : existingItem.quantity;
    const minimumStock =
      updates.minimumStock !== undefined ? Number(updates.minimumStock) : existingItem.minimumStock;

    if (quantity <= 0) {
      updates.status = 'Out of Stock';
    } else if (quantity <= minimumStock) {
      updates.status = 'Low Stock';
    } else {
      updates.status = 'In Stock';
    }

    updates.lastUpdated = new Date();

    const inventoryItem = await Inventory.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      inventoryItem
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const inventoryItem = await Inventory.findByIdAndDelete(id);
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({ 
      $or: [
        { status: 'Low Stock' },
        { status: 'Out of Stock' }
      ]
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockAlerts
};
