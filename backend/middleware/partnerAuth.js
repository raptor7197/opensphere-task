import Partner from '../models/Partner.js';
import { logger } from '../config/logger.js';

export const authenticatePartner = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.body.apiKey;

    // If no API key provided, continue without partner (regular user)
    if (!apiKey) {
      req.partner = null;
      return next();
    }

    // Find partner by API key
    const partner = await Partner.findOne({ apiKey, isActive: true });

    if (!partner) {
      logger.warn(`Invalid API key attempted: ${apiKey}`);
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or inactive'
      });
    }

    // Check if partner can make requests (within limits)
    if (!partner.canMakeRequest()) {
      logger.warn(`Partner ${partner.name} exceeded monthly limit`);
      return res.status(429).json({
        error: 'Monthly limit exceeded',
        message: `You have exceeded your monthly limit of ${partner.monthlyLimit} evaluations`,
        currentUsage: partner.currentMonthUsage,
        monthlyLimit: partner.monthlyLimit
      });
    }

    // Check domain restrictions if configured
    if (partner.allowedDomains && partner.allowedDomains.length > 0) {
      const origin = req.headers.origin;
      const referer = req.headers.referer;

      const isAllowedDomain = partner.allowedDomains.some(domain => {
        return (origin && origin.includes(domain)) || (referer && referer.includes(domain));
      });

      if (!isAllowedDomain) {
        logger.warn(`Partner ${partner.name} attempted access from unauthorized domain`);
        return res.status(403).json({
          error: 'Domain not allowed',
          message: 'Your API key is not authorized for this domain'
        });
      }
    }

    // Attach partner to request object
    req.partner = partner;
    next();

  } catch (error) {
    logger.error('Partner authentication error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

export const requirePartner = (req, res, next) => {
  if (!req.partner) {
    return res.status(401).json({
      error: 'Partner authentication required',
      message: 'This endpoint requires a valid partner API key'
    });
  }
  next();
};