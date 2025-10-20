import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../config/logger.js';
import { visaData } from '../config/visaData.js';

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('GEMINI_API_KEY not found in environment variables - using fallback evaluation only');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }

  async evaluateVisa(applicationData) {
    const startTime = Date.now();

    try {
      const { country, visaType, educationLevel, experienceYears, currentSalary,
              languageProficiency, hasAwards, hasRecognizedEmployer, uploadedDocuments } = applicationData;

      // Get visa requirements
      const visaRequirements = visaData[country]?.requirements[visaType];
      if (!visaRequirements) {
        throw new Error(`Visa requirements not found for ${country} - ${visaType}`);
      }

      // Check if Gemini is available
      if (!this.model) {
        logger.info('Gemini API not available, using fallback evaluation');
        return this.fallbackEvaluation(applicationData, visaRequirements);
      }

      // Create the evaluation prompt
      const prompt = this.createEvaluationPrompt(applicationData, visaRequirements);

      // Generate evaluation using Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const geminiText = response.text();

      logger.info(`Gemini evaluation completed in ${Date.now() - startTime}ms`);

      // Parse the response and calculate scores
      const evaluation = this.parseGeminiResponse(geminiText, applicationData, visaRequirements);

      return {
        ...evaluation,
        processingTime: Date.now() - startTime,
        geminiResponse: geminiText
      };

    } catch (error) {
      logger.error('Gemini evaluation error:', error);

      // Fallback to rule-based evaluation if Gemini fails
      logger.info('Falling back to rule-based evaluation');
      return this.fallbackEvaluation(applicationData, visaData[applicationData.country]?.requirements[applicationData.visaType]);
    }
  }

  createEvaluationPrompt(applicationData, visaRequirements) {
    const { country, visaType, educationLevel, experienceYears, currentSalary,
            languageProficiency, hasAwards, hasRecognizedEmployer, uploadedDocuments } = applicationData;

    return `
You are an expert immigration consultant evaluating a visa application for ${visaType} in ${country}.

APPLICANT PROFILE:
- Education Level: ${educationLevel}
- Years of Experience: ${experienceYears}
- Annual Salary: $${currentSalary}
- Language Proficiency: ${languageProficiency}
- Has Professional Awards: ${hasAwards ? 'Yes' : 'No'}
- Has Recognized Employer: ${hasRecognizedEmployer ? 'Yes' : 'No'}
- Documents Uploaded: ${uploadedDocuments?.length || 0} files

VISA REQUIREMENTS:
- Minimum Salary: $${visaRequirements.minSalary}
- Required Education: ${visaRequirements.requiredEducation.join(', ')}
- Minimum Experience: ${visaRequirements.minExperience} years
- Special Requirements: ${visaRequirements.specialRequirements.join(', ')}

Please provide a comprehensive evaluation in the following JSON format (respond with ONLY the JSON, no additional text):

{
  "overallScore": <number 0-100>,
  "likelihood": "<Very Low|Low|Fair|Good|Excellent>",
  "scores": {
    "education": <number 0-25>,
    "experience": <number 0-20>,
    "salary": <number 0-20>,
    "documents": <number 0-15>,
    "awards": <number 0-10>,
    "language": <number 0-5>,
    "employer": <number 0-5>
  },
  "summary": "<2-3 sentence summary of the evaluation>",
  "recommendations": [
    {
      "category": "<category name>",
      "priority": "<High|Medium|Low>",
      "suggestion": "<specific actionable suggestion>"
    }
  ]
}

EVALUATION CRITERIA:
- Education (25 points): Match with required education levels
- Experience (20 points): Years of relevant work experience
- Salary (20 points): Meets minimum salary requirements
- Documents (15 points): Completeness of documentation
- Awards (10 points): Professional recognition and achievements
- Language (5 points): Language proficiency level
- Employer (5 points): Employer recognition and sponsorship status

Maximum success rate should be capped at 85% (score 85/100) to maintain realistic expectations.
Provide 2-4 specific recommendations for improvement, prioritized by impact.
`;
  }

  parseGeminiResponse(geminiText, applicationData, visaRequirements) {
    try {
      // Extract JSON from the response
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the response
      const score = Math.min(Math.max(parsed.overallScore || 0, 0), 85); // Cap at 85

      return {
        score,
        likelihood: parsed.likelihood || this.calculateLikelihood(score),
        scores: {
          education: Math.min(Math.max(parsed.scores?.education || 0, 0), 25),
          experience: Math.min(Math.max(parsed.scores?.experience || 0, 0), 20),
          salary: Math.min(Math.max(parsed.scores?.salary || 0, 0), 20),
          documents: Math.min(Math.max(parsed.scores?.documents || 0, 0), 15),
          awards: Math.min(Math.max(parsed.scores?.awards || 0, 0), 10),
          language: Math.min(Math.max(parsed.scores?.language || 0, 0), 5),
          employer: Math.min(Math.max(parsed.scores?.employer || 0, 0), 5)
        },
        summary: parsed.summary || 'Evaluation completed successfully.',
        recommendations: parsed.recommendations || []
      };

    } catch (error) {
      logger.error('Error parsing Gemini response:', error);
      logger.info('Gemini response was:', geminiText);

      // Fallback to rule-based evaluation
      return this.fallbackEvaluation(applicationData, visaRequirements);
    }
  }

  fallbackEvaluation(applicationData, visaRequirements) {
    const startTime = Date.now();
    const { educationLevel, experienceYears, currentSalary, languageProficiency,
            hasAwards, hasRecognizedEmployer, uploadedDocuments } = applicationData;

    // Rule-based scoring
    let educationScore = 0;
    let experienceScore = 0;
    let salaryScore = 0;
    let documentsScore = 0;
    let awardsScore = 0;
    let languageScore = 0;
    let employerScore = 0;

    // Education scoring
    if (visaRequirements.requiredEducation.includes(educationLevel)) {
      const educationLevels = ['High School', 'Professional Certification', 'Bachelor', 'Master', 'PhD'];
      const level = educationLevels.indexOf(educationLevel);
      educationScore = Math.min(15 + (level * 3), 25);
    } else {
      educationScore = 10;
    }

    // Experience scoring
    if (experienceYears >= visaRequirements.minExperience) {
      experienceScore = Math.min(10 + (experienceYears * 2), 20);
    } else {
      experienceScore = Math.max(experienceYears * 2, 0);
    }

    // Salary scoring
    const salaryRatio = currentSalary / visaRequirements.minSalary;
    if (salaryRatio >= 1) {
      salaryScore = Math.min(15 + (salaryRatio - 1) * 10, 20);
    } else {
      salaryScore = Math.max(salaryRatio * 15, 0);
    }

    // Documents scoring
    const expectedDocsCount = visaData[applicationData.country]?.documents[applicationData.visaType]?.length || 3;
    const uploadedCount = uploadedDocuments?.length || 0;
    documentsScore = Math.min((uploadedCount / expectedDocsCount) * 15, 15);

    // Awards scoring
    awardsScore = hasAwards ? 8 : 2;

    // Language scoring
    const languageLevels = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Fluent': 4, 'Native': 5 };
    languageScore = languageLevels[languageProficiency] || 1;

    // Employer scoring
    employerScore = hasRecognizedEmployer ? 5 : 2;

    const totalScore = Math.min(
      educationScore + experienceScore + salaryScore + documentsScore + awardsScore + languageScore + employerScore,
      85 // Cap at 85
    );

    return {
      score: Math.round(totalScore),
      likelihood: this.calculateLikelihood(totalScore),
      scores: {
        education: educationScore,
        experience: experienceScore,
        salary: salaryScore,
        documents: documentsScore,
        awards: awardsScore,
        language: languageScore,
        employer: employerScore
      },
      summary: `Based on your profile, you have a ${this.calculateLikelihood(totalScore).toLowerCase()} chance of visa approval. Your strongest areas are ${this.getStrongestAreas({ education: educationScore, experience: experienceScore, salary: salaryScore })}.`,
      recommendations: this.generateRecommendations(applicationData, {
        education: educationScore,
        experience: experienceScore,
        salary: salaryScore,
        documents: documentsScore,
        awards: awardsScore,
        language: languageScore,
        employer: employerScore
      }),
      processingTime: Date.now() - startTime,
      geminiResponse: 'Fallback evaluation used'
    };
  }

  calculateLikelihood(score) {
    if (score >= 75) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 35) return 'Low';
    return 'Very Low';
  }

  getStrongestAreas(scores) {
    const areas = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([area]) => area);
    return areas.join(' and ');
  }

  generateRecommendations(applicationData, scores) {
    const recommendations = [];

    if (scores.education < 20) {
      recommendations.push({
        category: 'Education',
        priority: 'High',
        suggestion: 'Consider obtaining additional certifications or higher education qualifications relevant to your field.'
      });
    }

    if (scores.salary < 15) {
      recommendations.push({
        category: 'Salary',
        priority: 'High',
        suggestion: 'Negotiate a higher salary offer or seek positions that meet the minimum salary requirements.'
      });
    }

    if (scores.documents < 12) {
      recommendations.push({
        category: 'Documentation',
        priority: 'Medium',
        suggestion: 'Upload all required documents to strengthen your application.'
      });
    }

    if (scores.experience < 15) {
      recommendations.push({
        category: 'Experience',
        priority: 'Medium',
        suggestion: 'Gain more relevant work experience in your field before applying.'
      });
    }

    return recommendations.slice(0, 4); // Limit to 4 recommendations
  }
}

export default new GeminiService();