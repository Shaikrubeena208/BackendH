const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hal-tayyib')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Get a default vendor ID (you'll need to replace this with an actual vendor ID from your users collection)
const DEFAULT_VENDOR_ID = new mongoose.Types.ObjectId(); // This will be a dummy ID, replace with actual vendor

// Products data with specific images and certification links
const products = [
  {
    name: 'Oman Chips',
    description: 'Crunchy and flavorful potato chips from Oman, perfect for snacking',
    price: 2.99,
    images: [{ url: '/oman chips.jpeg', alt: 'Oman Chips' }],
    brand: 'Oman Chips',
    vendor: DEFAULT_VENDOR_ID,
    category: 'snacks',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'OC-001',
        certifyingBody: 'Alisha Ihani',
        certificateUrl: 'https://www.alishaihani.net/en/certification-and-accreditation'
      }
    },
    stock: { quantity: 100 }
  },
  {
    name: 'Sohar Chips',
    description: 'Premium quality chips from Sohar, crispy and delicious',
    price: 3.49,
    images: [{ url: '/Sohar chips.jpeg', alt: 'Sohar Chips' }],
    brand: 'Sohar',
    vendor: DEFAULT_VENDOR_ID,
    category: 'snacks',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'SC-001',
        certifyingBody: 'Alisha Ihani',
        certificateUrl: 'https://www.alishaihani.net/en/certification-and-accreditation'
      }
    },
    stock: { quantity: 85 }
  },
  {
    name: 'Salad Chips',
    description: 'Healthy and tasty salad-flavored chips, light and satisfying',
    price: 3.29,
    images: [{ url: '/salad chips.jpeg', alt: 'Salad Chips' }],
    brand: 'Salad Chips',
    vendor: DEFAULT_VENDOR_ID,
    category: 'snacks',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'SC-002',
        certifyingBody: 'Alisha Ihani',
        certificateUrl: 'https://www.alishaihani.net/en/certification-and-accreditation'
      }
    },
    stock: { quantity: 90 }
  },
  {
    name: 'Biscoff Cookies',
    description: 'Classic caramelized biscuit cookies, perfect with coffee or tea',
    price: 4.99,
    images: [{ url: '/biscoff.jpeg', alt: 'Biscoff Cookies' }],
    brand: 'Biscoff',
    vendor: DEFAULT_VENDOR_ID,
    category: 'snacks',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'BC-001',
        certifyingBody: 'Verify Halal',
        certificateUrl: 'https://verifyhalal.com/product-single.html?id=6921585'
      }
    },
    stock: { quantity: 75 }
  },
  {
    name: 'Premium Cashews',
    description: 'High-quality cashew nuts, rich and nutritious',
    price: 8.99,
    images: [{ url: '/cashews .jpeg', alt: 'Premium Cashews' }],
    brand: 'Premium Nuts',
    vendor: DEFAULT_VENDOR_ID,
    category: 'snacks',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'CN-001',
        certifyingBody: 'Subhan Bakery',
        certificateUrl: 'https://www.subhanbakery.in/'
      }
    },
    stock: { quantity: 60 }
  },
  {
    name: 'Rooh Afza',
    description: 'Traditional refreshing drink concentrate, perfect for summer',
    price: 5.99,
    images: [{ url: '/rooh afza.jpg', alt: 'Rooh Afza' }],
    brand: 'Hamdard',
    vendor: DEFAULT_VENDOR_ID,
    category: 'beverages',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'RA-001',
        certifyingBody: 'Hamdard',
        certificateUrl: 'https://www.hamdard.com'
      }
    },
    stock: { quantity: 120 }
  },
  {
    name: 'Vimto Cordial',
    description: 'Fruity cordial drink, refreshing and delicious',
    price: 6.49,
    images: [{ url: '/vimto.jpg', alt: 'Vimto Cordial' }],
    brand: 'Vimto',
    vendor: DEFAULT_VENDOR_ID,
    category: 'beverages',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'VC-001',
        certifyingBody: 'Vimto Arabia',
        certificateUrl: 'https://vimtoarabia.com/products/cordial/'
      }
    },
    stock: { quantity: 95 }
  },
  {
    name: 'Rooh Afza Lassi',
    description: 'Creamy lassi drink with Rooh Afza flavor, refreshing and nutritious',
    price: 4.99,
    images: [{ url: '/Rooh Afza Lassi.jpg', alt: 'Rooh Afza Lassi' }],
    brand: 'Barbican',
    vendor: DEFAULT_VENDOR_ID,
    category: 'beverages',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'RL-001',
        certifyingBody: 'Barbican',
        certificateUrl: 'https://barbicanworld.com/faq/'
      }
    },
    stock: { quantity: 80 }
  },
  {
    name: 'Chicken Spicy Salami',
    description: 'Spicy and flavorful chicken salami, perfect for sandwiches',
    price: 7.99,
    images: [{ url: '/Chicken Spicy Salami.jpeg', alt: 'Chicken Spicy Salami' }],
    brand: 'Zorabian',
    vendor: DEFAULT_VENDOR_ID,
    category: 'meat',
    tags: ['non-vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'CS-001',
        certifyingBody: 'Zorabian',
        certificateUrl: 'https://www.zorabian.com/wp-content/uploads/2025/12/Zorabian-Halal-Certificate.pdf'
      }
    },
    stock: { quantity: 45 }
  },
  {
    name: 'Chicken Nuggets',
    description: 'Crispy and delicious chicken nuggets, perfect for snacks',
    price: 8.99,
    images: [{ url: '/Chicken Nuggets.jpeg', alt: 'Chicken Nuggets' }],
    brand: 'Zorabian',
    vendor: DEFAULT_VENDOR_ID,
    category: 'meat',
    tags: ['non-vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'CN-002',
        certifyingBody: 'Zorabian',
        certificateUrl: 'https://www.zorabian.com/wp-content/uploads/2025/12/Zorabian-Halal-Certificate.pdf'
      }
    },
    stock: { quantity: 55 }
  },
  {
    name: 'Chicken Breast Boneless',
    description: 'Premium boneless chicken breast, tender and juicy',
    price: 12.99,
    images: [{ url: '/Chicken Breast Boneless.jpeg', alt: 'Chicken Breast Boneless' }],
    brand: 'Zorabian',
    vendor: DEFAULT_VENDOR_ID,
    category: 'meat',
    tags: ['non-vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'CB-001',
        certifyingBody: 'Zorabian',
        certificateUrl: 'https://www.zorabian.com/wp-content/uploads/2025/12/Zorabian-Halal-Certificate.pdf'
      }
    },
    stock: { quantity: 40 }
  },
  {
    name: 'Ustad Banne Nawab Bombay Chicken Biryani Spice Mix',
    description: 'Authentic spice mix for Bombay chicken biryani, aromatic and flavorful',
    price: 3.99,
    images: [{ url: '/Ustad banne nawab Bombay chicken biryani spice mix.webp', alt: 'Bombay Biryani Spice Mix' }],
    brand: 'Ustad Banne Nawab',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'UB-001',
        certifyingBody: 'Ustad Banne Nawab',
        certificateUrl: 'https://www.ustadbannenawab.com/'
      }
    },
    stock: { quantity: 110 }
  },
  {
    name: 'Ustad Banne Nawab Crispy Fried Chicken Mix',
    description: 'Perfect coating mix for crispy fried chicken, restaurant quality at home',
    price: 4.49,
    images: [{ url: '/Ustad banne nawab crispy fried chicken mix.jpg', alt: 'Crispy Fried Chicken Mix' }],
    brand: 'Ustad Banne Nawab',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'UC-001',
        certifyingBody: 'Ustad Banne Nawab',
        certificateUrl: 'https://www.ustadbannenawab.com/'
      }
    },
    stock: { quantity: 85 }
  },
  {
    name: 'Hamdard Khaalis Chaat Masala',
    description: 'Aromatic chaat masala blend, perfect for street food flavors',
    price: 2.99,
    images: [{ url: '/Hamdard khaalis chaat masala.jpg', alt: 'Khaalis Chaat Masala' }],
    brand: 'Hamdard',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'HC-001',
        certifyingBody: 'Hamdard',
        certificateUrl: 'https://www.hamdard.com'
      }
    },
    stock: { quantity: 130 }
  },
  {
    name: 'Hamdard Khaalis Roasted Sewiyan (400g)',
    description: 'Premium roasted vermicelli, perfect for desserts and sweets',
    price: 5.49,
    images: [{ url: '/Hamdard khaalis roasted Sewiyan (400g) .jpeg', alt: 'Khaalis Roasted Sewiyan' }],
    brand: 'Hamdard',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'HS-001',
        certifyingBody: 'Hamdard',
        certificateUrl: 'https://www.hamdard.com'
      }
    },
    stock: { quantity: 75 }
  },
  {
    name: 'Hamdard Khaalis Roasted Sewiyan (400g) Alternative',
    description: 'Premium roasted vermicelli alternative pack, same great quality',
    price: 5.49,
    images: [{ url: '/Hamdard khaalis roasted Sewiyan (400g).jpg', alt: 'Khaalis Roasted Sewiyan Alternative' }],
    brand: 'Hamdard',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'HS-002',
        certifyingBody: 'Hamdard',
        certificateUrl: 'https://www.hamdard.com'
      }
    },
    stock: { quantity: 70 }
  },
  {
    name: 'Instant Falafel Mix',
    description: 'Easy-to-prepare falafel mix, authentic Middle Eastern flavors',
    price: 4.99,
    images: [{ url: '/Instant Falafel mix .jpeg', alt: 'Instant Falafel Mix' }],
    brand: 'Bakr Gourmet',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'IF-001',
        certifyingBody: 'Bakr Gourmet',
        certificateUrl: 'https://www.bakrgourmet.com'
      }
    },
    stock: { quantity: 90 }
  },
  {
    name: 'Garlic Toum (175g)',
    description: 'Traditional garlic sauce, creamy and flavorful',
    price: 3.99,
    images: [{ url: '/Garlic toum 175 gms.jpg', alt: 'Garlic Toum' }],
    brand: 'Bakr Gourmet',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'GT-001',
        certifyingBody: 'Bakr Gourmet',
        certificateUrl: 'https://www.bakrgourmet.com'
      }
    },
    stock: { quantity: 65 }
  },
  {
    name: 'Bakr Gourmet Harissa Sauce (175g)',
    description: 'Spicy harissa sauce, authentic North African flavor',
    price: 4.29,
    images: [{ url: '/Bakr gourmet harissa sauce  175gms.jpg', alt: 'Harissa Sauce' }],
    brand: 'Bakr Gourmet',
    vendor: DEFAULT_VENDOR_ID,
    category: 'pantry',
    tags: ['vegetarian'],
    certifications: {
      halal: {
        certified: true,
        certificateNumber: 'BH-001',
        certifyingBody: 'Bakr Gourmet',
        certificateUrl: 'https://www.bakrgourmet.com'
      }
    },
    stock: { quantity: 80 }
  }
];

// Add products to database
async function addProducts() {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add new products
    const result = await Product.insertMany(products);
    console.log(`Successfully added ${result.length} products`);

    // Display added products
    console.log('\nAdded Products:');
    result.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} - ${product.certifications.halal.certifyingBody}`);
    });

  } catch (error) {
    console.error('Error adding products:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
addProducts();
