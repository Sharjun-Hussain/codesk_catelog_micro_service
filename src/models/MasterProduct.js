module.exports = (sequelize, DataTypes) => {
  const MasterProduct = sequelize.define('MasterProduct', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    barcode: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    brand: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'e.g. 100g, 500ml, 1 pcs'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    mrp: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Manufacturer suggested retail price if applicable'
    },
    hsn_code: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    source: {
      type: DataTypes.ENUM('OFFICIAL', 'OPEN_FOOD_FACTS', 'CROWDSOURCED', 'MANUAL_IMPORT'),
      defaultValue: 'CROWDSOURCED'
    },
    verified_status: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
      defaultValue: 'VERIFIED'
    },
    lookup_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'master_products',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['barcode'] },
      { fields: ['name'] },
      { fields: ['brand'] },
      { fields: ['category'] },
      { fields: ['verified_status'] }
    ]
  });

  return MasterProduct;
};

