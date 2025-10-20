import mongoose from 'mongoose';
import { logger } from './logger.js';

const connectDB = async () => {
  try {
    // Use in-memory storage if MongoDB is not available for demo purposes
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('your_mongodb_uri')) {
      logger.warn('MongoDB URI not configured. Using fallback mode without database persistence.');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn('MongoDB connection failed, continuing without database persistence:', error.message);
    // Don't exit, allow the server to run without MongoDB for demo purposes
  }
};

export default connectDB;