const mongoose = require('mongoose')

const CompanySchema = mongoose.Schema(
  {
    name: String,
    chartelCapital: { type: Number, default: 0 },
    taxCode: String,
    attachmentUrl: String,
    shortname: String,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyType',
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Company', CompanySchema)
