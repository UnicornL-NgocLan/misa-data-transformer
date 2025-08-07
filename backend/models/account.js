const mongoose = require('mongoose')

const AccountSchema = mongoose.Schema(
  {
    code: String,
    type: String,
    activityGroup: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('Account', AccountSchema)
