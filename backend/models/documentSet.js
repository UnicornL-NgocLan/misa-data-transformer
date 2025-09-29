const mongoose = require('mongoose')

const DocumentSetSchema = mongoose.Schema(
  {
    name: String,
    description: String,
    created_by: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    company_id: {
      type: mongoose.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    is_locked: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('DocumentSet', DocumentSetSchema)
