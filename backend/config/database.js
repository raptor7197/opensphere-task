const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visa-tool');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // For development, we'll continue without MongoDB and use JSON file storage
    console.log('Continuing with JSON file storage...');
  }
};

module.exports = connectDB;