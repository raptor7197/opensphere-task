class EvaluationService {
  constructor() {
    this.visaRequirements = {
      "United States": {
        "O-1A": { minSalary: 75000, degreeRequired: true, experienceRequired: 3 },
        "O-1B": { minSalary: 65000, degreeRequired: false, experienceRequired: 5 },
        "H-1B": { minSalary: 60000, degreeRequired: true, experienceRequired: 0 }
      },
      "Ireland": {
        "Critical Skills Employment Permit": { minSalary: 32000, degreeRequired: true, experienceRequired: 2 }
      },
      "Poland": {
        "Work Permit Type C": { minSalary: 28000, degreeRequired: false, experienceRequired: 1 }
      },
      "France": {
        "Talent Passport": { minSalary: 45000, degreeRequired: true, experienceRequired: 3 },
        "Salarié en Mission": { minSalary: 35000, degreeRequired: false, experienceRequired: 2 }
      },
      "Netherlands": {
        "Knowledge Migrant Permit": { minSalary: 48000, degreeRequired: true, experienceRequired: 0 }
      },
      "Germany": {
        "EU Blue Card": { minSalary: 48300, degreeRequired: true, experienceRequired: 0 },
        "ICT Permit": { minSalary: 40000, degreeRequired: false, experienceRequired: 3 }
      }
    };
  }

  calculateScore(userData, country, visaType, documents) {
    const requirements = this.visaRequirements[country]?.[visaType] || {};
    const scores = {
      education: this.calculateEducationScore(userData.educationLevel, requirements.degreeRequired),
      experience: this.calculateExperienceScore(userData.experienceYears, requirements.experienceRequired),
      salary: this.calculateSalaryScore(userData.currentSalary, requirements.minSalary),
      documents: this.calculateDocumentScore(documents, country, visaType),
      awards: this.calculateAwardsScore(userData.hasAwards, userData.awards),
      language: this.calculateLanguageScore(userData.languageProficiency),
      employer: this.calculateEmployerScore(userData.hasRecognizedEmployer || false)
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const cappedScore = Math.min(totalScore, 85); // Apply score cap

    const likelihood = this.calculateLikelihood(cappedScore);
    const summary = this.generateSummary(cappedScore, likelihood, country, visaType);
    const recommendations = this.generateRecommendations(scores, userData, requirements);

    return {
      scores,
      totalScore,
      cappedScore,
      likelihood,
      summary,
      recommendations
    };
  }

  calculateEducationScore(educationLevel, degreeRequired) {
    const educationPoints = {
      'PhD': 25,
      'Master': 20,
      'Bachelor': 15,
      'Professional Certification': 10,
      'High School': 5
    };

    const baseScore = educationPoints[educationLevel] || 0;

    // Penalty if degree is required but not provided
    if (degreeRequired && !['PhD', 'Master', 'Bachelor'].includes(educationLevel)) {
      return Math.max(0, baseScore - 10);
    }

    return baseScore;
  }

  calculateExperienceScore(experienceYears, minExperience) {
    if (experienceYears >= 10) return 20;
    if (experienceYears >= 6) return 18;
    if (experienceYears >= 3) return 12;
    if (experienceYears >= 1) return 8;

    // Penalty if minimum experience not met
    if (experienceYears < minExperience) {
      return Math.max(0, 8 - (minExperience - experienceYears) * 2);
    }

    return 8;
  }

  calculateSalaryScore(currentSalary, minSalary) {
    if (!currentSalary || !minSalary) return 10; // Default score if no salary info

    const ratio = currentSalary / minSalary;

    if (ratio >= 1.5) return 20; // 50% above minimum
    if (ratio >= 1.2) return 18; // 20% above minimum
    if (ratio >= 1.0) return 15; // Meets minimum
    if (ratio >= 0.8) return 10; // 80% of minimum
    if (ratio >= 0.6) return 5;  // 60% of minimum

    return 0; // Below 60% of minimum
  }

  calculateDocumentScore(documents, country, visaType) {
    const requiredDocuments = this.getRequiredDocuments(country, visaType);
    const documentCount = documents ? documents.length : 0;
    const requiredCount = requiredDocuments.length;

    if (requiredCount === 0) return 15; // Full score if no specific requirements

    const ratio = documentCount / requiredCount;

    if (ratio >= 1.0) return 15; // All documents provided
    if (ratio >= 0.8) return 12; // 80% of documents
    if (ratio >= 0.6) return 9;  // 60% of documents
    if (ratio >= 0.4) return 6;  // 40% of documents
    if (ratio >= 0.2) return 3;  // 20% of documents

    return 0; // Less than 20% of documents
  }

  calculateAwardsScore(hasAwards, awards) {
    if (!hasAwards || !awards || awards.length === 0) return 0;

    const internationalAwards = awards.filter(award =>
      award.organization &&
      (award.organization.toLowerCase().includes('international') ||
       award.organization.toLowerCase().includes('global') ||
       award.organization.toLowerCase().includes('world'))
    );

    if (internationalAwards.length > 0) return 10;
    if (awards.length >= 3) return 8;
    if (awards.length >= 2) return 6;
    if (awards.length >= 1) return 4;

    return 0;
  }

  calculateLanguageScore(languageProficiency) {
    const languagePoints = {
      'Native': 5,
      'Fluent': 5,
      'Advanced': 4,
      'Intermediate': 3,
      'Beginner': 1
    };

    return languagePoints[languageProficiency] || 2;
  }

  calculateEmployerScore(hasRecognizedEmployer) {
    return hasRecognizedEmployer ? 5 : 2; // Bonus for recognized sponsor
  }

  calculateLikelihood(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 35) return 'Low';
    return 'Very Low';
  }

  generateSummary(score, likelihood, country, visaType) {
    const baseMessages = {
      'Excellent': `Outstanding profile for ${country} ${visaType}! Your application has an excellent chance of success. You meet or exceed most requirements and have a strong competitive advantage.`,
      'Good': `Strong profile for ${country} ${visaType}. Your application has a good chance of success, though there may be areas for improvement to strengthen your case.`,
      'Fair': `Moderate profile for ${country} ${visaType}. Your application has a fair chance, but significant improvements are recommended to increase success probability.`,
      'Low': `Below-average profile for ${country} ${visaType}. Your application faces challenges and would benefit from substantial improvements before submission.`,
      'Very Low': `Weak profile for ${country} ${visaType}. Your application is likely to face rejection without significant improvements to meet basic requirements.`
    };

    return baseMessages[likelihood] || 'Unable to determine likelihood at this time.';
  }

  generateRecommendations(scores, userData, requirements) {
    const recommendations = [];

    // Education recommendations
    if (scores.education < 15 && requirements.degreeRequired) {
      recommendations.push({
        category: 'Education',
        suggestion: 'Consider obtaining a higher degree or professional certification to meet visa requirements.',
        priority: 'High'
      });
    }

    // Experience recommendations
    if (scores.experience < 12) {
      recommendations.push({
        category: 'Experience',
        suggestion: 'Gain more relevant work experience in your field to strengthen your profile.',
        priority: 'High'
      });
    }

    // Salary recommendations
    if (scores.salary < 15) {
      recommendations.push({
        category: 'Salary',
        suggestion: 'Negotiate a higher salary or seek positions that meet the minimum salary requirements.',
        priority: 'Medium'
      });
    }

    // Document recommendations
    if (scores.documents < 12) {
      recommendations.push({
        category: 'Documents',
        suggestion: 'Ensure all required documents are properly prepared and submitted.',
        priority: 'High'
      });
    }

    // Awards recommendations
    if (scores.awards < 5) {
      recommendations.push({
        category: 'Recognition',
        suggestion: 'Seek professional recognition, awards, or certifications in your field.',
        priority: 'Low'
      });
    }

    // Language recommendations
    if (scores.language < 4) {
      recommendations.push({
        category: 'Language',
        suggestion: 'Improve your language proficiency through formal training or certification.',
        priority: 'Medium'
      });
    }

    return recommendations;
  }

  getRequiredDocuments(country, visaType) {
    const documentRequirements = {
      "United States": {
        "O-1A": ["Résumé", "Personal Statement", "Letters of Recommendation"],
        "O-1B": ["Résumé", "Portfolio", "Press Clippings"],
        "H-1B": ["Résumé", "Employment Contract", "Educational Transcripts"]
      },
      "Ireland": {
        "Critical Skills Employment Permit": ["Résumé", "Employment Contract", "Police Report"]
      },
      "Poland": {
        "Work Permit Type C": ["Résumé", "Employment Contract", "Proof of Accommodation"]
      },
      "France": {
        "Talent Passport": ["Résumé", "Business Plan", "Proof of Financial Means"],
        "Salarié en Mission": ["Résumé", "Assignment Letter", "Proof of Social Security"]
      },
      "Netherlands": {
        "Knowledge Migrant Permit": ["Résumé", "Employment Contract", "Health Insurance"]
      },
      "Germany": {
        "EU Blue Card": ["Résumé", "University Degree", "Employment Contract"],
        "ICT Permit": ["Résumé", "Assignment Letter", "Proof of Qualification"]
      }
    };

    return documentRequirements[country]?.[visaType] || [];
  }
}

module.exports = new EvaluationService();