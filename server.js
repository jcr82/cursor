const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import middleware and routes
const { 
  rateLimits, 
  requestLogger, 
  errorHandler, 
  securityHeaders 
} = require('./middleware/auth');
const personalDataRoutes = require('./routes/personalData');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting when behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  }
}));

// Custom security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  credentials: true
}));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimits.general);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// API Routes
app.use('/api/personal-data', personalDataRoutes);
app.use('/api/chat', chatRoutes);

// Legacy chat endpoint for backward compatibility
app.post('/api/chat', (req, res) => {
  // This will be handled by the chat routes
  res.redirect(307, '/api/chat/');
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'Personalized Chatbot API',
    version: '1.0.0',
    description: 'A comprehensive API for managing personal data and providing personalized AI chat responses using Google Gemini',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      'Personal Data Management': {
        'GET /personal-data': 'Get all personal data',
        'PUT /personal-data': 'Update all personal data',
        'GET /personal-data/:section': 'Get specific data section',
        'PUT /personal-data/:section': 'Update specific data section',
        'POST /personal-data/search': 'Search personal data for AI context',
        'POST /personal-data/validate': 'Validate personal data structure',
        'GET /personal-data/schema/info': 'Get data schema information',
        'GET /personal-data/health': 'Personal data API health check'
      },
      'AI Chat': {
        'POST /chat': 'Send message to AI assistant (with personal context)',
        'POST /chat/context': 'Get or clear chat context',
        'GET /chat/sessions': 'Get active chat sessions',
        'POST /chat/preview': 'Preview personal data for a query',
        'GET /chat/health': 'Chat API health check'
      },
      'General': {
        'GET /health': 'Overall system health check',
        'GET /docs': 'This API documentation'
      }
    },
    authentication: {
      personalDataAPI: 'Requires X-API-Key header or apiKey query parameter',
      chatAPI: 'No authentication required for basic chat',
      note: 'Set PERSONAL_DATA_API_KEY environment variable to enable authentication'
    },
    examples: {
      chatRequest: {
        url: 'POST /api/chat',
        body: {
          message: "What are Juan's recent projects?",
          sessionId: "user123",
          includePersonalContext: true
        }
      },
      personalDataUpdate: {
        url: 'PUT /api/personal-data/biography',
        headers: { 'X-API-Key': 'your-api-key' },
        body: {
          name: 'Juan Perez',
          title: 'Full Stack Developer',
          description: 'Passionate developer with expertise in modern web technologies',
          location: 'San Francisco, CA'
        }
      }
    },
    rateLimits: {
      general: '100 requests per 15 minutes',
      chat: '20 requests per minute',
      dataModification: '10 requests per 5 minutes',
      dataReading: '50 requests per minute'
    }
  };

  res.json(apiDocs);
});

// Overall health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      server: 'healthy',
      geminiAI: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key') ? 'configured' : 'not-configured',
      personalDataAPI: 'healthy',
      chatAPI: 'healthy'
    },
    configuration: {
      hasGeminiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key'),
      hasPersonalDataKey: !!process.env.PERSONAL_DATA_API_KEY,
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  };

  res.json(health);
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /api/docs - API Documentation',
      'GET /api/health - Health Check',
      'POST /api/chat - Chat with AI',
      'GET /api/personal-data - Get personal data',
      'PUT /api/personal-data - Update personal data'
    ]
  });
});

// Handle all other 404s by serving index.html (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Personalized Chatbot API Server Started');
  console.log('==========================================');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log('');
  
  // Configuration status
  console.log('🔧 Configuration Status:');
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key' ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Personal Data Security: ${process.env.PERSONAL_DATA_API_KEY ? '✅ Secured with API key' : '⚠️  Open access (dev mode)'}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  
  console.log('');
  console.log('🎯 Quick Start:');
  console.log('   1. Visit http://localhost:3000 for the chat interface');
  console.log('   2. Check http://localhost:3000/api/docs for API documentation');
  console.log('   3. Add personal data via the API or upcoming admin interface');
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo-key') {
    console.log('');
    console.log('⚠️  To enable AI responses:');
    console.log('   1. Get API key: https://makersuite.google.com/app/apikey');
    console.log('   2. Add to .env: GEMINI_API_KEY=your_key_here');
    console.log('   3. Restart server');
  }
  
  if (!process.env.PERSONAL_DATA_API_KEY) {
    console.log('');
    console.log('🔒 To secure personal data API:');
    console.log('   1. Add to .env: PERSONAL_DATA_API_KEY=your_secure_key');
    console.log('   2. Restart server');
  }
  
  console.log('\n==========================================\n');
});