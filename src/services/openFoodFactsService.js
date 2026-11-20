const axios = require('axios');
const logger = require('../utils/logger');

const OPEN_FOOD_FACTS_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const TIMEOUT_MS = 4000;

/**
 * Fetches and standardizes product data from Open Food Facts API
 * @param {string} barcode 
 * @returns {Promise<object|null>} Standardized product object or null
 */
const fetchByBarcode = async (barcode) => {
  const sanitized = String(barcode).trim();
  if (!sanitized) return null;

  try {
    const url = `${OPEN_FOOD_FACTS_BASE}/${encodeURIComponent(sanitized)}.json`;
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'CoDesk-CatalogService/1.0 (support@codesk.cloud)'
      }
    });

    if (!response.data || response.data.status !== 1 || !response.data.product) {
      return null;
    }

    const raw = response.data.product;

    // Pick best available name
    const name = raw.product_name_en || raw.product_name || raw.generic_name_en || raw.generic_name;
    if (!name) {
      return null;
    }

    // Pick brand
    const brand = raw.brands ? raw.brands.split(',')[0].trim() : (raw.brand_owner || null);

    // Pick category
    let category = null;
    if (raw.categories_hierarchy && raw.categories_hierarchy.length > 0) {
      // Pick last or most specific category, strip "en:" prefix
      const lastCat = raw.categories_hierarchy[raw.categories_hierarchy.length - 1];
      category = lastCat.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
    } else if (raw.categories) {
      category = raw.categories.split(',')[0].trim();
    }

    // Capitalize category nicely
    if (category) {
      category = category.charAt(0).toUpperCase() + category.slice(1);
    }

    // Pick best unit / quantity
    const unit = raw.quantity || (raw.net_weight_value ? `${raw.net_weight_value}${raw.net_weight_unit || 'g'}` : null);

    // Pick best image
    const image_url = raw.image_front_url || raw.image_url || raw.image_small_url || null;

    return {
      barcode: sanitized,
      name: name.trim(),
      brand: brand ? brand.trim() : null,
      category: category ? category.trim() : 'General Retail',
      unit: unit ? unit.trim() : null,
      description: raw.generic_name || null,
      image_url: image_url,
      source: 'OPEN_FOOD_FACTS',
      verified_status: 'VERIFIED',
      metadata: {
        categories: raw.categories || null,
        ingredients: raw.ingredients_text || null,
        nutriscore: raw.nutriscore_grade || null
      }
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    logger.warn(`OpenFoodFacts lookup failed for ${sanitized}: ${error.message}`);
    return null;
  }
};

module.exports = {
  fetchByBarcode
};
