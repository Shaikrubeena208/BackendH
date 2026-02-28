const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

/*
  @route   POST /api/orders/create
  @desc    Create order (Dummy Payment Mode)
*/
router.post('/create', auth, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address required' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({
          message: `Product ${item.product} not found`
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
    }

    const shipping = subtotal > 500 ? 0 : 50;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      pricing: {
        subtotal,
        shipping,
        tax,
        total
      },
      payment: {
        method: 'dummy',
        status: 'paid',
        paymentId: 'DUMMY_PAYMENT_ID'
      },
      status: 'confirmed'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order placed successfully (Dummy Payment)',
      order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;