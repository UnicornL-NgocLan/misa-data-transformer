const mongoose = require('mongoose')

const SequenceSchema = mongoose.Schema(
  {
    name: String,
    current_number: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Sequence', SequenceSchema)
