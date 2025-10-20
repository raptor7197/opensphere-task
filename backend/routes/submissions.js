import express from 'express';
import Evaluation from '../models/Evaluation.js';
import { authenticatePartner } from '../middleware/partnerAuth.js';
import upload, { handleUploadError, cleanupFiles } from '../middleware/upload.js';
import geminiService from '../services/geminiService.js';
import { logger } from '../config/logger.js';

const router = express.Router();

// POST /api/submissions - Submit visa evaluation
router.post('/',
  authenticatePartner,
  upload.array('documents', 10),
  handleUploadError,
  async (req, res) => {
    let uploadedFiles = req.files || [];

    try {
      const {
        name,
        email,
        country,
        visaType,
        educationLevel,
        experienceYears,
        currentSalary,
        languageProficiency,
        hasAwards,
        awards,
        hasRecognizedEmployer
      } = req.body;

      // Validate required fields
      if (!name || !email || !country || !visaType || !educationLevel ||
          experienceYears === undefined || !currentSalary || !languageProficiency) {
        cleanupFiles(uploadedFiles);
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please fill in all required fields'
        });
      }

      // Validate file uploads
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({
          error: 'No documents uploaded',
          message: 'Please upload at least one document'
        });
      }

      logger.info(`Processing visa evaluation for ${email} - ${country} ${visaType}`);

      // Prepare application data for evaluation
      const applicationData = {
        name,
        email,
        country,
        visaType,
        educationLevel,
        experienceYears: parseInt(experienceYears),
        currentSalary: parseInt(currentSalary),
        languageProficiency,
        hasAwards: hasAwards === 'true',
        awards: awards ? JSON.parse(awards) : [],
        hasRecognizedEmployer: hasRecognizedEmployer === 'true',
        uploadedDocuments: uploadedFiles.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }))
      };

      // Perform AI evaluation using Gemini
      const evaluation = await geminiService.evaluateVisa(applicationData);

      // Create evaluation record (if database is available)
      let evaluationId = 'demo-' + Date.now();
      try {
        const evaluationRecord = new Evaluation({
          ...applicationData,
          evaluationScore: evaluation.score,
          likelihood: evaluation.likelihood,
          scores: evaluation.scores,
          summary: evaluation.summary,
          recommendations: evaluation.recommendations,
          partnerApiKey: req.partner?.apiKey,
          geminiResponse: evaluation.geminiResponse,
          processingTime: evaluation.processingTime,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Save to database
        await evaluationRecord.save();
        evaluationId = evaluationRecord._id;
      } catch (dbError) {
        logger.warn('Database save failed, continuing without persistence:', dbError.message);
      }

      // Update partner usage if applicable
      if (req.partner) {
        try {
          await req.partner.incrementUsage();
          logger.info(`Partner ${req.partner.name} usage incremented`);
        } catch (partnerError) {
          logger.warn('Partner usage update failed:', partnerError.message);
        }
      }

      logger.info(`Evaluation completed for ${email} with score ${evaluation.score}`);

      // Return evaluation result (matching frontend expectations)
      res.json({
        score: evaluation.score,
        likelihood: evaluation.likelihood,
        scores: evaluation.scores,
        summary: evaluation.summary,
        recommendations: evaluation.recommendations,
        evaluationId: evaluationId
      });

    } catch (error) {
      logger.error('Evaluation submission error:', error);

      // Cleanup uploaded files on error
      cleanupFiles(uploadedFiles);

      // Return appropriate error response
      if (error.message.includes('Gemini API')) {
        res.status(503).json({
          error: 'AI service temporarily unavailable',
          message: 'Please try again in a few moments'
        });
      } else if (error.name === 'ValidationError') {
        res.status(400).json({
          error: 'Validation error',
          message: error.message
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to process evaluation'
        });
      }
    }
  }
);

// GET /api/submissions/:id - Get specific evaluation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await Evaluation.findById(id);

    if (!evaluation) {
      return res.status(404).json({
        error: 'Evaluation not found',
        message: 'The requested evaluation does not exist'
      });
    }

    // Return evaluation data (without sensitive information)
    res.json({
      id: evaluation._id,
      country: evaluation.country,
      visaType: evaluation.visaType,
      score: evaluation.evaluationScore,
      likelihood: evaluation.likelihood,
      scores: evaluation.scores,
      summary: evaluation.summary,
      recommendations: evaluation.recommendations,
      submittedAt: evaluation.submittedAt
    });

  } catch (error) {
    logger.error('Error fetching evaluation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch evaluation'
    });
  }
});

// GET /api/submissions - Get evaluations (with optional filtering)
router.get('/', authenticatePartner, async (req, res) => {
  try {
    const { page = 1, limit = 20, country, visaType, startDate, endDate } = req.query;

    // Build query
    const query = {};

    // If partner is authenticated, only show their evaluations
    if (req.partner) {
      query.partnerApiKey = req.partner.apiKey;
    } else {
      // Public endpoint should be restricted or require different auth
      return res.status(401).json({
        error: 'Authentication required',
        message: 'This endpoint requires authentication'
      });
    }

    // Add filters
    if (country) query.country = country;
    if (visaType) query.visaType = visaType;
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const evaluations = await Evaluation.find(query)
      .select('name email country visaType evaluationScore likelihood submittedAt')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Evaluation.countDocuments(query);

    res.json({
      evaluations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching evaluations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch evaluations'
    });
  }
});

export default router;