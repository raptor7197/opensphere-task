import express from 'express';
import cors from 'cors';
import { visaData } from './config/visaData.js';

const app = express();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple server running' });
});

// Visa data endpoint
app.get('/api/visas', (req, res) => {
  const simplifiedData = {};
  Object.keys(visaData).forEach(country => {
    simplifiedData[country] = {
      visas: visaData[country].visas,
      documents: visaData[country].documents
    };
  });
  res.json(simplifiedData);
});

// Simple submission endpoint for testing
app.post('/api/submissions', (req, res) => {
  console.log('Received submission:', req.body);

  // Mock evaluation response
  res.json({
    score: 75,
    likelihood: "Good",
    scores: {
      education: 20,
      experience: 15,
      salary: 18,
      documents: 10,
      awards: 5,
      language: 4,
      employer: 3
    },
    summary: "Based on your profile, you have a good chance of visa approval. This is a test response from the simple server.",
    recommendations: [
      {
        category: "Documents",
        priority: "Medium",
        suggestion: "Consider uploading additional supporting documents to strengthen your application."
      }
    ],
    evaluationId: "test-" + Date.now()
  });
});

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📝 Test with: curl http://localhost:${PORT}/health`);
});