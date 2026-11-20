module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define('ApiKey', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    key_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    key_prefix: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'CLIENT', 'READ_ONLY'),
      defaultValue: 'CLIENT'
    },
    rate_limit_rpm: {
      type: DataTypes.INTEGER,
      defaultValue: 120
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'api_keys',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['key_hash'] }
    ]
  });

  return ApiKey;
};

