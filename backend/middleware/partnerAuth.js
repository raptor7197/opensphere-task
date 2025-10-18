const Partner = require('../models/Partner');

const authenticatePartner = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required. Please provide x-api-key header.'
      });
    }

    // For development, allow a simple test key
    if (apiKey === 'test-partner-key') {
      req.partner = {
        _id: 'test-partner',
        name: 'Test Partner',
        company: 'Test Company',
        allowedCountries: [],
        customScoreCap: 85
      };
      return next();
    }

    // In production, validate against database
    const partner = await Partner.findOne({ apiKey: apiKey, isActive: true });

    if (!partner) {
      return res.status(401).json({
        error: 'Invalid API key or partner account is inactive.'
      });
    }

    // Update last accessed time
    partner.lastAccessed = new Date();
    await partner.save();

    req.partner = partner;
    next();
  } catch (error) {
    console.error('Partner authentication error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
};

module.exports = { authenticatePartner };