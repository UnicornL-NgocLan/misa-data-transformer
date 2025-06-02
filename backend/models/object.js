const mongoose = require('mongoose')

const ObjectSchema = mongoose.Schema(
  {
    name: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('Object', ObjectSchema)
