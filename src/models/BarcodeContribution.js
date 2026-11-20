module.exports = (sequelize, DataTypes) => {
  const BarcodeContribution = sequelize.define('BarcodeContribution', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    barcode: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    submitted_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    submitted_brand: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    submitted_category: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    submitted_unit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    organization_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Originating ERP Tenant'
    },
    client_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'MERGED', 'REJECTED'),
      defaultValue: 'PENDING'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'barcode_contributions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['barcode'] },
      { fields: ['organization_id'] },
      { fields: ['status'] }
    ]
  });

  return BarcodeContribution;
};

