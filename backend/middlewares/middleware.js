const jwt = require('jsonwebtoken')
const Users = require('../models/user')
const AccessGroups = require('../models/accessGroup')
const Rights = require('../models/right')

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET)

const isActionValid = (object, action, rights) => {
  const respectiveRights = rights.filter(
    (i) => i.objectId.name.toString() === object.toString()
  )

  let isValid = true
  for (let i = 0; i < action.length; i++) {
    isValid = respectiveRights.some((item) => item[action[i]])
    if (!isValid) {
      break
    }
  }
  return isValid
}

const authenticate = async (req, res, next) => {
  try {
    const cookies = req.cookies
    const authCookie = cookies[process.env.COOKIE_NAME]

    if (!authCookie)
      return res.status(401).json({
        msg: 'Phiên làm việc đã kết thúc! Vui lòng đăng nhập lại',
        noCookies: true,
      })
    const payload = isTokenValid(authCookie)

    if (!payload)
      return res.status(401).json({
        msg: 'Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại',
        noCookies: false,
      })
    const user = await Users.findOne({ _id: payload.id })
    req.user = user
    return next()
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}
const checkRights = (object, action) => {
  return async function (req, res, next) {
    try {
      if (req.user.role === 'admin') {
        return next()
      }

      const belongingGroup = await AccessGroups.find({ userIds: req.user._id })

      const relatedRights = await Rights.find({
        accessGroupId: { $in: belongingGroup.map((i) => i._id) },
      }).populate('objectId', 'name')

      const isValid = isActionValid(object, action, relatedRights)

      if (!isValid) {
        return res
          .status(403)
          .json({ msg: 'Bạn không có quyền để thực hiện hành động này' })
      }

      return next()
    } catch (error) {
      return res.status(500).json({ msg: error.message })
    }
  }
}

module.exports = { authenticate, checkRights }
