import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import configurations and middleware
import connectDB from './config/database.js';
import { logger } from './config/logger.js';

// Import routes
import visaRoutes from './routes/visas.js';
import submissionRoutes from './routes/submissions.js';
import partnerRoutes from './routes/partners.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure required directories exist
const requiredDirs = ['uploads', 'logs'];
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
});

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Replace with your production domain
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/visas', visaRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/partners', partnerRoutes);

// Serve uploaded files (with basic security)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    // Prevent direct execution of uploaded files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Multi-Country Visa Evaluation API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      visas: '/api/visas',
      submissions: '/api/submissions',
      partners: '/api/partners'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Multi-Country Visa Evaluation API Documentation',
    version: '1.0.0',
    endpoints: {
      'GET /api/visas': 'Get all available visa data',
      'GET /api/visas/:country': 'Get visa data for specific country',
      'GET /api/visas/:country/:visaType': 'Get specific visa requirements',
      'POST /api/submissions': 'Submit visa evaluation',
      'GET /api/submissions/:id': 'Get specific evaluation',
      'GET /api/submissions': 'Get evaluations (partner only)',
      'POST /api/partners/register': 'Register new partner',
      'GET /api/partners/profile': 'Get partner profile',
      'PUT /api/partners/profile': 'Update partner profile',
      'GET /api/partners/dashboard': 'Get partner dashboard data',
      'POST /api/partners/regenerate-key': 'Regenerate API key'
    },
    authentication: {
      'x-api-key': 'Partner API key (optional for submissions, required for partner endpoints)'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/docs',
      'GET /api/visas',
      'POST /api/submissions',
      'POST /api/partners/register'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong!'
    : error.message;

  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3002;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

      // Log important configuration
      if (!process.env.GEMINI_API_KEY) {
        logger.warn('  GEMINI_API_KEY not set - AI evaluation will use fallback logic');
      }

      if (!process.env.MONGODB_URI) {
        logger.warn('  MONGODB_URI not set - using default MongoDB connection');
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;