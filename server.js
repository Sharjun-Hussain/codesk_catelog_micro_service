require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mysql = require('mysql2/promise');

const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');

const app = express();

// TRUST PROXY: Essential for Traefik / reverse proxy deployment
// Ensures req.ip and protocol are accurate
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // API-only service
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked for origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};
app.use(cors(corsOptions));

// HTTP Request Logging & Compression
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    skip: (req) => req.url === '/health' || req.url === '/api/health'
  }));
}
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Rate Limiter
app.use(rateLimiter);

// Mount API Routes
app.use('/api', routes);
app.use('/health', require('./src/routes/healthRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5005', 10);

/**
 * Auto-ensure MySQL Database exists before connecting Sequelize
 */
const ensureDatabaseExists = async () => {
  const dbName = process.env.DB_NAME || 'codesk_catalog_system';
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();
    logger.info(`Database verification passed for: ${dbName}`);
  } catch (err) {
    logger.warn(`Database pre-check warning: ${err.message}. Proceeding with Sequelize connection...`);
  }
};

/**
 * Server Bootstrap
 */
const startServer = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`====================================================`);
      logger.info(`🚀 CoDesk Catalog Service running on port ${PORT}`);
      logger.info(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   Health check: http://localhost:${PORT}/health`);
      logger.info(`====================================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
          logger.info('Database connections closed.');
          process.exit(0);
        } catch (err) {
          logger.error(`Error during graceful shutdown: ${err.message}`);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error(`Fatal server startup error: ${error.message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
