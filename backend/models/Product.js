const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['meat', 'organic', 'pantry', 'snacks', 'baby', 'beverages']
  },
  subcategory: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  images: [{
    url: String,
    alt: String
  }],
  brand: {
    type: String,
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certifications: {
    halal: {
      certified: { type: Boolean, default: false },
      certificateNumber: String,
      certifyingBody: String,
      certificateUrl: String,
      expiryDate: Date
    },
    tayyib: {
      verified: { type: Boolean, default: false },
      verificationDetails: String
    },
    organic: {
      certified: { type: Boolean, default: false },
      certificateNumber: String,
      certifyingBody: String
    }
  },
  ingredients: [{
    name: String,
    source: String, // e.g., 'plant-based', 'animal-based'
    isAllergen: { type: Boolean, default: false }
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbohydrates: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  storage: {
    instructions: String,
    temperature: String, // e.g., 'refrigerate', 'room temperature'
    shelfLife: String
  },
  origin: {
    country: String,
    region: String,
    story: String
  },
  tags: [{
    type: String,
    enum: ['gluten-free', 'organic', 'sunnah-food', 'vegetarian', 'non-vegetarian', 'dairy-free']
  }],
  stock: {
    quantity: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    trackInventory: { type: Boolean, default: true }
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  weight: {
    value: Number,
    unit: { type: String, enum: ['g', 'kg', 'ml', 'l'], default: 'g' }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'inch'], default: 'cm' }
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ 'certifications.halal.certified': 1 });

// Method to update average rating
productSchema.methods.updateAverageRating = function() {
  if (this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.ratings.average = sum / this.reviews.length;
    this.ratings.count = this.reviews.length;
  } else {
    this.ratings.average = 0;
    this.ratings.count = 0;
  }
  return this.save();
};

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);
