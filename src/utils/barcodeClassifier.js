/**
 * GS1 Barcode Classifier & Validator
 * 
 * Protects the Central Master Catalog from in-store custom SKUs, 
 * weighing scale barcodes (variable-measure sugar/meat/produce),
 * and corrupted or fake scans.
 */

/**
 * Validates the GS1 Modulo-10 check digit for standard GTINs (EAN-8, UPC-A, EAN-13, GTIN-14).
 * @param {string} barcode 
 * @returns {boolean}
 */
const isValidGS1Checksum = (barcode) => {
  if (!/^\d+$/.test(barcode)) return false;
  const len = barcode.length;
  if (![8, 12, 13, 14].includes(len)) return false;

  let sum = 0;
  const checkDigit = parseInt(barcode[len - 1], 10);

  // Moving right to left from the penultimate digit:
  // Alternating weights: 3, 1, 3, 1...
  let weight = 3;
  for (let i = len - 2; i >= 0; i--) {
    sum += parseInt(barcode[i], 10) * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
};

/**
 * Classifies a barcode into Global GTIN, Weighing Scale, In-store internal, or Custom SKU.
 * @param {string} rawBarcode 
 * @returns {object} Classification result
 */
const classifyBarcode = (rawBarcode) => {
  const barcode = String(rawBarcode || '').trim();

  // 1. Empty or missing
  if (!barcode) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'EMPTY',
      reason: 'Barcode cannot be empty.'
    };
  }

  // 2. Alphanumeric / Custom formatted store SKUs (e.g. SUGAR-1KG, LOC-102, #991)
  if (!/^\d+$/.test(barcode)) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'CUSTOM_ALPHANUMERIC_SKU',
      reason: 'Contains non-numeric characters. Store-local custom SKU only.'
    };
  }

  // 3. Short codes (e.g. 101, 1002, 99999) - less than 8 digits
  if (barcode.length < 8) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'SHORT_INTERNAL_SKU',
      reason: 'Barcode is shorter than 8 digits. Store-local short code only.'
    };
  }

  // 4. GS1 Restricted Circulation Numbers (RCN) - Variable Measure / Weighing Scale
  // Prefixes 20 through 29 are globally reserved by GS1 for in-store use (meat, vegetables, sugar, deli).
  const prefix2 = barcode.substring(0, 2);
  const prefix3 = barcode.substring(0, 3);

  if (['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'].includes(prefix2)) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'IN_STORE_WEIGHTED',
      reason: `GS1 Restricted Circulation prefix (${prefix2}). In-store weighing scale or variable price barcode. Store-local only.`,
      details: {
        prefix: prefix2,
        is_variable_measure: true
      }
    };
  }

  // Prefix 02 is reserved for in-store prepackaged items with variable measure
  if (prefix2 === '02') {
    return {
      is_eligible_for_master: false,
      barcode_type: 'IN_STORE_VARIABLE',
      reason: 'GS1 Prefix 02 reserved for in-store variable weight items. Store-local only.',
      details: {
        prefix: '02',
        is_variable_measure: true
      }
    };
  }

  // Prefix 04 is reserved for store internal UPC
  if (prefix2 === '04' && barcode.length === 12) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'IN_STORE_UPC',
      reason: 'UPC Prefix 04 reserved for store-internal packaging. Store-local only.',
      details: {
        prefix: '04'
      }
    };
  }

  // Prefixes 98 and 99 are reserved for coupons, refund receipts, and vouchers
  if (['98', '99'].includes(prefix2)) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'COUPON_OR_VOUCHER',
      reason: `GS1 Prefix ${prefix2} is reserved for coupons, refund vouchers, or loyalty tokens.`
    };
  }

  // 5. Standard GS1 Barcode Length Validation (8, 12, 13, 14 digits)
  if (![8, 12, 13, 14].includes(barcode.length)) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'NON_STANDARD_LENGTH',
      reason: `Barcode length (${barcode.length}) is not a standard GS1 format (8, 12, 13, or 14 digits).`
    };
  }

  // 6. GS1 Modulo-10 Checksum Validation
  if (!isValidGS1Checksum(barcode)) {
    return {
      is_eligible_for_master: false,
      barcode_type: 'INVALID_CHECKSUM',
      reason: 'Barcode failed the GS1 Modulo-10 checksum validation (corrupted or fake barcode).'
    };
  }

  // 7. Verified Official Global GTIN
  let format = 'GTIN_13';
  if (barcode.length === 8) format = 'EAN_8';
  else if (barcode.length === 12) format = 'UPC_A';
  else if (barcode.length === 14) format = 'GTIN_14';

  return {
    is_eligible_for_master: true,
    barcode_type: format,
    reason: 'Valid standard GS1 manufacturer barcode.'
  };
};

module.exports = {
  classifyBarcode,
  isValidGS1Checksum
};

