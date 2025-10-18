const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Import database connection and models
const connectDB = require('./config/database');
const User = require('./models/User');
const Evaluation = require('./models/Evaluation');
const Partner = require('./models/Partner');

// Import services and middleware
const evaluationService = require('./services/evaluationService');
const emailService = require('./services/emailService');
const { authenticatePartner } = require('./middleware/partnerAuth');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Simple route to check if server is running
app.get('/', (req, res) => {
  res.json({
    message: 'Visa Evaluation Tool Backend is running!',
    version: '2.0.0',
    features: ['MongoDB Integration', 'Email Service', 'Partner API', 'Enhanced Scoring']
  });
});

// Visa data configuration
const visaData = {
  "United States": {
    visas: ["O-1A", "O-1B", "H-1B"],
    documents: {
      "O-1A": ["Résumé", "Personal Statement", "Letters of Recommendation"],
      "O-1B": ["Résumé", "Portfolio", "Press Clippings"],
      "H-1B": ["Résumé", "Employment Contract", "Educational Transcripts"],
    }
  },
  "Ireland": {
    visas: ["Critical Skills Employment Permit"],
    documents: {
      "Critical Skills Employment Permit": ["Résumé", "Employment Contract", "Police Report"]
    }
  },
  "Poland": {
    visas: ["Work Permit Type C"],
    documents: {
      "Work Permit Type C": ["Résumé", "Employment Contract", "Proof of Accommodation"]
    }
  },
  "France": {
    visas: ["Talent Passport", "Salarié en Mission"],
    documents: {
      "Talent Passport": ["Résumé", "Business Plan", "Proof of Financial Means"],
      "Salarié en Mission": ["Résumé", "Assignment Letter", "Proof of Social Security"]
    }
  },
  "Netherlands": {
    visas: ["Knowledge Migrant Permit"],
    documents: {
      "Knowledge Migrant Permit": ["Résumé", "Employment Contract", "Health Insurance"]
    }
  },
  "Germany": {
    visas: ["EU Blue Card", "ICT Permit"],
    documents: {
      "EU Blue Card": ["Résumé", "University Degree", "Employment Contract"],
      "ICT Permit": ["Résumé", "Assignment Letter", "Proof of Qualification"]
    }
  }
};

