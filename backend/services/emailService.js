const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } catch (error) {
      console.log('Email service not configured:', error.message);
    }
  }

  async sendEvaluationResults(userEmail, userName, evaluation) {
    if (!this.transporter) {
      console.log('Email service not configured - skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const htmlContent = this.generateEmailHTML(userName, evaluation);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'OpenSphere Visa Tool <noreply@opensphere.ai>',
        to: userEmail,
        subject: `Your Visa Evaluation Results - ${evaluation.country} ${evaluation.visaType}`,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, message: error.message };
    }
  }

  generateEmailHTML(userName, evaluation) {
    const scoreColor = this.getScoreColor(evaluation.cappedScore);
    const likelihoodColor = this.getLikelihoodColor(evaluation.likelihood);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Visa Evaluation Results</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #1a1a1a; color: white; padding: 30px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { padding: 30px; }
        .score-section { text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
        .score { font-size: 48px; font-weight: bold; color: ${scoreColor}; margin: 10px 0; }
        .likelihood { font-size: 18px; font-weight: bold; color: ${likelihoodColor}; }
        .summary { background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .recommendations { margin: 20px 0; }
        .recommendation { padding: 10px; margin: 10px 0; border-left: 4px solid #28a745; background-color: #f8f9fa; }
        .score-breakdown { margin: 20px 0; }
        .score-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .footer { background-color: #1a1a1a; color: #ccc; padding: 20px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">OpenSphere</div>
            <h1>Visa Evaluation Results</h1>
        </div>

        <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>We've completed your visa evaluation for <strong>${evaluation.country} - ${evaluation.visaType}</strong>. Here are your results:</p>

            <div class="score-section">
                <div class="score">${evaluation.cappedScore}/100</div>
                <div class="likelihood">${evaluation.likelihood} Chance of Success</div>
            </div>

            <div class="summary">
                <h3>Summary</h3>
                <p>${evaluation.summary}</p>
            </div>

            <div class="score-breakdown">
                <h3>Score Breakdown</h3>
                <div class="score-item">
                    <span>Education Qualification</span>
                    <span>${evaluation.scores.education}/25</span>
                </div>
                <div class="score-item">
                    <span>Work Experience</span>
                    <span>${evaluation.scores.experience}/20</span>
                </div>
                <div class="score-item">
                    <span>Salary/Income</span>
                    <span>${evaluation.scores.salary}/20</span>
                </div>
                <div class="score-item">
                    <span>Document Completeness</span>
                    <span>${evaluation.scores.documents}/15</span>
                </div>
                <div class="score-item">
                    <span>Recognition/Awards</span>
                    <span>${evaluation.scores.awards}/10</span>
                </div>
                <div class="score-item">
                    <span>Language Proficiency</span>
                    <span>${evaluation.scores.language}/5</span>
                </div>
                <div class="score-item">
                    <span>Employer Status</span>
                    <span>${evaluation.scores.employer}/5</span>
                </div>
            </div>

            ${evaluation.recommendations && evaluation.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>Recommendations for Improvement</h3>
                ${evaluation.recommendations.map(rec =>
                    `<div class="recommendation">
                        <strong>${rec.category}:</strong> ${rec.suggestion}
                    </div>`
                ).join('')}
            </div>
            ` : ''}

            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Review the recommendations above to improve your profile</li>
                <li>Ensure all required documents are properly prepared</li>
                <li>Consider consulting with an immigration attorney</li>
                <li>Visit the official immigration website for the most current requirements</li>
            </ul>

            <p><em>This evaluation is for informational purposes only and does not guarantee visa approval. Official immigration decisions are made by government authorities.</em></p>
        </div>

        <div class="footer">
            <p>&copy; 2025 OpenSphere, Inc. All Rights Reserved</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  getScoreColor(score) {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  }

  getLikelihoodColor(likelihood) {
    switch (likelihood) {
      case 'Excellent': return '#28a745';
      case 'Good': return '#6f42c1';
      case 'Fair': return '#ffc107';
      case 'Low': return '#fd7e14';
      case 'Very Low': return '#dc3545';
      default: return '#6c757d';
    }
  }
}

module.exports = new EmailService();