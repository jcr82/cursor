const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey;
  const expectedApiKey = process.env.PERSONAL_DATA_API_KEY;

  // If no API key is set in environment, allow access (development mode)
  if (!expectedApiKey) {
    console.warn('⚠️  No PERSONAL_DATA_API_KEY set. Running in development mode with open access.');
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Provide it via X-API-Key header or apiKey query parameter.'
    });
  }

  if (apiKey !== expectedApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key.'
    });
  }

  next();
};

// JWT authentication middleware (for future expansion)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different types of requests
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many requests from this IP, please try again later.'
  ),

  // Chat API rate limit (more restrictive)
  chat: createRateLimit(
    1 * 60 * 1000, // 1 minute
    20, // 20 requests per minute
    'Too many chat requests, please slow down.'
  ),

  // Personal data modification (very restrictive)
  dataModification: createRateLimit(
    5 * 60 * 1000, // 5 minutes
    10, // 10 modifications per 5 minutes
    'Too many data modification requests, please try again later.'
  ),

  // Data reading (less restrictive)
  dataReading: createRateLimit(
    1 * 60 * 1000, // 1 minute
    50, // 50 reads per minute
    'Too many data reading requests, please slow down.'
  )
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  console.log(`[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}`);

  // Log response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // API-specific headers
  res.header('X-API-Version', '1.0.0');
  res.header('X-Powered-By', 'Personalized-Chatbot-API');

  next();
};

module.exports = {
  authenticateApiKey,
  authenticateJWT,
  rateLimits,
  requestLogger,
  errorHandler,
  securityHeaders
};