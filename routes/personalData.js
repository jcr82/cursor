const express = require('express');
const router = express.Router();
const PersonalData = require('../models/PersonalData');
const { authenticateApiKey, rateLimits } = require('../middleware/auth');

// Initialize PersonalData instance
const personalData = new PersonalData();

// Apply authentication to all personal data routes
router.use(authenticateApiKey);

// GET /api/personal-data - Get all personal data
router.get('/', rateLimits.dataReading, async (req, res) => {
  try {
    const data = await personalData.getAllData();
    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Personal data not found'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Personal data retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving personal data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve personal data'
    });
  }
});

// PUT /api/personal-data - Update all personal data
router.put('/', rateLimits.dataModification, async (req, res) => {
  try {
    const updatedData = await personalData.updateData(req.body);
    
    res.json({
      success: true,
      data: updatedData,
      message: 'Personal data updated successfully'
    });
  } catch (error) {
    console.error('Error updating personal data:', error);
    
    if (error.message.includes('Validation error')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update personal data'
    });
  }
});

// GET /api/personal-data/:section - Get specific section
router.get('/:section', rateLimits.dataReading, async (req, res) => {
  try {
    const { section } = req.params;
    const sectionData = await personalData.getSection(section);
    
    if (!sectionData) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Section '${section}' not found`
      });
    }

    res.json({
      success: true,
      data: sectionData,
      section,
      message: `Section '${section}' retrieved successfully`
    });
  } catch (error) {
    console.error(`Error retrieving section ${req.params.section}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to retrieve section '${req.params.section}'`
    });
  }
});

// PUT /api/personal-data/:section - Update specific section
router.put('/:section', rateLimits.dataModification, async (req, res) => {
  try {
    const { section } = req.params;
    const updatedSection = await personalData.updateSection(section, req.body);
    
    res.json({
      success: true,
      data: updatedSection,
      section,
      message: `Section '${section}' updated successfully`
    });
  } catch (error) {
    console.error(`Error updating section ${req.params.section}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to update section '${req.params.section}'`
    });
  }
});

// POST /api/personal-data/search - Search personal data for AI context
router.post('/search', rateLimits.dataReading, async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query is required'
      });
    }

    const relevantData = await personalData.searchRelevantData(query);
    
    res.json({
      success: true,
      data: relevantData,
      query,
      message: 'Relevant data retrieved successfully'
    });
  } catch (error) {
    console.error('Error searching personal data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search personal data'
    });
  }
});

// POST /api/personal-data/validate - Validate personal data structure
router.post('/validate', rateLimits.dataReading, async (req, res) => {
  try {
    const validationResult = personalData.validate(req.body);
    
    if (validationResult.error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Data validation failed',
        details: validationResult.error.details
      });
    }

    res.json({
      success: true,
      message: 'Data validation passed',
      data: validationResult.value
    });
  } catch (error) {
    console.error('Error validating personal data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate personal data'
    });
  }
});

// GET /api/personal-data/schema - Get the data schema (for frontend forms)
router.get('/schema/info', rateLimits.dataReading, async (req, res) => {
  try {
    const schema = {
      sections: {
        biography: {
          description: 'Basic personal information and background',
          required: ['name', 'title', 'description'],
          optional: ['location', 'age', 'background']
        },
        skills: {
          description: 'Technical and soft skills with proficiency levels',
          structure: 'array',
          fields: ['name', 'category', 'proficiency', 'yearsOfExperience', 'description']
        },
        projects: {
          description: 'Personal and professional projects',
          structure: 'array',
          fields: ['name', 'description', 'technologies', 'status', 'startDate', 'endDate', 'repositoryUrl', 'demoUrl', 'role', 'achievements']
        },
        experience: {
          description: 'Work experience and professional history',
          structure: 'array',
          fields: ['company', 'position', 'startDate', 'endDate', 'description', 'achievements', 'technologies', 'isCurrent']
        },
        education: {
          description: 'Educational background',
          structure: 'array',
          fields: ['institution', 'degree', 'field', 'startDate', 'endDate', 'gpa', 'achievements']
        },
        preferences: {
          description: 'Personal preferences and characteristics',
          fields: ['workStyle', 'interests', 'goals', 'values', 'communicationStyle', 'preferredTechnologies']
        },
        socialLinks: {
          description: 'Social media and professional profile links',
          structure: 'array',
          fields: ['platform', 'url', 'username', 'isPublic']
        }
      },
      enums: {
        proficiency: ['beginner', 'intermediate', 'advanced', 'expert'],
        projectStatus: ['completed', 'in-progress', 'planned', 'archived']
      }
    };

    res.json({
      success: true,
      data: schema,
      message: 'Schema information retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving schema info:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve schema information'
    });
  }
});

// Health check for personal data API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'personal-data-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;