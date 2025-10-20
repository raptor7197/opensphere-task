export const visaData = {
  "United States": {
    visas: ["O-1A", "O-1B", "H-1B"],
    documents: {
      "O-1A": ["Résumé", "Personal Statement", "Letters of Recommendation", "Press Clippings", "Awards Documentation"],
      "O-1B": ["Résumé", "Portfolio", "Press Clippings", "Letters of Recommendation", "Performance Records"],
      "H-1B": ["Résumé", "Employment Contract", "Educational Transcripts", "Skills Assessment", "Employer Documentation"],
    },
    requirements: {
      "O-1A": {
        minSalary: 80000,
        requiredEducation: ["Bachelor", "Master", "PhD"],
        minExperience: 3,
        specialRequirements: ["extraordinary_ability", "national_recognition"]
      },
      "O-1B": {
        minSalary: 70000,
        requiredEducation: ["High School", "Professional Certification", "Bachelor", "Master", "PhD"],
        minExperience: 2,
        specialRequirements: ["extraordinary_achievement_arts", "recognition"]
      },
      "H-1B": {
        minSalary: 60000,
        requiredEducation: ["Bachelor", "Master", "PhD"],
        minExperience: 0,
        specialRequirements: ["specialty_occupation", "employer_sponsorship"]
      }
    }
  },
  "Ireland": {
    visas: ["Critical Skills Employment Permit"],
    documents: {
      "Critical Skills Employment Permit": ["Résumé", "Employment Contract", "Police Report", "Educational Transcripts", "Skills Assessment"]
    },
    requirements: {
      "Critical Skills Employment Permit": {
        minSalary: 32000,
        requiredEducation: ["Bachelor", "Master", "PhD"],
        minExperience: 2,
        specialRequirements: ["critical_skills_occupation", "salary_threshold"]
      }
    }
  },
  "Poland": {
    visas: ["Work Permit Type C"],
    documents: {
      "Work Permit Type C": ["Résumé", "Employment Contract", "Proof of Accommodation", "Health Insurance", "Police Report"]
    },
    requirements: {
      "Work Permit Type C": {
        minSalary: 15000,
        requiredEducation: ["High School", "Professional Certification", "Bachelor", "Master", "PhD"],
        minExperience: 1,
        specialRequirements: ["labor_market_test", "accommodation_proof"]
      }
    }
  },
  "France": {
    visas: ["Talent Passport", "Salarié en Mission"],
    documents: {
      "Talent Passport": ["Résumé", "Business Plan", "Proof of Financial Means", "Educational Transcripts", "Professional References"],
      "Salarié en Mission": ["Résumé", "Assignment Letter", "Proof of Social Security", "Employment Contract", "Company Documentation"]
    },
    requirements: {
      "Talent Passport": {
        minSalary: 53836,
        requiredEducation: ["Master", "PhD"],
        minExperience: 3,
        specialRequirements: ["highly_qualified_employee", "innovative_company"]
      },
      "Salarié en Mission": {
        minSalary: 30000,
        requiredEducation: ["Bachelor", "Master", "PhD"],
        minExperience: 2,
        specialRequirements: ["intra_company_transfer", "group_company"]
      }
    }
  },
  "Netherlands": {
    visas: ["Knowledge Migrant Permit"],
    documents: {
      "Knowledge Migrant Permit": ["Résumé", "Employment Contract", "Health Insurance", "Educational Transcripts", "Salary Documentation"]
    },
    requirements: {
      "Knowledge Migrant Permit": {
        minSalary: 38949,
        requiredEducation: ["Bachelor", "Master", "PhD"],
        minExperience: 1,
        specialRequirements: ["recognized_sponsor", "salary_threshold"]
      }
    }
  },
  "Germany": {
    visas: ["EU Blue Card", "ICT Permit"],
    documents: {
      "EU Blue Card": ["Résumé", "University Degree", "Employment Contract", "Skills Assessment", "Salary Documentation"],
      "ICT Permit": ["Résumé", "Assignment Letter", "Proof of Qualification", "Company Documentation", "Health Insurance"]
    },
    requirements: {
      "EU Blue Card": {
        minSalary: 56400,
        requiredEducation: ["Bachelor", "Master", "PhD"],
        minExperience: 1,
        specialRequirements: ["university_degree", "regulated_profession"]
      },
      "ICT Permit": {
        minSalary: 45000,
        requiredEducation: ["Bachelor", "Master", "PhD"],
        minExperience: 3,
        specialRequirements: ["intra_company_transfer", "executive_specialist"]
      }
    }
  }
};