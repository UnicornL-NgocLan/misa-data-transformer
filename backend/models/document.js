const mongoose = require('mongoose')

const DocumentSchema = mongoose.Schema(
  {
    invoice_number: String,
    invoice_date: Date,
    tax_code: String,
    set_id: { type: mongoose.Types.ObjectId, ref: 'DocumentSet' },
    file: { type: Buffer, required: true },
    type: String,
    name: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('Document', DocumentSchema)
