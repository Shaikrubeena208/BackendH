const express = require('express');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products/search
// @desc    Search products with simple query
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json({ products: [] });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { brand: searchRegex },
        { tags: searchRegex }
      ]
    }).populate('vendor', 'firstName lastName email')
      .limit(20);

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      search,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured,
      halalCertified,
      tayyibVerified
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (halalCertified === 'true') {
      filter['certifications.halal.certified'] = true;
    }

    if (tayyibVerified === 'true') {
      filter['certifications.tayyib.verified'] = true;
    }

    if (tags) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const products = await Product.find(filter)
      .populate('vendor', 'firstName lastName brandName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
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

// @route   GET /api/products/:id
// @desc    Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'firstName lastName brandName email phone')
      .populate('reviews.user', 'firstName lastName');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(404).json({ message: 'Product is not available' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// @route   GET /api/products/categories
// @desc    Get all product categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const subcategories = await Product.distinct('subcategory');
    const tags = await Product.distinct('tags');
    
    res.json({
      categories,
      subcategories: subcategories.filter(Boolean),
      tags
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .populate('vendor', 'firstName lastName brandName')
    .limit(8)
    .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching featured products' });
  }
});

// @route   POST /api/products
// @desc    Create a new product (vendor only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is vendor or admin
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only vendors can create products' });
    }

    const productData = {
      ...req.body,
      vendor: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    await product.populate('vendor', 'firstName lastName brandName');

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

// @route   PUT /api/products/:id
// @desc    Update a product (vendor only)
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product or is admin
    if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    Object.assign(product, req.body);
    await product.save();

    await product.populate('vendor', 'firstName lastName brandName');

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

// @route   DELETE /api/products/:id
// @desc    Delete a product (vendor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product or is admin
    if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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

// @route   POST /api/products/:id/reviews
// @desc    Add a review to a product
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Add review
    product.reviews.push({
      user: req.user._id,
      rating,
      comment
    });

    await product.updateAverageRating();
    await product.populate('reviews.user', 'firstName lastName');

    res.json({
      message: 'Review added successfully',
      review: product.reviews[product.reviews.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while adding review' });
  }
});

module.exports = router;
