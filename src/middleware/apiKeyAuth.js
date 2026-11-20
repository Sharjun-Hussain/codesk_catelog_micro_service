const crypto = require('crypto');
const { ApiKey } = require('../models');
const logger = require('../utils/logger');

const hashKey = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');

/**
 * High-security API Key Authenticator
 * Supports:
 * 1. Global Master API Key from .env (for internal ERP backend-to-backend calls)
 * 2. Database-backed client API Keys (with key hashing & last_used tracking)
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing X-API-Key authentication header'
      });
    }

    // 1. Check Master Key (super admin service-to-service)
    const masterKey = process.env.MASTER_API_KEY;
    if (masterKey && rawKey === masterKey) {
      req.client = {
        role: 'ADMIN',
        name: 'Master ERP Service'
      };
      return next();
    }

    // 2. Check Database ApiKey
    const hashed = hashKey(rawKey);
    const keyRecord = await ApiKey.findOne({
      where: {
        key_hash: hashed,
        is_active: true
      }
    });

    if (!keyRecord) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or revoked API key'
      });
    }

    req.client = {
      id: keyRecord.id,
      name: keyRecord.name,
      role: keyRecord.role,
      rateLimitRpm: keyRecord.rate_limit_rpm
    };

    // Touch last_used_at in background asynchronously
    ApiKey.update({ last_used_at: new Date() }, { where: { id: keyRecord.id } }).catch((err) => {
      logger.warn(`Failed to update ApiKey last_used_at: ${err.message}`);
    });

    next();
  } catch (error) {
    logger.error(`API Key Authentication error: ${error.message}`);
    return res.status(500).json({ status: 'error', message: 'Authentication failure' });
  }
};

module.exports = apiKeyAuth;

