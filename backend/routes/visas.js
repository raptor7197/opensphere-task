import express from 'express';
import { visaData } from '../config/visaData.js';
import { logger } from '../config/logger.js';

const router = express.Router();

// GET /api/visas - Get all visa data
router.get('/', (req, res) => {
  try {
    logger.info('Visa data requested');

    // Return simplified visa data for frontend
    const simplifiedData = {};

    Object.keys(visaData).forEach(country => {
      simplifiedData[country] = {
        visas: visaData[country].visas,
        documents: visaData[country].documents
      };
    });

    res.json(simplifiedData);
  } catch (error) {
    logger.error('Error fetching visa data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch visa data'
    });
  }
});

// GET /api/visas/:country - Get visa data for specific country
router.get('/:country', (req, res) => {
  try {
    const { country } = req.params;

    if (!visaData[country]) {
      return res.status(404).json({
        error: 'Country not found',
        message: `Visa data not available for ${country}`
      });
    }

    logger.info(`Visa data requested for country: ${country}`);

    res.json({
      country,
      visas: visaData[country].visas,
      documents: visaData[country].documents
    });
  } catch (error) {
    logger.error('Error fetching country visa data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch country visa data'
    });
  }
});

// GET /api/visas/:country/:visaType - Get specific visa requirements
router.get('/:country/:visaType', (req, res) => {
  try {
    const { country, visaType } = req.params;

    if (!visaData[country]) {
      return res.status(404).json({
        error: 'Country not found',
        message: `Visa data not available for ${country}`
      });
    }

    if (!visaData[country].requirements[visaType]) {
      return res.status(404).json({
        error: 'Visa type not found',
        message: `Visa type ${visaType} not available for ${country}`
      });
    }

    logger.info(`Visa requirements requested for ${country} - ${visaType}`);

    res.json({
      country,
      visaType,
      documents: visaData[country].documents[visaType],
      requirements: visaData[country].requirements[visaType]
    });
  } catch (error) {
    logger.error('Error fetching visa requirements:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch visa requirements'
    });
  }
});

export default router;