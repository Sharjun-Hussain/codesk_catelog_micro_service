const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const catalogRoutes = require('./catalogRoutes');

// Mount Routes
router.use('/health', healthRoutes);
router.use('/v1/catalog', catalogRoutes);

module.exports = router;
