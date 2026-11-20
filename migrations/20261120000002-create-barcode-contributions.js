'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('barcode_contributions', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      barcode: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      submitted_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      submitted_brand: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      submitted_category: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      submitted_unit: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      organization_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Originating ERP Tenant'
      },
      client_ip: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'MERGED', 'REJECTED'),
        defaultValue: 'PENDING',
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
    await queryInterface.addIndex('barcode_contributions', ['barcode'], {
      name: 'idx_contributions_barcode'
    });
    await queryInterface.addIndex('barcode_contributions', ['organization_id'], {
      name: 'idx_contributions_org_id'
    });
    await queryInterface.addIndex('barcode_contributions', ['status'], {
      name: 'idx_contributions_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('barcode_contributions');
  }
};

