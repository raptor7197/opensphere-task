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

EVALUATION CRITERIA (STRICT PRIORITY ORDER):
1. Education (35 points): CRITICAL - Must meet minimum requirements. Low education = automatic low score
   - PhD: 35 points (if required: Bachelor+)
   - Master: 30 points (if required: Bachelor+)
   - Bachelor: 25 points (if required: Bachelor+)
   - Professional Cert: 15 points (rarely sufficient for skilled visas)
   - High School: 5 points (typically disqualifying for skilled worker visas)

2. Experience (25 points): ESSENTIAL - Years of relevant professional experience
   - 10+ years: 25 points
   - 5-9 years: 20 points
   - 3-4 years: 15 points
   - 1-2 years: 10 points
   - 0 years: 0 points

3. Salary (20 points): Must meet minimum thresholds
   - 150%+ of minimum: 20 points
   - 120-149% of minimum: 16 points
   - 100-119% of minimum: 12 points
   - 80-99% of minimum: 6 points
   - Below 80%: 0 points (likely disqualifying)

4. Sponsor Status (10 points): MAJOR ADVANTAGE
   - Recognized/Approved sponsor: +10 points
   - Regular employer: +3 points
   - No sponsor/Self-employed: 0 points

5. Documents (5 points): Completeness
6. Language (3 points): Proficiency level
7. Awards (2 points): Professional recognition

IMPORTANT RULES:
- If education doesn't meet minimum requirements: Maximum score = 35%
- If salary below minimum: Maximum score = 45%
- If no relevant experience for experience-required visas: Maximum score = 40%
- Recognized sponsor provides significant boost (+15% to final score)
- Maximum realistic success rate: 75% (even for perfect candidates)

