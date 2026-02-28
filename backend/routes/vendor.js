const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { vendorAuth } = require('../middleware/auth');

const router = express.Router();

// Apply vendor authentication to all routes
router.use(vendorAuth);

// @route   GET /api/vendor/dashboard
// @desc    Get vendor dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get vendor's products statistics
    const totalProducts = await Product.countDocuments({ vendor: vendorId });
    const activeProducts = await Product.countDocuments({ 
      vendor: vendorId, 
      isActive: true 
    });

    // Get vendor's orders statistics
    const orderStats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.vendor': vendorId } },
      {
        $group: {
          _id: '$orderNumber',
          totalAmount: { $sum: '$items.total' },
          status: { $first: '$status' },
          createdAt: { $first: '$createdAt' }
        }
      }
    ]);

    const totalOrders = orderStats.length;
    const pendingOrders = orderStats.filter(order => order.status === 'pending').length;
    const confirmedOrders = orderStats.filter(order => order.status === 'confirmed').length;
    const completedOrders = orderStats.filter(order => order.status === 'delivered').length;

    // Calculate revenue
    const totalRevenue = orderStats
      .filter(order => ['delivered', 'shipped'].includes(order.status))
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get recent orders
    const recentOrders = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.vendor': vendorId } },
      {
        $group: {
          _id: '$_id',
          orderNumber: { $first: '$orderNumber' },
          status: { $first: '$status' },
          createdAt: { $first: '$createdAt' },
          user: { $first: '$user' },
          items: {
            $push: {
              product: '$items.product',
              quantity: '$items.quantity',
              total: '$items.total'
            }
          },
          pricing: { $first: '$pricing' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);

    // Get top performing products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.vendor': vendorId } },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }
    ]);

    res.json({
      statistics: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        completedOrders,
        totalRevenue
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/vendor/products
// @desc    Get vendor's products
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search
    } = req.query;

    // Build filter object
    const filter = { vendor: req.user._id };
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// @route   POST /api/vendor/products
// @desc    Create a new product
router.post('/products', async (req, res) => {
  try {
    const productData = {
      ...req.body,
      vendor: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// @route   PUT /api/vendor/products/:id
// @desc    Update a product
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// @route   DELETE /api/vendor/products/:id
// @desc    Delete a product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// @route   GET /api/vendor/orders
// @desc    Get vendor's orders
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate
    } = req.query;

    // Build filter for orders containing vendor's products
    const matchStage = {
      $match: {
        'product.vendor': req.user._id
      }
    };

    if (status && status !== 'all') {
      matchStage.$match.status = status;
    }

    if (startDate || endDate) {
      matchStage.$match.createdAt = {};
      if (startDate) matchStage.$match.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.$match.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      matchStage,
      {
        $group: {
          _id: '$_id',
          orderNumber: { $first: '$orderNumber' },
          status: { $first: '$status' },
          createdAt: { $first: '$createdAt' },
          user: { $first: '$user' },
          items: {
            $push: {
              product: '$items.product',
              quantity: '$items.quantity',
              total: '$items.total'
            }
          },
          pricing: { $first: '$pricing' },
          shippingAddress: { $first: '$shippingAddress' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit * 1 }
    ]);

    // Get total count
    const totalOrders = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.vendor': req.user._id } },
      { $count: 'total' }
    ]);

    const total = totalOrders[0]?.total || 0;

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// @route   GET /api/vendor/profile
// @desc    Get vendor profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// @route   PUT /api/vendor/profile
// @desc    Update vendor profile
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, brandName, brandDescription } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    
    // Add brand information if not present
    if (brandName && !user.brandName) {
      user.brandName = brandName;
    }
    if (brandDescription && !user.brandDescription) {
      user.brandDescription = brandDescription;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        brandName: user.brandName,
        brandDescription: user.brandDescription
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

module.exports = router;
