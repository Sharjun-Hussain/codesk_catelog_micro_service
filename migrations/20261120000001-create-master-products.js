'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('master_products', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      barcode: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      brand: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'e.g. 100g, 500ml, 1 pcs'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(1024),
        allowNull: true
      },
      mrp: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Manufacturer suggested retail price if applicable'
      },
      hsn_code: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      source: {
        type: Sequelize.ENUM('OFFICIAL', 'OPEN_FOOD_FACTS', 'CROWDSOURCED', 'MANUAL_IMPORT'),
        defaultValue: 'CROWDSOURCED',
        allowNull: false
      },
      verified_status: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
        defaultValue: 'VERIFIED',
        allowNull: false
      },
      lookup_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('master_products', ['barcode'], {
      unique: true,
      name: 'idx_master_products_barcode'
    });
    await queryInterface.addIndex('master_products', ['name'], {
      name: 'idx_master_products_name'
    });
    await queryInterface.addIndex('master_products', ['brand'], {
      name: 'idx_master_products_brand'
    });
    await queryInterface.addIndex('master_products', ['category'], {
      name: 'idx_master_products_category'
    });
    await queryInterface.addIndex('master_products', ['verified_status'], {
      name: 'idx_master_products_verified_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('master_products');
  }
};

