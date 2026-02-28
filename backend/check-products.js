const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hal-tayyib')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Check products
const checkProducts = async () => {
  try {
    const products = await Product.find({});
    console.log(`Found ${products.length} products in database`);
    
    if (products.length === 0) {
      console.log('No products found. Creating sample products...');
      
      // Get admin user for vendor
      const adminUser = await User.findOne({ email: 'support@hal-tayyib.com' });
      
      if (!adminUser) {
        console.log('Admin user not found. Please create admin user first.');
        process.exit(1);
      }
      
      // Create sample products
      const sampleProducts = [
        {
          name: 'Premium Halal Chicken',
          description: 'Fresh, high-quality halal chicken from certified farms',
          price: 12.99,
          category: 'meat',
          brand: 'HAL-TAYYIB Premium',
          vendor: adminUser._id,
          stock: {
            quantity: 100,
            lowStockThreshold: 10,
            trackInventory: true
          },
          images: [{ url: '/images/chicken.jpg', alt: 'Premium Halal Chicken' }],
          certifications: {
            halal: {
              certified: true,
              certificateNumber: 'HAL-001',
              certifyingBody: 'Halal Certification Board',
              certificateUrl: '/certificates/halal-001.pdf'
            }
          },
          isActive: true
        },
        {
          name: 'Organic Halal Beef',
          description: 'Premium organic halal beef from grass-fed cattle',
          price: 24.99,
          category: 'meat',
          brand: 'HAL-TAYYIB Organic',
          vendor: adminUser._id,
          stock: {
            quantity: 50,
            lowStockThreshold: 10,
            trackInventory: true
          },
          images: [{ url: '/images/beef.jpg', alt: 'Organic Halal Beef' }],
          certifications: {
            halal: {
              certified: true,
              certificateNumber: 'HAL-002',
              certifyingBody: 'Halal Certification Board',
              certificateUrl: '/certificates/halal-002.pdf'
            },
            organic: {
              certified: true,
              certificateNumber: 'ORG-001',
              certifyingBody: 'Organic Certification Board'
            }
          },
          isActive: true
        },
        {
          name: 'Halal Lamb',
          description: 'Tender halal lamb cuts from premium sources',
          price: 18.99,
          category: 'meat',
          brand: 'HAL-TAYYIB Select',
          vendor: adminUser._id,
          stock: {
            quantity: 75,
            lowStockThreshold: 10,
            trackInventory: true
          },
          images: [{ url: '/images/lamb.jpg', alt: 'Halal Lamb' }],
          certifications: {
            halal: {
              certified: true,
              certificateNumber: 'HAL-003',
              certifyingBody: 'Halal Certification Board',
              certificateUrl: '/certificates/halal-003.pdf'
            }
          },
          isActive: true
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('Sample products created successfully');
    } else {
      console.log('Products found:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price} - Stock: ${product.stock?.quantity || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

checkProducts();
