const mongoose = require('mongoose')

const RightSchema = mongoose.Schema(
  {
    objectId: {
      type: mongoose.Types.ObjectId,
      ref: 'Object',
      required: true,
    },
    accessGroupId: {
      type: mongoose.Types.ObjectId,
      ref: 'AccessGroup',
      required: true,
    },
    read: { type: Boolean },
    write: { type: Boolean },
    canDelete: { type: Boolean },
    create: { type: Boolean },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Right', RightSchema)
