const { MasterProduct, BarcodeContribution } = require('../models');
const openFoodFactsService = require('./openFoodFactsService');
const logger = require('../utils/logger');

/**
 * High-performance 2-tier barcode lookup:
 * 1. Database Master Table (~5-15ms)
 * 2. Open Food Facts API Fallback (with automatic caching into DB)
 */
const lookupBarcode = async (barcode) => {
  const sanitized = String(barcode).trim();

  // Tier 1: Check Local Master Catalog
  const cachedProduct = await MasterProduct.findOne({
    where: { barcode: sanitized }
  });

  if (cachedProduct) {
    // Increment lookup count asynchronously (fire & forget)
    MasterProduct.increment('lookup_count', {
      by: 1,
      where: { id: cachedProduct.id }
    }).catch(err => logger.debug(`Failed to increment lookup_count: ${err.message}`));

    return {
      found: true,
      source: cachedProduct.source,
      cached: true,
      product: {
        id: cachedProduct.id,
        barcode: cachedProduct.barcode,
        name: cachedProduct.name,
        brand: cachedProduct.brand,
        category: cachedProduct.category,
        unit: cachedProduct.unit,
        description: cachedProduct.description,
        image_url: cachedProduct.image_url,
        mrp: cachedProduct.mrp,
        hsn_code: cachedProduct.hsn_code,
        source: cachedProduct.source,
        verified_status: cachedProduct.verified_status
      }
    };
  }

  // Tier 2: Check Open Food Facts Fallback
  const externalData = await openFoodFactsService.fetchByBarcode(sanitized);

  if (externalData) {
    // Automatically save into MasterProduct database so future hits are instant
    try {
      const created = await MasterProduct.create({
        ...externalData,
        lookup_count: 1
      });

      logger.info(`Auto-cached new product from OpenFoodFacts: [${sanitized}] ${created.name}`);

      return {
        found: true,
        source: 'OPEN_FOOD_FACTS',
        cached: false,
        product: {
          id: created.id,
          barcode: created.barcode,
          name: created.name,
          brand: created.brand,
          category: created.category,
          unit: created.unit,
          description: created.description,
          image_url: created.image_url,
          mrp: created.mrp,
          hsn_code: created.hsn_code,
          source: created.source,
          verified_status: created.verified_status
        }
      };
    } catch (saveError) {
      // If another process inserted it simultaneously, fetch that record
      logger.warn(`Notice on auto-caching barcode ${sanitized}: ${saveError.message}`);
      const fallback = await MasterProduct.findOne({ where: { barcode: sanitized } });
      if (fallback) {
        return {
          found: true,
          source: fallback.source,
          cached: true,
          product: fallback
        };
      }
    }
  }

  // Not found in Tier 1 or Tier 2
  return {
    found: false,
    barcode: sanitized,
    message: 'Product barcode not found in master catalog.'
  };
};

/**
 * Ingest new product contribution from an ERP merchant store
 */
const contributeBarcode = async ({ barcode, name, brand, category, unit, organization_id, client_ip, mrp, hsn_code }) => {
  const sanitizedBarcode = String(barcode).trim();
  const sanitizedName = String(name).trim();

  // 1. Record the contribution log
  const contribution = await BarcodeContribution.create({
    barcode: sanitizedBarcode,
    submitted_name: sanitizedName,
    submitted_brand: brand ? String(brand).trim() : null,
    submitted_category: category ? String(category).trim() : null,
    submitted_unit: unit ? String(unit).trim() : null,
    organization_id: organization_id || null,
    client_ip: client_ip || null
  });

  // 2. Check if already exists in MasterProduct
  const existing = await MasterProduct.findOne({ where: { barcode: sanitizedBarcode } });
  if (existing) {
    return {
      status: 'already_exists',
      contribution_id: contribution.id,
      master_product: existing
    };
  }

  // 3. Count distinct organizations that submitted this barcode
  const count = await BarcodeContribution.count({
    where: { barcode: sanitizedBarcode }
  });

  // If 2 or more contributions or marked verified, promote to Master
  if (count >= 2) {
    const promoted = await MasterProduct.create({
      barcode: sanitizedBarcode,
      name: sanitizedName,
      brand: brand ? String(brand).trim() : null,
      category: category ? String(category).trim() : 'General Retail',
      unit: unit ? String(unit).trim() : null,
      mrp: mrp || null,
      hsn_code: hsn_code || null,
      source: 'CROWDSOURCED',
      verified_status: 'VERIFIED',
      lookup_count: 1
    });

    await BarcodeContribution.update(
      { status: 'APPROVED' },
      { where: { barcode: sanitizedBarcode } }
    );

    return {
      status: 'promoted_to_master',
      contribution_id: contribution.id,
      master_product: promoted
    };
  }

  return {
    status: 'recorded_pending_consensus',
    contribution_id: contribution.id,
    contributions_count: count
  };
};

module.exports = {
  lookupBarcode,
  contributeBarcode
};

