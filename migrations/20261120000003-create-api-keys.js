'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('api_keys', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      key_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      key_prefix: {
        type: Sequelize.STRING(16),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('ADMIN', 'CLIENT', 'READ_ONLY'),
        defaultValue: 'CLIENT',
        allowNull: false
      },
      rate_limit_rpm: {
        type: Sequelize.INTEGER,
        defaultValue: 120,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      last_used_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('api_keys', ['key_hash'], {
      unique: true,
      name: 'idx_api_keys_key_hash'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('api_keys');
  }
};