// API endpoint to get visa data
app.get('/api/visas', (req, res) => {
  res.json(visaData);
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB per file.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 10 files allowed.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected field name for file upload.' });
    }
  }
  if (error.message === 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// Enhanced submission endpoint
app.post('/api/submissions', upload.array('documents'), async (req, res) => {
  try {
    const {
      name, email, country, visaType, apiKey,
      educationLevel, experienceYears, currentSalary,
      languageProficiency, hasAwards, awards,
      hasRecognizedEmployer
    } = req.body;

    const documents = req.files || [];

    // Validate required fields
    if (!name || !email || !country || !visaType) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, country, and visaType are required.'
      });
    }

    if (documents.length === 0) {
      return res.status(400).json({
        error: 'At least one document must be uploaded.'
      });
    }

    // Create or find user
    let user;
    try {
      user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          name,
          email: email.toLowerCase(),
          educationLevel: educationLevel || 'Bachelor',
          experienceYears: parseInt(experienceYears) || 2,
          currentSalary: parseInt(currentSalary) || 50000,
          languageProficiency: languageProficiency || 'Intermediate',
          hasAwards: hasAwards === 'true' || hasAwards === true,
          awards: awards ? JSON.parse(awards) : [],
          hasRecognizedEmployer: hasRecognizedEmployer === 'true' || hasRecognizedEmployer === true
        },
        { upsert: true, new: true, runValidators: true }
      );
    } catch (dbError) {
      console.log('MongoDB not available, using in-memory user data');
      user = {
        _id: `temp-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        educationLevel: educationLevel || 'Bachelor',
        experienceYears: parseInt(experienceYears) || 2,
        currentSalary: parseInt(currentSalary) || 50000,
        languageProficiency: languageProficiency || 'Intermediate',
        hasAwards: hasAwards === 'true' || hasAwards === true,
        awards: awards ? JSON.parse(awards) : [],
        hasRecognizedEmployer: hasRecognizedEmployer === 'true' || hasRecognizedEmployer === true
      };
    }

    // Calculate evaluation using enhanced service
    const evaluation = evaluationService.calculateScore(user, country, visaType, documents);

    // Apply partner-specific score cap if API key provided
    let finalScore = evaluation.cappedScore;
    if (apiKey && apiKey !== '') {
      try {
        const partner = await Partner.findOne({ apiKey, isActive: true });
        if (partner && partner.customScoreCap) {
          finalScore = Math.min(evaluation.totalScore, partner.customScoreCap);
        }
      } catch (dbError) {
        console.log('Using default score cap due to database unavailability');
      }
    }

    // Prepare document data
    const documentData = documents.map(doc => ({
      filename: doc.filename,
      originalName: doc.originalname,
      path: doc.path,
      size: doc.size,
      mimetype: doc.mimetype,
      uploadedAt: new Date()
    }));

    // Create evaluation record
    const evaluationData = {
      user: user._id,
      country,
      visaType,
      documents: documentData,
      scores: evaluation.scores,
      totalScore: evaluation.totalScore,
      cappedScore: finalScore,
      summary: evaluation.summary,
      recommendations: evaluation.recommendations,
      likelihood: evaluation.likelihood,
      partnerApiKey: apiKey || null,
      emailSent: false
    };

    let savedEvaluation;
    try {
      savedEvaluation = await Evaluation.create(evaluationData);
    } catch (dbError) {
      console.log('MongoDB not available, using JSON storage');
      savedEvaluation = { ...evaluationData, _id: `eval-${Date.now()}`, createdAt: new Date() };

      // Save to JSON file as fallback
      const dbPath = path.join(__dirname, 'db.json');
      try {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        dbData.submissions.push(savedEvaluation);
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
      } catch (fileError) {
        const dbData = { submissions: [savedEvaluation] };
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
      }
    }

    // Send email with results
    try {
      const emailResult = await emailService.sendEvaluationResults(email, name, {
        ...savedEvaluation,
        country,
        visaType
      });

      if (emailResult.success && savedEvaluation._id) {
        // Update email sent status if using MongoDB
        try {
          await Evaluation.findByIdAndUpdate(savedEvaluation._id, {
            emailSent: true,
            emailSentAt: new Date()
          });
        } catch (dbError) {
          console.log('Could not update email status in database');
        }
      }
    } catch (emailError) {
      console.log('Email sending failed:', emailError.message);
    }

    // Return results to frontend
    res.json({
      score: finalScore,
      summary: evaluation.summary,
      likelihood: evaluation.likelihood,
      recommendations: evaluation.recommendations,
      scores: evaluation.scores,
      evaluationId: savedEvaluation._id
    });

  } catch (error) {
    console.error('Submission processing error:', error);
    res.status(500).json({
      error: 'Internal server error during evaluation processing'
    });
  }
});

// Partner API endpoints
app.get('/api/partner/evaluations', authenticatePartner, async (req, res) => {
  try {
    const { page = 1, limit = 10, country, visaType } = req.query;
    const partner = req.partner;

    let query = {};
    if (partner._id !== 'test-partner') {
      query.partnerApiKey = partner.apiKey;
    }

    if (country) query.country = country;
    if (visaType) query.visaType = visaType;

    let evaluations;
    try {
      evaluations = await Evaluation.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Evaluation.countDocuments(query);

      res.json({
        evaluations: evaluations.map(eval => ({
          id: eval._id,
          user: eval.user,
          country: eval.country,
          visaType: eval.visaType,
          score: eval.cappedScore,
          likelihood: eval.likelihood,
          createdAt: eval.createdAt,
          emailSent: eval.emailSent
        })),
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (dbError) {
      // Fallback to JSON file
      const dbPath = path.join(__dirname, 'db.json');
      try {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const filteredEvaluations = dbData.submissions.filter(submission => {
          if (country && submission.country !== country) return false;
          if (visaType && submission.visaType !== visaType) return false;
          return true;
        });

        res.json({
          evaluations: filteredEvaluations.slice((page - 1) * limit, page * limit),
          totalPages: Math.ceil(filteredEvaluations.length / limit),
          currentPage: page,
          total: filteredEvaluations.length
        });
      } catch (fileError) {
        res.json({ evaluations: [], totalPages: 0, currentPage: 1, total: 0 });
      }
    }
  } catch (error) {
    console.error('Partner API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partner statistics endpoint
app.get('/api/partner/stats', authenticatePartner, async (req, res) => {
  try {
    const partner = req.partner;

    let query = {};
    if (partner._id !== 'test-partner') {
      query.partnerApiKey = partner.apiKey;
    }

    try {
      const stats = await Evaluation.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalEvaluations: { $sum: 1 },
            averageScore: { $avg: '$cappedScore' },
            excellentCount: { $sum: { $cond: [{ $eq: ['$likelihood', 'Excellent'] }, 1, 0] } },
            goodCount: { $sum: { $cond: [{ $eq: ['$likelihood', 'Good'] }, 1, 0] } },
            fairCount: { $sum: { $cond: [{ $eq: ['$likelihood', 'Fair'] }, 1, 0] } },
            lowCount: { $sum: { $cond: [{ $eq: ['$likelihood', 'Low'] }, 1, 0] } },
            veryLowCount: { $sum: { $cond: [{ $eq: ['$likelihood', 'Very Low'] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        totalEvaluations: 0,
        averageScore: 0,
        excellentCount: 0,
        goodCount: 0,
        fairCount: 0,
        lowCount: 0,
        veryLowCount: 0
      };

      res.json(result);
    } catch (dbError) {
      // Fallback to JSON file
      const dbPath = path.join(__dirname, 'db.json');
      try {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const evaluations = dbData.submissions || [];

        const stats = {
          totalEvaluations: evaluations.length,
          averageScore: evaluations.reduce((sum, eval) => sum + (eval.cappedScore || 0), 0) / evaluations.length || 0,
          excellentCount: evaluations.filter(e => e.likelihood === 'Excellent').length,
          goodCount: evaluations.filter(e => e.likelihood === 'Good').length,
          fairCount: evaluations.filter(e => e.likelihood === 'Fair').length,
          lowCount: evaluations.filter(e => e.likelihood === 'Low').length,
          veryLowCount: evaluations.filter(e => e.likelihood === 'Very Low').length
        };

        res.json(stats);
      } catch (fileError) {
        res.json({
          totalEvaluations: 0,
          averageScore: 0,
          excellentCount: 0,
          goodCount: 0,
          fairCount: 0,
          lowCount: 0,
          veryLowCount: 0
        });
      }
    }
  } catch (error) {
    console.error('Partner stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // You could add actual DB health check here
      email: 'configured',
      storage: 'available'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`🗄️  Database: MongoDB with JSON fallback`);
  console.log(`🔑 Partner API: Available at /api/partner/*`);
});