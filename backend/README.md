# Multi-Country Visa Evaluation Backend

A Node.js/Express backend API for evaluating visa applications across multiple countries using AI-powered analysis.

## Features

- **Multi-country visa support**: US, Ireland, Poland, France, Netherlands, Germany
- **AI-powered evaluations**: Integration with Google Gemini AI for intelligent analysis
- **Document upload handling**: Secure file upload with validation
- **Partner API system**: API key authentication for integration partners
- **Rate limiting**: Built-in protection against abuse
- **Comprehensive logging**: Winston-based logging system
- **MongoDB integration**: Persistent storage for evaluations and partners

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key

### Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Required environment variables**:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/visa_evaluation
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=development
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

The API will be available at `http://localhost:3001`

## API Documentation

### Core Endpoints

- `GET /health` - Health check
- `GET /api/docs` - API documentation
- `GET /api/visas` - Get all visa data
- `POST /api/submissions` - Submit visa evaluation
- `POST /api/partners/register` - Register new partner

### Visa Evaluation

**POST** `/api/submissions`

Submit a visa evaluation with documents:

```javascript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('country', 'United States');
formData.append('visaType', 'H-1B');
formData.append('educationLevel', 'Bachelor');
formData.append('experienceYears', '5');
formData.append('currentSalary', '80000');
formData.append('languageProficiency', 'Fluent');
formData.append('hasAwards', 'false');
formData.append('hasRecognizedEmployer', 'true');
formData.append('documents', file1);
formData.append('documents', file2);

fetch('http://localhost:3001/api/submissions', {
  method: 'POST',
  body: formData
});
```

**Response**:
```json
{
  "score": 78,
  "likelihood": "Good",
  "scores": {
    "education": 20,
    "experience": 18,
    "salary": 18,
    "documents": 12,
    "awards": 5,
    "language": 4,
    "employer": 5
  },
  "summary": "Your profile shows strong potential for H-1B approval...",
  "recommendations": [
    {
      "category": "Education",
      "priority": "Medium",
      "suggestion": "Consider obtaining additional certifications..."
    }
  ]
}
```

### Partner Integration

**Register as Partner**:
```bash
curl -X POST http://localhost:3001/api/partners/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane Smith",
    "email": "jane@lawfirm.com",
    "company": "Smith Immigration Law",
    "website": "https://smithlaw.com"
  }'
```

**Use Partner API Key**:
```javascript
fetch('http://localhost:3001/api/submissions', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-partner-api-key'
  },
  body: formData
});
```

## Supported Countries & Visas

### United States
- **O-1A**: Extraordinary ability (sciences, business, education)
- **O-1B**: Extraordinary achievement (arts, motion pictures)
- **H-1B**: Specialty occupation workers

### Ireland
- **Critical Skills Employment Permit**: High-demand occupations

### Poland
- **Work Permit Type C**: General work authorization

### France
- **Talent Passport**: Highly qualified professionals
- **Salarié en Mission**: Intra-company transfers

### Netherlands
- **Knowledge Migrant Permit**: Skilled workers

### Germany
- **EU Blue Card**: Highly qualified professionals
- **ICT Permit**: Intra-corporate transfers

## File Upload Requirements

- **Supported formats**: PDF, DOC, DOCX, TXT
- **Maximum file size**: 10MB per file
- **Maximum files**: 10 per submission
- **Required documents vary by visa type**

## AI Evaluation Logic

The system uses Google Gemini AI for intelligent evaluation:

1. **Application Analysis**: Reviews all submitted data and documents
2. **Requirement Matching**: Compares against specific visa requirements
3. **Scoring Algorithm**: Calculates scores across 7 categories:
   - Education (25 points)
   - Experience (20 points)
   - Salary (20 points)
   - Documents (15 points)
   - Awards (10 points)
   - Language (5 points)
   - Employer (5 points)

4. **Recommendations**: Provides specific improvement suggestions
5. **Fallback Logic**: Rule-based evaluation if AI is unavailable

## Database Schema

### Evaluations
```javascript
{
  name: String,
  email: String,
  country: String,
  visaType: String,
  evaluationScore: Number,
  likelihood: String,
  scores: Object,
  summary: String,
  recommendations: Array,
  submittedAt: Date
}
```

### Partners
```javascript
{
  name: String,
  email: String,
  company: String,
  apiKey: String,
  plan: String,
  monthlyLimit: Number,
  currentMonthUsage: Number,
  isActive: Boolean
}
```

## Security Features

- **Rate limiting**: 100 requests per 15 minutes per IP
- **File validation**: Type and size restrictions
- **API key authentication**: Secure partner access
- **Input sanitization**: Prevents injection attacks
- **CORS protection**: Configurable origins
- **Helmet security**: HTTP headers protection

## Monitoring & Logging

- **Winston logging**: Structured JSON logs
- **Error tracking**: Comprehensive error handling
- **Performance metrics**: Request timing and usage stats
- **Health checks**: System status monitoring

## Development

### Project Structure
```
backend/
├── config/          # Configuration files
├── models/          # MongoDB schemas
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── services/        # Business logic
├── uploads/         # File storage
├── logs/           # Log files
└── server.js       # Application entry point
```

### Available Scripts
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # Run tests
```

### Environment Variables
```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/visa_evaluation

# AI Service
GEMINI_API_KEY=your_api_key

# Security
JWT_SECRET=your_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Uploads
MAX_FILE_SIZE=10485760
MAX_FILES_PER_SUBMISSION=10
```

## Deployment

### Production Checklist

1. **Environment Setup**:
   - Set `NODE_ENV=production`
   - Configure production MongoDB URI
   - Set strong JWT secret
   - Configure production CORS origins

2. **Security**:
   - Enable HTTPS
   - Set up SSL certificates
   - Configure firewall rules
   - Enable MongoDB authentication

3. **Monitoring**:
   - Set up log aggregation
   - Configure health check monitoring
   - Set up error alerting
   - Monitor API usage

### Docker Deployment
```bash
# Build image
docker build -t visa-evaluation-api .

# Run container
docker run -p 3001:3001 --env-file .env visa-evaluation-api
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**:
   - Check MONGODB_URI in .env
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Gemini API Errors**:
   - Verify GEMINI_API_KEY is valid
   - Check API quota limits
   - Review API usage in Google Cloud Console

3. **File Upload Issues**:
   - Check file size limits
   - Verify supported file types
   - Ensure uploads directory exists and is writable

4. **CORS Errors**:
   - Add frontend URL to CORS origins
   - Check preflight request handling
   - Verify headers configuration

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details