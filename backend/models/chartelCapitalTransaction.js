const mongoose = require('mongoose')

const ChartelCapitalTransactionSchema = mongoose.Schema(
  {
    value: { type: Number, default: 0 },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
)

module.exports = mongoose.model(
  'ChartelCapitalTransaction',
  ChartelCapitalTransactionSchema
)
