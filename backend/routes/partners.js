import express from 'express';
import crypto from 'crypto';
import Partner from '../models/Partner.js';
import Evaluation from '../models/Evaluation.js';
import { authenticatePartner, requirePartner } from '../middleware/partnerAuth.js';
import { logger } from '../config/logger.js';

const router = express.Router();

// POST /api/partners/register - Register new partner
router.post('/register', async (req, res) => {
  try {
    const { name, email, company, website, contactPhone } = req.body;

    // Validate required fields
    if (!name || !email || !company) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, email, and company are required'
      });
    }

    // Check if partner already exists
    const existingPartner = await Partner.findOne({ email });
    if (existingPartner) {
      return res.status(409).json({
        error: 'Partner already exists',
        message: 'A partner with this email already exists'
      });
    }

    // Generate unique API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Create new partner
    const partner = new Partner({
      name,
      email,
      company,
      website,
      contactPhone,
      apiKey
    });

    await partner.save();

    logger.info(`New partner registered: ${company} (${email})`);

    res.status(201).json({
      message: 'Partner registered successfully',
      partner: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        company: partner.company,
        apiKey: partner.apiKey,
        plan: partner.plan,
        monthlyLimit: partner.monthlyLimit
      }
    });

  } catch (error) {
    logger.error('Partner registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register partner'
    });
  }
});

// GET /api/partners/profile - Get partner profile
router.get('/profile', authenticatePartner, requirePartner, async (req, res) => {
  try {
    const partner = req.partner;

    res.json({
      id: partner._id,
      name: partner.name,
      email: partner.email,
      company: partner.company,
      website: partner.website,
      contactPhone: partner.contactPhone,
      plan: partner.plan,
      monthlyLimit: partner.monthlyLimit,
      currentMonthUsage: partner.currentMonthUsage,
      usagePercentage: partner.usagePercentage,
      totalEvaluations: partner.totalEvaluations,
      isActive: partner.isActive,
      registeredAt: partner.registeredAt,
      lastUsed: partner.lastUsed
    });

  } catch (error) {
    logger.error('Error fetching partner profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch profile'
    });
  }
});

// PUT /api/partners/profile - Update partner profile
router.put('/profile', authenticatePartner, requirePartner, async (req, res) => {
  try {
    const partner = req.partner;
    const { name, company, website, contactPhone, allowedDomains, webhookUrl, emailNotifications } = req.body;

    // Update allowed fields
    if (name) partner.name = name;
    if (company) partner.company = company;
    if (website) partner.website = website;
    if (contactPhone) partner.contactPhone = contactPhone;
    if (allowedDomains) partner.allowedDomains = allowedDomains;
    if (webhookUrl) partner.webhookUrl = webhookUrl;
    if (emailNotifications !== undefined) partner.emailNotifications = emailNotifications;

    await partner.save();

    logger.info(`Partner profile updated: ${partner.company}`);

    res.json({
      message: 'Profile updated successfully',
      partner: {
        id: partner._id,
        name: partner.name,
        company: partner.company,
        website: partner.website,
        contactPhone: partner.contactPhone,
        allowedDomains: partner.allowedDomains,
        webhookUrl: partner.webhookUrl,
        emailNotifications: partner.emailNotifications
      }
    });

  } catch (error) {
    logger.error('Error updating partner profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
});

// GET /api/partners/dashboard - Get partner dashboard data
router.get('/dashboard', authenticatePartner, requirePartner, async (req, res) => {
  try {
    const partner = req.partner;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get evaluations for the period
    const evaluations = await Evaluation.find({
      partnerApiKey: partner.apiKey,
      submittedAt: { $gte: startDate, $lte: endDate }
    }).select('country visaType evaluationScore likelihood submittedAt');

    // Calculate statistics
    const totalEvaluations = evaluations.length;
    const averageScore = totalEvaluations > 0
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.evaluationScore, 0) / totalEvaluations
      : 0;

    // Group by country and visa type
    const countryStats = {};
    const visaTypeStats = {};
    const likelihoodStats = {};

    evaluations.forEach(evaluation => {
      // Country stats
      if (!countryStats[evaluation.country]) {
        countryStats[evaluation.country] = { count: 0, averageScore: 0, totalScore: 0 };
      }
      countryStats[evaluation.country].count++;
      countryStats[evaluation.country].totalScore += evaluation.evaluationScore;
      countryStats[evaluation.country].averageScore = countryStats[evaluation.country].totalScore / countryStats[evaluation.country].count;

      // Visa type stats
      if (!visaTypeStats[evaluation.visaType]) {
        visaTypeStats[evaluation.visaType] = { count: 0, averageScore: 0, totalScore: 0 };
      }
      visaTypeStats[evaluation.visaType].count++;
      visaTypeStats[evaluation.visaType].totalScore += evaluation.evaluationScore;
      visaTypeStats[evaluation.visaType].averageScore = visaTypeStats[evaluation.visaType].totalScore / visaTypeStats[evaluation.visaType].count;

      // Likelihood stats
      if (!likelihoodStats[evaluation.likelihood]) {
        likelihoodStats[evaluation.likelihood] = 0;
      }
      likelihoodStats[evaluation.likelihood]++;
    });

    res.json({
      partner: {
        name: partner.name,
        company: partner.company,
        plan: partner.plan,
        monthlyLimit: partner.monthlyLimit,
        currentMonthUsage: partner.currentMonthUsage,
        usagePercentage: partner.usagePercentage
      },
      statistics: {
        period,
        totalEvaluations,
        averageScore: Math.round(averageScore * 100) / 100,
        countryStats,
        visaTypeStats,
        likelihoodStats
      },
      recentEvaluations: evaluations.slice(0, 10) // Last 10 evaluations
    });

  } catch (error) {
    logger.error('Error fetching partner dashboard:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// POST /api/partners/regenerate-key - Regenerate API key
router.post('/regenerate-key', authenticatePartner, requirePartner, async (req, res) => {
  try {
    const partner = req.partner;

    // Generate new API key
    const newApiKey = crypto.randomBytes(32).toString('hex');
    partner.apiKey = newApiKey;

    await partner.save();

    logger.info(`API key regenerated for partner: ${partner.company}`);

    res.json({
      message: 'API key regenerated successfully',
      apiKey: newApiKey
    });

  } catch (error) {
    logger.error('Error regenerating API key:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to regenerate API key'
    });
  }
});

export default router;