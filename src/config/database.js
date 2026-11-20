require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const isTest = process.env.NODE_ENV === 'test';
const dbName = isTest
  ? (process.env.DB_NAME_TEST || 'pos_catalog_test')
  : (process.env.DB_NAME || 'pos_catalog_system');

const SLOW_QUERY_MS = parseInt(process.env.DB_SLOW_QUERY_MS || '500', 10);
const logAllQueries = process.env.DB_LOGGING === 'true';

const sqlLogger = (query, durationMs) => {
  if (logAllQueries) {
    logger.debug(`[SQL ${durationMs}ms] ${query}`);
  } else if (durationMs >= SLOW_QUERY_MS) {
    logger.warn(`[SLOW QUERY ${durationMs}ms] ${String(query).slice(0, 500)}`);
  }
};

const sequelize = new Sequelize(
  dbName,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: isTest ? false : sqlLogger,
    benchmark: true,
    timezone: '+05:30',
    dialectOptions: {
      decimalNumbers: true,
      dateStrings: true,
      typeCast: true
    },
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
    }
  }
);

module.exports = sequelize;
