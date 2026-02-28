const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hal-tayyib')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Create default user directly in MongoDB
const createDefaultUser = async () => {
  try {
    // Wait for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database not connected');
      process.exit(1);
    }
    
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: 'support@hal-tayyib.com' });
    
    if (existingUser) {
      console.log('Default user already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('halal123', salt);

    // Create user document
    const userDoc = {
      firstName: 'HAL',
      lastName: 'TAYYIB',
      email: 'support@hal-tayyib.com',
      phone: '+1234567890',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert directly into collection
    const result = await usersCollection.insertOne(userDoc);
    console.log('Default user created successfully');
    console.log('Email: support@hal-tayyib.com');
    console.log('Password: halal123');
    console.log('User ID:', result.insertedId);
    
  } catch (error) {
    console.error('Error creating default user:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

// Wait for connection then create user
mongoose.connection.once('open', createDefaultUser);
