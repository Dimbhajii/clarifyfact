/**
 * Security Middleware for Backend API
 * Provides rate limiting, input validation, request sanitization, and security headers
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs, // Time window in milliseconds
    max: max, // Maximum number of requests
    message: {
      error: message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Use IP address for rate limiting
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    // Skip rate limiting for localhost in development
    skip: (req) => {
      const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip?.startsWith('::ffff:127.0.0.1');
      return process.env.NODE_ENV === 'development' && isLocalhost;
    }
  });
};

// General API rate limiter (100 requests per 15 minutes)
exports.generalRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for expensive operations (10 requests per hour)
exports.strictRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many requests for this resource. Please wait before trying again.'
);

// OpenAI API rate limiter (20 requests per 15 minutes)
exports.openaiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  20,
  'Too many OpenAI API requests. Please wait before trying again.'
);

// Security headers middleware
exports.securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request size limiter
exports.requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseFloat(maxSize);
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          error: 'Request entity too large',
          message: `Request size exceeds maximum allowed size of ${maxSize}`,
          maxSize: maxSize
        });
      }
    }
    next();
  };
};

// Input sanitization middleware
exports.sanitizeInput = (req, res, next) => {
  // Recursively sanitize string values in request body
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove null bytes and control characters (except newlines and tabs)
      return obj.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  next();
};

// Validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Input validation rules for assignment analysis
exports.validateAnalyzeAssignment = [
  body('assignmentTopic')
    .trim()
    .notEmpty().withMessage('Assignment topic is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Assignment topic must be between 10 and 1000 characters')
    .escape(),
  body('courseMaterials')
    .trim()
    .notEmpty().withMessage('Course materials are required')
    .isLength({ min: 50, max: 50000 }).withMessage('Course materials must be between 50 and 50000 characters')
];

// Input validation rules for fact checking
exports.validateFactCheck = [
  body('assignmentTopic')
    .trim()
    .notEmpty().withMessage('Assignment topic is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Assignment topic must be between 10 and 1000 characters')
    .escape(),
  body('selectedOpinion')
    .trim()
    .notEmpty().withMessage('Selected opinion is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Selected opinion must be between 10 and 2000 characters')
    .escape(),
  body('courseMaterials')
    .trim()
    .notEmpty().withMessage('Course materials are required')
    .isLength({ min: 50, max: 50000 }).withMessage('Course materials must be between 50 and 50000 characters')
];

// Input validation rules for assignment generation
exports.validateGenerateAssignment = [
  body('assignmentTopic')
    .trim()
    .notEmpty().withMessage('Assignment topic is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Assignment topic must be between 10 and 1000 characters')
    .escape(),
  body('selectedOpinion')
    .trim()
    .notEmpty().withMessage('Selected opinion is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Selected opinion must be between 10 and 2000 characters')
    .escape(),
  body('courseMaterials')
    .trim()
    .notEmpty().withMessage('Course materials are required')
    .isLength({ min: 50, max: 50000 }).withMessage('Course materials must be between 50 and 50000 characters'),
  body('verifiedSources')
    .optional()
    .isArray().withMessage('Verified sources must be an array')
    .custom((sources) => {
      if (sources.length > 20) {
        throw new Error('Maximum 20 verified sources allowed');
      }
      return true;
    })
];

// Error sanitization middleware
exports.sanitizeError = (error, req, res, next) => {
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log full error details on server
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Return sanitized error response
  const statusCode = error.statusCode || error.status || 500;
  const message = isDevelopment ? error.message : 'An internal server error occurred';
  
  res.status(statusCode).json({
    error: error.name || 'Error',
    message: message,
    ...(isDevelopment && { stack: error.stack })
  });
};

// Authentication middleware (Supabase JWT verification)
exports.authenticateRequest = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (req.path.includes('/generate-assignment') ||
          req.path.includes('/fact-check') ||
          req.path.includes('/analyze-assignment')) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please sign in to access this endpoint'
        });
      }
      return next();
    }

    const token = authHeader.split('Bearer ')[1];

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Server misconfigured', message: 'Supabase credentials missing' });
      }
      req.user = { uid: 'dev-user', token };
      return next();
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Token verification failed in development. Allowing request.');
        req.user = { uid: 'dev-user', token };
        return next();
      }
      return res.status(401).json({ error: 'Invalid token', message: 'Please sign in again' });
    }

    req.user = {
      uid: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at != null,
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed', message: 'Unable to verify authentication' });
  }
};

// API key validation middleware (for sensitive operations)
exports.validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.body?.apiKey;
  const validApiKey = process.env.API_SECRET_KEY;
  
  // If no API key is required in environment, skip validation
  if (!validApiKey) {
    return next();
  }

  // For file uploads, require API key
  if (req.path.includes('/upload-to-drive')) {
    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'API key is required for this endpoint'
      });
    }
  }

  next();
};

// Request timeout middleware
exports.requestTimeout = (timeoutMs = 300000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process'
        });
      }
    });
    next();
  };
};

// CORS configuration
exports.corsOptions = (allowedOrigins) => {
  return {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests) in development
      if (!origin && process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // Block requests with no origin in production
      if (!origin && process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: Origin header required'));
      }
      
      // Allow if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400 // 24 hours
  };
};

