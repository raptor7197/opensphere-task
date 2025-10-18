
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001';

// A simple card to display the result
const ResultCard = ({ result, onReset }) => (
  <div className="w-full max-w-lg p-8 space-y-6 bg-gray-900 border border-gray-700 rounded-lg">
    <h2 className="text-2xl font-bold text-center text-white">Evaluation Result</h2>
    <div className="text-center">
      <p className="text-lg text-gray-300">Your Score</p>
      <p className="text-6xl font-bold text-green-400">{result.score}</p>
    </div>
    <div className="text-center p-4 bg-gray-800 border border-gray-700 rounded-md">
      <p className="text-lg font-semibold text-white">Summary</p>
      <p className="text-gray-300">{result.summary}</p>
    </div>
    <button
      onClick={onReset}
      className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
    >
      Start New Evaluation
    </button>
  </div>
);


export default function App() {
  const [visaData, setVisaData] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    apiKey: '',
    country: '',
    visaType: '',
  });
  const [documents, setDocuments] = useState([]);
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/visas`)
      .then(res => res.json())
      .then(data => setVisaData(data))
      .catch(err => console.error("Failed to fetch visa data:", err));
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
    setUploadProgress(0);

    const submissionData = new FormData();
    submissionData.append('name', formData.name);
    submissionData.append('email', formData.email);
    submissionData.append('apiKey', formData.apiKey);
    submissionData.append('country', formData.country);
    submissionData.append('visaType', formData.visaType);
    for (let i = 0; i < documents.length; i++) {
      submissionData.append('documents', documents[i]);
    }

    try {
      const response = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        body: submissionData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      
      setEvaluationResult(result);
    } catch (error) {
      console.error('Submission failed:', error);
      alert(`Submission failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };
  
  const resetForm = () => {
    setFormData({ name: '', email: '', apiKey: '', country: '', visaType: '' });
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
        {evaluationResult ? (
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
                className="w-full bg-gray-800 border border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Country</option>
                {Object.keys(visaData).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
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
