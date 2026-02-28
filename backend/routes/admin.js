const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic statistics
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });

    // Get order statistics by status
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $match: { 'payment.status': 'paid' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    // Get monthly revenue (last 6 months)
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          'payment.status': 'paid',
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      statistics: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalVendors,
        revenue: revenueStats[0]?.totalRevenue || 0,
        avgOrderValue: revenueStats[0]?.avgOrderValue || 0
      },
      orderStats,
      recentOrders,
      topProducts,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders with filtering
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

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

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.status = status;
    order.timeline.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id
    });

    // Add tracking information if order is shipped
    if (status === 'shipped') {
      const { trackingNumber, courier, estimatedDelivery } = req.body;
      if (trackingNumber) {
        order.tracking = {
          trackingNumber,
          courier: courier || 'Standard Shipping',
          trackingUrl: `https://track.example.com/${trackingNumber}`,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null
        };
      }
    }

    await order.save();
    await order.populate('user', 'firstName lastName email phone');

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating order status' });
  }
});

// @route   GET /api/admin/products
// @desc    Get all products for admin
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      vendor,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (vendor) {
      filter.vendor = vendor;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const products = await Product.find(filter)
      .populate('vendor', 'firstName lastName email brandName')
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

// @route   PUT /api/admin/products/:id/approve
// @desc    Approve or reject a product
router.put('/products/:id/approve', async (req, res) => {
  try {
    const { approved, reason } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = approved;
    
    await product.save();

    res.json({
      message: `Product ${approved ? 'approved' : 'rejected'} successfully`,
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while approving product' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate or deactivate a user
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

module.exports = router;
