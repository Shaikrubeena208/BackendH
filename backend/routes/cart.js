const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const Razorpay = require('razorpay');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Test key
  key_secret: process.env.RAZORPAY_KEY_SECRET || '1234567890abcdef'
});

// @route   POST /api/cart/add
// @desc    Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item added to cart successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/cart
// @desc    Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.json({
      cart,
      total,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cart/update
// @desc    Update cart item quantity
router.put('/update', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => item.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Cart updated successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove item from cart
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    await cart.populate('items.product');

    res.json({
      message: 'Item removed from cart successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cart/create-order
// @desc    Create Razorpay order for payment
router.post('/create-order', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Mock Razorpay order for development
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: 'INR',
      status: 'created'
    };

    res.json({
      orderId: mockOrder.id,
      amount: mockOrder.amount,
      currency: mockOrder.currency,
      keyId: 'rzp_test_mock_key', // Mock key for development
      cartItems: cart.items,
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// @route   POST /api/cart/verify-payment
// @desc    Verify payment and create order
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, cartItems, totalAmount } = req.body;
    const userId = req.user.id;

    // Mock payment verification for development
    // In production, verify actual Razorpay signature here
    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Create order in database
    const order = new Order({
      user: userId,
      items: cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalAmount,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      status: 'paid',
      paymentStatus: 'completed'
    });

    await order.save();

    // Clear the cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    res.json({
      message: 'Payment successful and order created',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// @route   POST /api/cart/cod-order
// @desc    Create Cash on Delivery order
router.post('/cod-order', auth, async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const userId = req.user.id;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Create order in database
    const order = new Order({
      user: userId,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalAmount,
      shippingAddress,
      paymentMethod: 'cod',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    // Clear the cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    res.json({
      message: 'Cash on Delivery order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create COD order' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
