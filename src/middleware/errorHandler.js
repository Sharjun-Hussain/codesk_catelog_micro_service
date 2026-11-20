const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  logger.error(`[Error] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: isDev ? err.stack : undefined
  });

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 && !isDev ? 'Internal server error' : err.message,
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorHandler;

