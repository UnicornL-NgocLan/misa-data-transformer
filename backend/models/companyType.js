const mongoose = require('mongoose')

const CompanyTypeSchema = mongoose.Schema(
  {
    name: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('CompanyType', CompanyTypeSchema)
