const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

// Halal certified products data
const halalProducts = [
  {
    name: "Premium Halal Chicken Breast",
    description: "Fresh, tender chicken breast certified Halal by Alisha Ihani. Perfect for healthy meals.",
    price: 12.99,
    category: "meat",
    brand: "Halal Fresh",
    stock: { quantity: 100 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-001",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Premium Halal Chicken Breast" }
    ],
    tags: ["non-vegetarian", "organic"],
    nutritionalInfo: {
      calories: 165,
      protein: 31,
      carbohydrates: 0,
      fat: 3.6
    }
  },
  {
    name: "Halal Certified Lamb Chops",
    description: "Premium quality lamb chops with authentic Halal certification. Tender and flavorful.",
    price: 24.99,
    category: "meat",
    brand: "Halal Premium",
    stock: { quantity: 50 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-002",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Halal Certified Lamb Chops" }
    ],
    tags: ["non-vegetarian", "organic"],
    nutritionalInfo: {
      calories: 250,
      protein: 25,
      carbohydrates: 0,
      fat: 16
    }
  },
  {
    name: "Organic Halal Beef Steak",
    description: "Prime cut beef steak with Halal certification. Perfect for grilling and special occasions.",
    price: 18.99,
    category: "meat",
    brand: "Halal Organic",
    stock: { quantity: 75 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-003",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      organic: {
        certified: true,
        certificateNumber: "ORG-2024-003",
        certifyingBody: "USDA Organic"
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Organic Halal Beef Steak" }
    ],
    tags: ["non-vegetarian", "organic"],
    nutritionalInfo: {
      calories: 280,
      protein: 26,
      carbohydrates: 0,
      fat: 18
    }
  },
  {
    name: "Halal Goat Meat Curry Cut",
    description: "Fresh goat meat perfect for traditional curries. Halal certified and farm-raised.",
    price: 15.99,
    category: "meat",
    brand: "Halal Farms",
    stock: { quantity: 60 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-004",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Halal Goat Meat Curry Cut" }
    ],
    tags: ["non-vegetarian"],
    nutritionalInfo: {
      calories: 200,
      protein: 27,
      carbohydrates: 0,
      fat: 8
    }
  },
  {
    name: "Halal Turkey Breast",
    description: "Lean turkey breast with Halal certification. Excellent source of protein.",
    price: 11.99,
    category: "meat",
    brand: "Halal Lean",
    stock: { quantity: 80 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-005",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Halal Turkey Breast" }
    ],
    tags: ["non-vegetarian"],
    nutritionalInfo: {
      calories: 135,
      protein: 30,
      carbohydrates: 0,
      fat: 1
    }
  },
  {
    name: "Halal Duck Breast",
    description: "Premium duck breast with authentic Halal certification. Rich flavor and tender texture.",
    price: 22.99,
    category: "meat",
    brand: "Halal Gourmet",
    stock: { quantity: 40 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-006",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Halal Duck Breast" }
    ],
    tags: ["non-vegetarian"],
    nutritionalInfo: {
      calories: 340,
      protein: 25,
      carbohydrates: 0,
      fat: 28
    }
  },
  {
    name: "Halal Veal Cutlets",
    description: "Tender veal cutlets with Halal certification. Perfect for fine dining.",
    price: 28.99,
    category: "meat",
    brand: "Halal Fine",
    stock: { quantity: 30 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-007",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Halal Veal Cutlets" }
    ],
    tags: ["non-vegetarian"],
    nutritionalInfo: {
      calories: 210,
      protein: 24,
      carbohydrates: 0,
      fat: 12
    }
  },
  {
    name: "Halal Buffalo Meat",
    description: "Lean buffalo meat with Halal certification. High protein, low fat alternative.",
    price: 19.99,
    category: "meat",
    brand: "Halal Wild",
    stock: { quantity: 45 },
    certifications: {
      halal: {
        certified: true,
        certificateNumber: "HAL-2024-008",
        certifyingBody: "Alisha Ihani",
        certificateUrl: "https://www.alishaihani.net/en/certification-and-accreditation",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    },
    images: [
      { url: "/chipsoman-thub.png", alt: "Halal Buffalo Meat" }
    ],
    tags: ["non-vegetarian"],
    nutritionalInfo: {
      calories: 180,
      protein: 29,
      carbohydrates: 0,
      fat: 6
    }
  }
];

async function addHalalProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/hal-tayyib');
    console.log('Connected to MongoDB');

    // Get admin user (vendor)
    const adminUser = await User.findOne({ email: 'support@hal-tayyib.com' });
    if (!adminUser) {
      console.log('Admin user not found. Please create admin user first.');
      return;
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Add Halal certified products
    for (const productData of halalProducts) {
      const product = new Product({
        ...productData,
        vendor: adminUser._id
      });
      
      await product.save();
      console.log(`Added: ${product.name}`);
    }

    console.log(`Successfully added ${halalProducts.length} Halal certified products`);
    
  } catch (error) {
    console.error('Error adding products:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addHalalProducts();
