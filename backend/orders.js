const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const Razorpay = require('razorpay');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   GET /api/orders
// @desc    Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('items.product', 'name images price')
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

// @route   GET /api/orders/:id
// @desc    Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images price vendor')
      .populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user or user is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching order' });
  }
});

// @route   POST /api/orders/create
// @desc    Create a new order
router.post('/create', auth, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod = 'razorpay'
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${item.product} not found or not available` });
      }

      // Check stock
      if (product.stock.trackInventory && product.stock.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}`,
          availableStock: product.stock.quantity 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });

      // Update stock
      if (product.stock.trackInventory) {
        product.stock.quantity -= item.quantity;
        await product.save();
      }
    }

    // Calculate shipping and tax
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping for orders above 500
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + shipping + tax;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      pricing: {
        subtotal,
        shipping,
        tax,
        discount: 0,
        total
      },
      status: 'pending',
      timeline: [{
        status: 'pending',
        note: 'Order placed',
        updatedBy: req.user._id
      }]
    });

    await order.save();

    // Clear user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      await cart.clearCart();
    }

    // Populate order details before returning
    await order.populate('items.product', 'name images price');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating order' });
  }
});

// @route   POST /api/orders/:id/payment
// @desc    Initiate payment for an order
router.post('/:id/payment', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    if (order.payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: order.pricing.total * 100, // Amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      }
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while initiating payment' });
  }
});

// @route   POST /api/orders/:id/payment/verify
// @desc    Verify payment and update order status
router.post('/:id/payment/verify', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify payment signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update order payment status
    order.payment.status = 'paid';
    order.payment.transactionId = razorpayPaymentId;
    order.payment.paymentDate = new Date();
    order.status = 'confirmed';

    order.timeline.push({
      status: 'confirmed',
      note: 'Payment confirmed',
      updatedBy: req.user._id
    });

    await order.save();

    res.json({
      message: 'Payment verified successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while verifying payment' });
  }
});

// @route   POST /api/orders/:id/cancel
// @desc    Cancel an order
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellation = {
      reason,
      requestedBy: req.user._id,
      requestedAt: new Date()
    };

    order.timeline.push({
      status: 'cancelled',
      note: `Order cancelled: ${reason}`,
      updatedBy: req.user._id
    });

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.stock.trackInventory) {
        product.stock.quantity += item.quantity;
        await product.save();
      }
    }

    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while cancelling order' });
  }
});

module.exports = router;
