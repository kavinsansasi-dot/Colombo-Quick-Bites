const MenuItem = require('../models/MenuItem');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

const getMenuItems = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, showAll } = req.query;
    
    // For admin view, show all items unless specifically filtered
    const query = showAll === 'true' || req.user?.role === 'admin' ? {} : { isAvailable: true };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const menuItems = await MenuItem.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ category: 1, name: 1 });

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
      menuItems,
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

const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({
      success: true,
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    console.log('Create menu item request body:', req.body);
    console.log('Create menu item file:', req.file);
    console.log('Request headers:', req.headers);
    
    // Check if req.body exists
    if (!req.body) {
      console.log('Request body is undefined - possible multer issue');
      return res.status(400).json({ message: 'Request body is missing' });
    }
    
    // Extract data from FormData (sent from frontend)
    const name = req.body.name;
    const category = req.body.category;
    const price = req.body.price;
    const description = req.body.description;
    const preparationTime = req.body.preparationTime;
    const isAvailable = req.body.isAvailable;
    const stockQuantity = req.body.stockQuantity;
    const lowStockThreshold = req.body.lowStockThreshold;
    
    console.log('Extracted values:', {
      name,
      category,
      price,
      description,
      preparationTime,
      isAvailable,
      stockQuantity,
      lowStockThreshold
    });
    
    if (!name || !category || !price) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }
    
    const menuItemData = {
      name: name.trim(),
      category,
      price: parseFloat(price),
      description: description?.trim() || '',
      preparationTime: preparationTime ? parseInt(preparationTime) : 15,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' || isAvailable === true : true,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 5
    };

    if (req.file) {
      menuItemData.image = `/uploads/${req.file.filename}`;
    }

    console.log('Menu item data to create:', menuItemData);
    console.log('MenuItem model:', MenuItem);

    const menuItem = await MenuItem.create(menuItemData);
    console.log('Menu item created successfully:', menuItem);
    
    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateMenuItemStock = async (req, res) => {
  try {
    const { items } = req.body; // Array of { menuItemId, quantity }
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const updatedItems = [];
    const outOfStockItems = [];

    for (const item of items) {
      try {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem) {
          continue;
        }

        // Check if enough stock is available
        if (menuItem.stockQuantity < item.quantity) {
          outOfStockItems.push({
            menuItemId: item.menuItemId,
            name: menuItem.name,
            requestedQuantity: item.quantity,
            availableQuantity: menuItem.stockQuantity
          });
          continue;
        }

        // Update stock
        await menuItem.updateStock(item.quantity, 'subtract');
        
        updatedItems.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          previousQuantity: menuItem.stockQuantity + item.quantity,
          newQuantity: menuItem.stockQuantity,
          stockStatus: menuItem.stockStatus,
          isAvailable: menuItem.isAvailable
        });

      } catch (error) {
        console.error(`Error updating stock for item ${item.menuItemId}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      updatedItems,
      outOfStockItems,
      totalUpdated: updatedItems.length,
      totalOutOfStock: outOfStockItems.length
    });

  } catch (error) {
    console.error('Error updating menu item stock:', error);
    res.status(500).json({ message: error.message });
  }
};

const getStockStatus = async (req, res) => {
  try {
    const menuItemId = req.params.menuItemId || req.params.id;
    
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      success: true,
      stockQuantity: menuItem.stockQuantity,
      stockStatus: menuItem.stockStatus,
      lowStockThreshold: menuItem.lowStockThreshold,
      isAvailable: menuItem.isAvailable,
      lastStockUpdate: menuItem.lastStockUpdate
    });

  } catch (error) {
    console.error('Error getting stock status:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    // Handle form data or JSON data
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    // Extract fields from form data or body
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.isAvailable !== undefined) updates.isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
    if (req.body.preparationTime !== undefined) updates.preparationTime = parseInt(req.body.preparationTime);
    if (req.body.stockQuantity !== undefined) updates.stockQuantity = parseInt(req.body.stockQuantity);
    if (req.body.lowStockThreshold !== undefined) updates.lowStockThreshold = parseInt(req.body.lowStockThreshold);

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await MenuItem.findByIdAndDelete(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  getStockStatus,
  updateMenuItemStock,
  upload
};
