
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3002';

// Loading screen component
const LoadingScreen = ({ stage, progress }) => {
  return (
    <div className="w-full max-w-2xl p-8 space-y-8 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="text-center">
        <div className="inline-block mb-6">
          <svg className="animate-spin h-16 w-16 text-green-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Processing Your Application</h2>
        <p className="text-lg text-gray-300 mb-6">{stage}</p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-400">{Math.round(progress)}% Complete</p>
      </div>

      {/* Processing Steps Indicator */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
        <div className={`p-3 rounded-lg border ${progress >= 16 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'}`}>
          <div className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center ${progress >= 16 ? 'bg-green-500' : 'bg-gray-600'}`}>
            {progress >= 16 ? '✓' : '1'}
          </div>
          <p className="text-xs text-gray-300">Preparation</p>
        </div>

        <div className={`p-3 rounded-lg border ${progress >= 32 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'}`}>
          <div className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center ${progress >= 32 ? 'bg-green-500' : 'bg-gray-600'}`}>
            {progress >= 32 ? '✓' : '2'}
          </div>
          <p className="text-xs text-gray-300">Upload</p>
        </div>

        <div className={`p-3 rounded-lg border ${progress >= 48 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'}`}>
          <div className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center ${progress >= 48 ? 'bg-green-500' : 'bg-gray-600'}`}>
            {progress >= 48 ? '✓' : '3'}
          </div>
          <p className="text-xs text-gray-300">Analysis</p>
        </div>

        <div className={`p-3 rounded-lg border ${progress >= 64 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'}`}>
          <div className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center ${progress >= 64 ? 'bg-green-500' : 'bg-gray-600'}`}>
            {progress >= 64 ? '✓' : '4'}
          </div>
          <p className="text-xs text-gray-300">Requirements</p>
        </div>

        <div className={`p-3 rounded-lg border ${progress >= 80 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'}`}>
          <div className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center ${progress >= 80 ? 'bg-green-500' : 'bg-gray-600'}`}>
            {progress >= 80 ? '✓' : '5'}
          </div>
          <p className="text-xs text-gray-300">AI Evaluation</p>
        </div>

        <div className={`p-3 rounded-lg border ${progress >= 96 ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'}`}>
          <div className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center ${progress >= 96 ? 'bg-green-500' : 'bg-gray-600'}`}>
            {progress >= 96 ? '✓' : '6'}
          </div>
          <p className="text-xs text-gray-300">Results</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-400">
          Using advanced AI to evaluate your visa application...
        </p>
      </div>
    </div>
  );
};

// A simple card to display the result
const ResultCard = ({ result, onReset }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getLikelihoodColor = (likelihood) => {
    switch (likelihood) {
      case 'Excellent': return 'text-green-400 bg-green-900/20';
      case 'Good': return 'text-green-300 bg-green-900/20';
      case 'Fair': return 'text-yellow-400 bg-yellow-900/20';
      case 'Low': return 'text-orange-400 bg-orange-900/20';
      case 'Very Low': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-800';
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-900 border border-gray-700 rounded-lg">
      <h2 className="text-2xl font-bold text-center text-white">Evaluation Result</h2>

      <div className="text-center">
        <p className="text-lg text-gray-300">Your Score</p>
        <p className={`text-6xl font-bold ${getScoreColor(result.score)}`}>{result.score}/100</p>
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mt-2 ${getLikelihoodColor(result.likelihood)}`}>
          {result.likelihood} Chance of Success
        </div>
      </div>

      {result.scores && (
        <div className="bg-gray-800 border border-gray-700 rounded-md p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Score Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300"> Education Qualification</span>
              <span className={`font-medium ${result.scores.education >= 25 ? 'text-green-400' : result.scores.education >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.scores.education || 0}/35
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300"> Work Experience</span>
              <span className={`font-medium ${result.scores.experience >= 20 ? 'text-green-400' : result.scores.experience >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.scores.experience || 0}/25
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300"> Salary/Income</span>
              <span className={`font-medium ${result.scores.salary >= 16 ? 'text-green-400' : result.scores.salary >= 8 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.scores.salary || 0}/20
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Sponsor/Employer</span>
              <span className={`font-medium ${result.scores.employer >= 8 ? 'text-green-400' : result.scores.employer >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.scores.employer || 0}/10
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300"> Document Completeness</span>
              <span className={`font-medium ${result.scores.documents >= 4 ? 'text-green-400' : result.scores.documents >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.scores.documents || 0}/5
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300"> Language Proficiency</span>
              <span className={`font-medium ${result.scores.language >= 2.5 ? 'text-green-400' : result.scores.language >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.scores.language || 0}/3
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300"> Recognition/Awards</span>
              <span className={`font-medium ${result.scores.awards >= 1 ? 'text-green-400' : 'text-gray-400'}`}>
                {result.scores.awards || 0}/2
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-md p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
        <p className="text-gray-300">{result.summary}</p>
      </div>

      {result.recommendations && result.recommendations.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-md p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Recommendations for Improvement</h3>
          <div className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-green-400">{rec.category}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.priority === 'High' ? 'bg-red-600 text-white' :
                    rec.priority === 'Medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">{rec.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
      >
        Start New Evaluation
      </button>
    </div>
  );
};


export default function App() {
  const [visaData, setVisaData] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    apiKey: '',
    country: '',
    visaType: '',
    educationLevel: '',
    experienceYears: '',
    currentSalary: '',
    languageProficiency: '',
    hasAwards: false,
    awards: [],
    hasRecognizedEmployer: false
  });
  const [documents, setDocuments] = useState([]);
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingVisaData, setIsLoadingVisaData] = useState(true);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    console.log('Fetching visa data from:', `${API_URL}/api/visas`);
    fetch(`${API_URL}/api/visas`)
      .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Visa data received:', data);
        setVisaData(data);
        setIsLoadingVisaData(false);
      })
      .catch(err => {
        console.error("Failed to fetch visa data:", err);
        // Fallback data in case API is not available
        const fallbackData = {
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
        console.log('Using fallback visa data');
        setVisaData(fallbackData);
        setIsLoadingVisaData(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'country') {
      setFormData(prev => ({ ...prev, visaType: '' }));
      setRequiredDocs([]);
    }

    if (name === 'visaType') {
      if (value && visaData[formData.country]) {
        setRequiredDocs(visaData[formData.country].documents[value] || []);
      }
    }
  };

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      alert(`File "${file.name}" is not a supported format. Please upload PDF, DOC, DOCX, or TXT files only.`);
      return false;
    }
    
    if (file.size > maxSize) {
      alert(`File "${file.name}" is too large. Maximum file size is 10MB.`);
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(validateFile);
    setDocuments(prev => [...prev, ...newFiles]);
    // Clear the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    setDocuments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingStage('Preparing your application...');

    // Simulate loading stages
    const stages = [
      { stage: 'Preparing your application...', duration: 500 },
      { stage: 'Uploading documents...', duration: 800 },
      { stage: 'Analyzing your profile...', duration: 1000 },
      { stage: 'Checking visa requirements...', duration: 700 },
      { stage: 'AI evaluation in progress...', duration: 900 },
      { stage: 'Generating recommendations...', duration: 600 }
    ];

    let currentProgress = 0;
    const progressIncrement = 100 / stages.length;

    const submissionData = new FormData();
    submissionData.append('name', formData.name);
    submissionData.append('email', formData.email);
    submissionData.append('apiKey', formData.apiKey);
    submissionData.append('country', formData.country);
    submissionData.append('visaType', formData.visaType);
    submissionData.append('educationLevel', formData.educationLevel);
    submissionData.append('experienceYears', formData.experienceYears);
    submissionData.append('currentSalary', formData.currentSalary);
    submissionData.append('languageProficiency', formData.languageProficiency);
    submissionData.append('hasAwards', formData.hasAwards);
    submissionData.append('awards', JSON.stringify(formData.awards));
    submissionData.append('hasRecognizedEmployer', formData.hasRecognizedEmployer);
    for (let i = 0; i < documents.length; i++) {
      submissionData.append('documents', documents[i]);
    }

    try {
      // Start the API request but don't await it immediately
      const responsePromise = fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        body: submissionData,
      });

      // Show loading stages
      for (let i = 0; i < stages.length; i++) {
        setLoadingStage(stages[i].stage);
        setLoadingProgress(currentProgress);

        await new Promise(resolve => setTimeout(resolve, stages[i].duration));
        currentProgress += progressIncrement;
        setLoadingProgress(Math.min(currentProgress, 95));
      }

      // Wait for the actual response
      const response = await responsePromise;

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      setLoadingStage('Finalizing results...');
      setLoadingProgress(100);

      const result = await response.json();
      console.log('Submission result:', result);

      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 300));

      setEvaluationResult(result);
    } catch (error) {
      console.error('Submission failed:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Network error: Unable to connect to the server. Please check if the backend is running.');
      } else {
        alert(`Submission failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingStage('');
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      apiKey: '',
      country: '',
      visaType: '',
      educationLevel: '',
      experienceYears: '',
      currentSalary: '',
      languageProficiency: '',
      hasAwards: false,
      awards: [],
      hasRecognizedEmployer: false
    });
    setDocuments([]);
    setRequiredDocs([]);
    setEvaluationResult(null);
  }

  return (
    <div className="bg-black text-white min-h-screen flex flex-col font-sans items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <div className="inline-block mb-6">
          <svg width="200" height="40" viewBox="0 0 200 40" className="fill-white">
            <text x="10" y="25" fontSize="18" fontWeight="bold" fontFamily="sans-serif">OpenSphere</text>
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Multi-Country Visa Evaluation
        </h1>
      </header>

      <main className="w-full max-w-lg">
        {isLoading ? (
          <LoadingScreen stage={loadingStage} progress={loadingProgress} />
        ) : evaluationResult ? (
          <ResultCard result={evaluationResult} onReset={resetForm} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 border border-gray-700 p-8 rounded-lg">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                disabled={isLoadingVisaData}
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
              >
                <option value="">
                  {isLoadingVisaData ? "Loading countries..." : "Select Country"}
                </option>
                {!isLoadingVisaData && Object.keys(visaData).length > 0 ? (
                  Object.keys(visaData).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))
                ) : !isLoadingVisaData ? (
                  <option disabled>No countries available</option>
                ) : null}
              </select>
              <select
                name="visaType"
                value={formData.visaType}
                onChange={handleInputChange}
                required
                disabled={!formData.country}
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
              >
                <option value="">Select Visa Type</option>
                {formData.country && visaData[formData.country]?.visas.map(visa => (
                  <option key={visa} value={visa}>{visa}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Education Level</option>
                <option value="High School">High School</option>
                <option value="Professional Certification">Professional Certification</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="PhD">PhD/Doctorate</option>
              </select>
              <input
                type="number"
                name="experienceYears"
                placeholder="Years of Experience"
                value={formData.experienceYears}
                onChange={handleInputChange}
                required
                min="0"
                max="50"
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="currentSalary"
                placeholder="Current Annual Salary (USD)"
                value={formData.currentSalary}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
              />
              <select
                name="languageProficiency"
                value={formData.languageProficiency}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Language Proficiency</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Fluent">Fluent</option>
                <option value="Native">Native</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 text-gray-300">
                <input
                  type="checkbox"
                  name="hasAwards"
                  checked={formData.hasAwards}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasAwards: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span>I have professional awards/recognition</span>
              </label>
              <label className="flex items-center space-x-3 text-gray-300">
                <input
                  type="checkbox"
                  name="hasRecognizedEmployer"
                  checked={formData.hasRecognizedEmployer}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasRecognizedEmployer: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span>Employer is a recognized sponsor</span>
              </label>
            </div>

            {requiredDocs.length > 0 && (
              <div className="p-4 border-l-4 border-green-500 bg-gray-800">
                <h3 className="font-semibold text-white">Required Documents:</h3>
                <ul className="list-disc list-inside text-gray-300 mt-2">
                  {requiredDocs.map(doc => <li key={doc}>{doc}</li>)}
                </ul>
              </div>
            )}

            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload Documents</label>
              
              {/* Drag and Drop Area */}
              <div 
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-green-500', 'bg-green-900/20');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-green-500', 'bg-green-900/20');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-green-500', 'bg-green-900/20');
                  const files = Array.from(e.dataTransfer.files).filter(validateFile);
                  setDocuments(prev => [...prev, ...files]);
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-300">
                  <span className="font-medium text-green-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PDF, DOC, DOCX, TXT files (Max 10MB each)</p>
              </div>
              
              <input
                id="file-upload"
                name="documents"
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
              />

              {/* Uploaded Files List */}
              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Uploaded Files ({documents.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800 border border-gray-600 rounded-md p-2">
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-300 truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
               <input
                 type="text"
                 name="apiKey"
                 placeholder="Partner API Key (Optional)"
                 value={formData.apiKey}
                 onChange={handleInputChange}
                 className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
               />
            </div>

            <button
              type="submit"
              disabled={isLoading || documents.length === 0}
              className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Uploading & Evaluating...</span>
                </div>
              ) : (
                `Get Evaluation ${documents.length > 0 ? `(${documents.length} files)` : ''}`
              )}
            </button>
          </form>
        )}
      </main>


    </div>
  );
}
