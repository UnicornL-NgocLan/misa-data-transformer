const mongoose = require('mongoose')

const MoneyFlowReasonSchema = mongoose.Schema(
  {
    name: String,
    type: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('MoneyFlowReason', MoneyFlowReasonSchema)
