import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { visaData } from './config/visaData.js';

// Configure multer for handling FormData
const upload = multer({ dest: 'uploads/' });

const app = express();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.post('/api/submissions', upload.array('documents', 10), (req, res) => {
  console.log('Received submission:', req.body);
  console.log('Files:', req.files?.length || 0);

  const { educationLevel, experienceYears, currentSalary, hasRecognizedEmployer, country, visaType } = req.body;

  console.log('Parsed values:', { educationLevel, experienceYears, currentSalary, hasRecognizedEmployer, country, visaType });

  // Get visa requirements for realistic evaluation
  const countryRequirements = visaData[country]?.requirements?.[visaType];

  if (!countryRequirements) {
    return res.status(400).json({ error: 'Visa type not found' });
  }

  // Simple realistic scoring based on actual data
  let score = 0;
  let educationScore = 0;
  let experienceScore = 0;
  let salaryScore = 0;
  let employerScore = 0;

  // Education scoring (most important)
  const educationMeetsReq = countryRequirements.requiredEducation.includes(educationLevel);
  if (educationLevel === 'PhD') {
    educationScore = educationMeetsReq ? 35 : 20;
  } else if (educationLevel === 'Master') {
    educationScore = educationMeetsReq ? 30 : 15;
  } else if (educationLevel === 'Bachelor') {
    educationScore = educationMeetsReq ? 25 : 10;
  } else if (educationLevel === 'Professional Certification') {
    educationScore = educationMeetsReq ? 15 : 5;
  } else {
    educationScore = 5;
  }

  // Experience scoring
  const expYears = parseInt(experienceYears) || 0;
  if (expYears >= 10) experienceScore = 25;
  else if (expYears >= 5) experienceScore = 20;
  else if (expYears >= 3) experienceScore = 15;
  else if (expYears >= 1) experienceScore = 10;
  else experienceScore = 0;

  // Salary scoring
  const salary = parseInt(currentSalary) || 0;
  const salaryRatio = salary / countryRequirements.minSalary;
  if (salaryRatio >= 1.5) salaryScore = 20;
  else if (salaryRatio >= 1.2) salaryScore = 16;
  else if (salaryRatio >= 1.0) salaryScore = 12;
  else if (salaryRatio >= 0.8) salaryScore = 6;
  else salaryScore = 0;

  // Employer bonus
  employerScore = hasRecognizedEmployer === 'true' ? 10 : 3;

  score = educationScore + experienceScore + salaryScore + employerScore + 3; // +3 for docs/language/awards

  // Apply realistic caps
  if (!educationMeetsReq) score = Math.min(score, 35);
  if (salaryRatio < 1.0) score = Math.min(score, 45);
  if (expYears < countryRequirements.minExperience) score = Math.min(score, 40);

  // Sponsor bonus
  if (hasRecognizedEmployer === 'true') {
    score = Math.min(score * 1.15, 75);
  }

  score = Math.min(Math.round(score), 75);

  // Determine likelihood
  let likelihood;
  if (score >= 70) likelihood = 'Excellent';
  else if (score >= 60) likelihood = 'Good';
  else if (score >= 45) likelihood = 'Fair';
  else if (score >= 30) likelihood = 'Low';
  else likelihood = 'Very Low';

  // Generate recommendations
  const recommendations = [];
  if (!educationMeetsReq) {
    recommendations.push({
      category: "Education",
      priority: "High",
      suggestion: "Your education level may not meet the minimum requirements for this visa category."
    });
  }
  if (salaryRatio < 1.0) {
    recommendations.push({
      category: "Salary",
      priority: "High",
      suggestion: `Consider negotiating a higher salary. Current: $${salary}, Required: $${countryRequirements.minSalary}`
    });
  }
  if (expYears < countryRequirements.minExperience) {
    recommendations.push({
      category: "Experience",
      priority: "High",
      suggestion: `You need at least ${countryRequirements.minExperience} years of experience for this visa.`
    });
  }

  // Add loading delay to simulate processing
  setTimeout(() => {
    res.json({
      score,
      likelihood,
      scores: {
        education: Math.round(educationScore),
        experience: Math.round(experienceScore),
        salary: Math.round(salaryScore),
        documents: 4,
        awards: 1,
        language: 2,
        employer: Math.round(employerScore)
      },
      summary: `Based on your profile, you have a ${likelihood.toLowerCase()} chance of ${visaType} approval for ${country}. ${score < 30 ? 'Your current profile may not meet basic requirements.' : score >= 60 ? 'Your qualifications align well with visa requirements.' : 'There are areas for improvement.'}`,
      recommendations,
      evaluationId: "test-" + Date.now()
    });
  }, 3000); // 3 second delay to show loading
});

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📝 Test with: curl http://localhost:${PORT}/health`);
});