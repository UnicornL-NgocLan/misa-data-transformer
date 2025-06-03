const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/auth.js')
const { authenticate, checkRights } = require('../middlewares/middleware.js')

router.get('/check-auth', authenticate, userCtrl.checkAuth)
router.post(
  '/create-user',
  authenticate,
  checkRights('user', ['create']),
  userCtrl.createUser
)
router.post('/login', userCtrl.login)
router.delete('/log-out', userCtrl.logout)
router.patch('/change-password', authenticate, userCtrl.changePassword)
router.get('/get-users', authenticate, userCtrl.getUsers)
router.patch(
  '/update-user/:id',
  authenticate,
  checkRights('user', ['write']),
  userCtrl.updateUser
)

module.exports = router
