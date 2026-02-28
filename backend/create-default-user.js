const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hal-tayyib')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Create default user
const createDefaultUser = async () => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'support@hal-tayyib.com' });
    
    if (existingUser) {
      console.log('Default user already exists');
      process.exit(0);
    }

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('halal123', salt);

    // Create new user with pre-hashed password
    const defaultUser = new User({
      firstName: 'HAL',
      lastName: 'TAYYIB',
      email: 'support@hal-tayyib.com',
      phone: '+1234567890',
      password: hashedPassword,
      role: 'admin'
    });

    // Save without triggering pre-save hook
    await defaultUser.save({ validateBeforeSave: false });
    console.log('Default user created successfully');
    console.log('Email: support@hal-tayyib.com');
    console.log('Password: halal123');
    
  } catch (error) {
    console.error('Error creating default user:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

createDefaultUser();
