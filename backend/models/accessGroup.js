const mongoose = require('mongoose')

const AccessGroupSchema = mongoose.Schema(
  {
    name: String,
    description: String,
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
