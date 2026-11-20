const catalogService = require('../services/catalogService');
const { MasterProduct, Sequelize } = require('../models');
const { classifyBarcode } = require('../utils/barcodeClassifier');
const { Op } = Sequelize;

/**
 * GET /api/v1/catalog/lookup/:barcode
 */
const lookup = async (req, res, next) => {
  try {
    const { barcode } = req.params;

    // 1. Run Barcode Classification Gatekeeper
    const classification = classifyBarcode(barcode);

    // If it's a weighing scale barcode, custom SKU, or local store item,
    // do not query master DB or external APIs!
    if (!classification.is_eligible_for_master) {
      return res.status(200).json({
        status: 'local_only',
        eligible_for_master: false,
        barcode_type: classification.barcode_type,
        message: classification.reason,
        data: {
          barcode: String(barcode).trim(),
          is_local: true,
          is_variable_measure: classification.details?.is_variable_measure || false
        }
      });
    }

    // 2. Query Master Catalog & Fallbacks
    const result = await catalogService.lookupBarcode(barcode);

    if (!result.found) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found in centralized catalog.',
        data: {
          barcode,
          found: false
        }
      });
    }

    return res.status(200).json({
      status: 'success',
      data: result.product,
      cached: result.cached,
      source: result.source
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/catalog/contribute
 */
const contribute = async (req, res, next) => {
  try {
    const { barcode, name, brand, category, unit, mrp, hsn_code, organization_id } = req.body;

    if (!barcode || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Barcode and product name are mandatory.'
      });
    }

    // 1. Run Barcode Classification Gatekeeper
    const classification = classifyBarcode(barcode);

    if (!classification.is_eligible_for_master) {
      return res.status(422).json({
        status: 'error',
        message: 'Cannot contribute in-store, weighted, or custom SKU barcode to the global catalog.',
        barcode_type: classification.barcode_type,
        reason: classification.reason
      });
    }

    // 2. Process contribution
    const result = await catalogService.contributeBarcode({
      barcode,
      name,
      brand,
      category,
      unit,
      mrp,
      hsn_code,
      organization_id: organization_id || req.client?.id || null,
      client_ip: req.ip
    });

    return res.status(201).json({
      status: 'success',
      message: 'Product contribution processed successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/catalog/search?q=...&limit=20
 */
const search = async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query parameter "q" is required.'
      });
    }

    const products = await MasterProduct.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { brand: { [Op.like]: `%${query}%` } },
          { barcode: { [Op.like]: `%${query}%` } }
        ]
      },
      limit,
      order: [['lookup_count', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/catalog/bulk-lookup
 * Batch barcode lookup for new store onboarding via CSV / Excel
 */
const bulkLookup = async (req, res, next) => {
  try {
    const { barcodes } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'An array of barcodes is required.'
      });
    }

    // Deduplicate and slice up to 200 items per request
    const uniqueList = [...new Set(barcodes.map(b => String(b).trim()).filter(Boolean))].slice(0, 200);

    // Classify into eligible vs local/invalid
    const eligibleBarcodes = [];
    const localOrInvalid = [];

    for (const b of uniqueList) {
      const classification = classifyBarcode(b);
      if (classification.is_eligible_for_master) {
        eligibleBarcodes.push(b);
      } else {
        localOrInvalid.push({
          barcode: b,
          barcode_type: classification.barcode_type,
          reason: classification.reason
        });
      }
    }

    const foundProducts = eligibleBarcodes.length > 0 ? await MasterProduct.findAll({
      where: {
        barcode: {
          [Op.in]: eligibleBarcodes
        }
      }
    }) : [];

    const foundBarcodes = new Set(foundProducts.map(p => p.barcode));
    const missing = eligibleBarcodes.filter(b => !foundBarcodes.has(b));

    return res.status(200).json({
      status: 'success',
      summary: {
        totalRequested: uniqueList.length,
        eligibleCount: eligibleBarcodes.length,
        foundCount: foundProducts.length,
        missingCount: missing.length,
        localOrInvalidCount: localOrInvalid.length
      },
      data: {
        found: foundProducts,
        missing,
        localOrInvalid
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  lookup,
  contribute,
  search,
  bulkLookup
};
