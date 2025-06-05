const mongoose = require('mongoose')

const LoanContractSchema = mongoose.Schema(
  {
    name: String,
    bankId: { type: mongoose.Types.ObjectId, ref: 'Bank', required: true },
    companyId: {
      type: mongoose.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    value: Number,
    date: Date,
    dueDate: Date,
    state: String,
    currency: String,
    exchangeRate: Number,
    conversedValue: Number,
  },
  { timestamps: true }
)

module.exports = mongoose.model('LoanContract', LoanContractSchema)
