const mongoose = require('mongoose')

const AccessGroupSchema = mongoose.Schema(
  {
    name: String,
    description: String,
    companyIds: [{ type: mongoose.Types.ObjectId, ref: 'Company' }],
    userIds: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model('AccessGroup', AccessGroupSchema)
