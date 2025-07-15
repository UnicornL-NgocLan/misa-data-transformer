const mongoose = require('mongoose')

const InterCompanyFinanceSchema = mongoose.Schema(
  {
    subjectCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    counterpartCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
    },
    activityGroup: {
      type: String,
    },
    value: {
      type: Number,
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model(
  'interCompanyFinance',
  InterCompanyFinanceSchema
)
