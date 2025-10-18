
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple route to check if server is running
app.get('/', (req, res) => {
  res.send('Visa Evaluation Tool Backend is running!');
});

// --- API Endpoints will go here ---

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

// Submission endpoint
app.post('/api/submissions', upload.array('documents'), (req, res) => {
  const { name, email, country, visaType, apiKey } = req.body;
  const documents = req.files || [];

  // Validate required fields
  if (!name || !email || !country || !visaType) {
    return res.status(400).json({ error: 'Missing required fields: name, email, country, and visaType are required.' });
  }

  if (documents.length === 0) {
    return res.status(400).json({ error: 'At least one document must be uploaded.' });
  }

  // --- Evaluation Logic ---
  const requiredDocs = visaData[country]?.documents[visaType] || [];
  const providedDocsCount = documents.length;
  const requiredDocsCount = requiredDocs.length;

  let score = 0;
  if (requiredDocsCount > 0) {
    score = Math.round((providedDocsCount / requiredDocsCount) * 100);
  }
  if (score > 85) {
    score = 85; // Apply max success cap
  }

  let summary = "Evaluation based on document submission.";
  if (score < 50) {
    summary = "Your application is likely to be rejected. You are missing several key documents.";
  } else if (score <= 85) {
    summary = "Your application has a moderate to high chance of success. Ensure all submitted documents are accurate and complete.";
  } else {
    summary = "You have a strong profile. Your application has a high chance of success.";
  }
  // --- End Evaluation Logic ---

  const dbPath = path.join(__dirname, 'db.json');
  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading database.');
    }
    const db = JSON.parse(data);
    const newSubmission = {
      id: Date.now(),
      name,
      email,
      country,
      visaType,
      documents: documents.map(doc => ({ filename: doc.filename, path: doc.path })),
      score,
      summary,
      submittedAt: new Date().toISOString(),
      apiKey: apiKey || null
    };

    db.submissions.push(newSubmission);

    fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error saving to database.');
      }
      res.json({ score, summary });
    });
  });
});

// Partner endpoint
app.get('/api/submissions/:apiKey', (req, res) => {
  const { apiKey } = req.params;
  const dbPath = path.join(__dirname, 'db.json');

  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading database.');
    }
    const db = JSON.parse(data);
    const partnerSubmissions = db.submissions.filter(sub => sub.apiKey === apiKey);
    res.json(partnerSubmissions);
  });
});





app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