Be STRICT and REALISTIC. Most applications should score 30-60%. Only exceptional candidates with perfect qualifications should score above 70%.
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

      // Validate and sanitize the response with realistic caps
      const score = Math.min(Math.max(parsed.overallScore || 0, 0), 75); // Cap at 75

      return {
        score,
        likelihood: parsed.likelihood || this.calculateLikelihood(score),
        scores: {
          education: Math.min(Math.max(parsed.scores?.education || 0, 0), 35),
          experience: Math.min(Math.max(parsed.scores?.experience || 0, 0), 25),
          salary: Math.min(Math.max(parsed.scores?.salary || 0, 0), 20),
          documents: Math.min(Math.max(parsed.scores?.documents || 0, 0), 5),
          awards: Math.min(Math.max(parsed.scores?.awards || 0, 0), 2),
          language: Math.min(Math.max(parsed.scores?.language || 0, 0), 3),
          employer: Math.min(Math.max(parsed.scores?.employer || 0, 0), 10)
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

    // STRICT REALISTIC SCORING SYSTEM
    let educationScore = 0;
    let experienceScore = 0;
    let salaryScore = 0;
    let documentsScore = 0;
    let awardsScore = 0;
    let languageScore = 0;
    let employerScore = 0;
    let disqualifyingFactors = [];

    // 1. EDUCATION SCORING (35 points) - MOST CRITICAL
    const educationMeetsRequirement = visaRequirements.requiredEducation.includes(educationLevel);

    if (educationLevel === 'PhD') {
      educationScore = educationMeetsRequirement ? 35 : 20;
    } else if (educationLevel === 'Master') {
      educationScore = educationMeetsRequirement ? 30 : 15;
    } else if (educationLevel === 'Bachelor') {
      educationScore = educationMeetsRequirement ? 25 : 10;
    } else if (educationLevel === 'Professional Certification') {
      educationScore = educationMeetsRequirement ? 15 : 5;
    } else if (educationLevel === 'High School') {
      educationScore = 5;
      if (!educationMeetsRequirement) {
        disqualifyingFactors.push('Education level too low for this visa category');
      }
    }

    // 2. EXPERIENCE SCORING (25 points) - SECOND MOST CRITICAL
    if (experienceYears >= 10) {
      experienceScore = 25;
    } else if (experienceYears >= 5) {
      experienceScore = 20;
    } else if (experienceYears >= 3) {
      experienceScore = 15;
    } else if (experienceYears >= 1) {
      experienceScore = 10;
    } else {
      experienceScore = 0;
      if (visaRequirements.minExperience > 0) {
        disqualifyingFactors.push('Insufficient work experience for this visa category');
      }
    }

    // Penalty for not meeting minimum experience
    if (experienceYears < visaRequirements.minExperience) {
      experienceScore = Math.max(experienceScore - 10, 0);
    }

    // 3. SALARY SCORING (20 points) - THIRD MOST CRITICAL
    const salaryRatio = currentSalary / visaRequirements.minSalary;
    if (salaryRatio >= 1.5) {
      salaryScore = 20;
    } else if (salaryRatio >= 1.2) {
      salaryScore = 16;
    } else if (salaryRatio >= 1.0) {
      salaryScore = 12;
    } else if (salaryRatio >= 0.8) {
      salaryScore = 6;
      disqualifyingFactors.push('Salary may be below minimum requirements');
    } else {
      salaryScore = 0;
      disqualifyingFactors.push('Salary significantly below minimum requirements');
    }

    // 4. SPONSOR/EMPLOYER SCORING (10 points) - MAJOR ADVANTAGE
    if (hasRecognizedEmployer) {
      employerScore = 10;
    } else {
      employerScore = 3; // Regular employer
    }

    // 5. DOCUMENTS SCORING (5 points)
    const expectedDocsCount = visaData[applicationData.country]?.documents[applicationData.visaType]?.length || 3;
    const uploadedCount = uploadedDocuments?.length || 0;
    documentsScore = Math.min((uploadedCount / expectedDocsCount) * 5, 5);

    // 6. LANGUAGE SCORING (3 points)
    const languageLevels = { 'Beginner': 0.5, 'Intermediate': 1.5, 'Advanced': 2.5, 'Fluent': 3, 'Native': 3 };
    languageScore = languageLevels[languageProficiency] || 0.5;

    // 7. AWARDS SCORING (2 points)
    awardsScore = hasAwards ? 2 : 0;

    // Calculate base total
    let totalScore = educationScore + experienceScore + salaryScore + documentsScore + awardsScore + languageScore + employerScore;

    // Apply disqualifying factor penalties
    if (!educationMeetsRequirement) {
      totalScore = Math.min(totalScore, 35); // Cap at 35% if education doesn't meet requirements
    }

    if (salaryRatio < 1.0) {
      totalScore = Math.min(totalScore, 45); // Cap at 45% if salary below minimum
    }

    if (experienceYears < visaRequirements.minExperience) {
      totalScore = Math.min(totalScore, 40); // Cap at 40% if experience insufficient
    }

    // Sponsor bonus (applied after caps)
    if (hasRecognizedEmployer) {
      totalScore = Math.min(totalScore * 1.15, 75); // 15% boost for recognized sponsors, cap at 75%
    }

    // Final realistic cap
    totalScore = Math.min(totalScore, 75);

    return {
      score: Math.round(totalScore),
      likelihood: this.calculateLikelihood(totalScore),
      scores: {
        education: Math.round(educationScore),
        experience: Math.round(experienceScore),
        salary: Math.round(salaryScore),
        documents: Math.round(documentsScore),
        awards: Math.round(awardsScore),
        language: Math.round(languageScore),
        employer: Math.round(employerScore)
      },
      summary: this.generateRealisticSummary(totalScore, disqualifyingFactors, hasRecognizedEmployer, applicationData),
      recommendations: this.generateRealisticRecommendations(applicationData, {
        education: educationScore,
        experience: experienceScore,
        salary: salaryScore,
        documents: documentsScore,
        awards: awardsScore,
        language: languageScore,
        employer: employerScore
      }, disqualifyingFactors, visaRequirements),
      processingTime: Date.now() - startTime,
      geminiResponse: 'Realistic evaluation algorithm used'
    };
  }

  calculateLikelihood(score) {
    if (score >= 70) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Fair';
    if (score >= 30) return 'Low';
    return 'Very Low';
  }

  generateRealisticSummary(score, disqualifyingFactors, hasRecognizedEmployer, applicationData) {
    const likelihood = this.calculateLikelihood(score).toLowerCase();
    let summary = `Based on your profile, you have a ${likelihood} chance of ${applicationData.visaType} approval for ${applicationData.country}.`;

    if (disqualifyingFactors.length > 0) {
      summary += ` However, there are some concerns: ${disqualifyingFactors[0]}.`;
    }

    if (hasRecognizedEmployer && score > 50) {
      summary += ` Your recognized sponsor status significantly strengthens your application.`;
    }

    if (score < 30) {
      summary += ` Your current profile may not meet the basic requirements for this visa category.`;
    } else if (score >= 60) {
      summary += ` Your qualifications align well with the visa requirements.`;
    }

    return summary;
  }

  generateRealisticRecommendations(applicationData, scores, disqualifyingFactors, visaRequirements) {
    const recommendations = [];

    // Education recommendations (highest priority)
    if (scores.education < 20) {
      recommendations.push({
        category: "Education",
        priority: "High",
        suggestion: !visaRequirements.requiredEducation.includes(applicationData.educationLevel)
          ? "Your education level does not meet the minimum requirements. Consider obtaining additional qualifications or targeting different visa categories."
          : "Consider obtaining higher education qualifications or additional professional certifications to strengthen your profile."
      });
    }

    // Experience recommendations (second priority)
    if (scores.experience < 15) {
      recommendations.push({
        category: "Experience",
        priority: "High",
        suggestion: applicationData.experienceYears < visaRequirements.minExperience
          ? `You need at least ${visaRequirements.minExperience} years of experience for this visa. Consider gaining more relevant work experience.`
          : "Gain more relevant professional experience in your field to improve your eligibility."
      });
    }

    // Salary recommendations (third priority)
    if (scores.salary < 12) {
      recommendations.push({
        category: "Salary",
        priority: "High",
        suggestion: `Your current salary of $${applicationData.currentSalary} is below the typical requirement of $${visaRequirements.minSalary}. Negotiate a higher salary offer or seek positions that meet minimum requirements.`
      });
    }

    // Sponsor recommendations
    if (!applicationData.hasRecognizedEmployer) {
      recommendations.push({
        category: "Sponsorship",
        priority: "Medium",
        suggestion: "Seek employment with a recognized sponsor/employer. This provides a significant advantage in visa applications."
      });
    }

    // Documents recommendations
    if (scores.documents < 4) {
      recommendations.push({
        category: "Documentation",
        priority: "Medium",
        suggestion: "Upload all required documents to complete your application. Missing documents can significantly impact your evaluation."
      });
    }

    // Language recommendations
    if (scores.language < 2) {
      recommendations.push({
        category: "Language",
        priority: "Low",
        suggestion: "Improve your language proficiency through formal training or certification to demonstrate communication skills."
      });
    }

    return recommendations.slice(0, 4); // Limit to top 4 recommendations
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