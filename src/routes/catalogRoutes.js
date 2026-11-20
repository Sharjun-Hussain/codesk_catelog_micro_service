const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// Public or API-key protected routes
// Lookups and searches require API key authentication (or master key)
router.get('/lookup/:barcode', apiKeyAuth, catalogController.lookup);
router.post('/bulk-lookup', apiKeyAuth, catalogController.bulkLookup);
router.get('/search', apiKeyAuth, catalogController.search);

// Product contribution requires API key
router.post('/contribute', apiKeyAuth, catalogController.contribute);

module.exports = router;
