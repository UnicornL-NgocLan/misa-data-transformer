const express = require('express')
const router = express.Router()
const rightCtrl = require('../controllers/right.js')
const { authenticate, checkRights } = require('../middlewares/middleware.js')

router.post('/create-object', authenticate, rightCtrl.createObject)
router.post(
  '/create-right',
  authenticate,
  checkRights('accessGroup', ['create']),
  rightCtrl.createRight
)
router.post(
  '/create-access-group',
  authenticate,
  checkRights('accessGroup', ['create']),
  rightCtrl.createAccessGroup
)

router.patch(
  '/update-right/:id',
  authenticate,
  checkRights('accessGroup', ['write']),
  rightCtrl.editRight
)
router.patch(
  '/update-access-group/:id',
  authenticate,
  checkRights('accessGroup', ['write']),
  rightCtrl.editAccessGroup
)

router.get('/get-objects', authenticate, rightCtrl.getObjects)
router.get('/get-rights', authenticate, rightCtrl.getRights)
router.get('/get-access-groups', authenticate, rightCtrl.getAccessGroups)

router.delete(
  '/delete-right/:id',
  authenticate,
  checkRights('accessGroup', ['canDelete']),
  rightCtrl.deleteRight
)
router.delete(
  '/delete-access-group/:id',
  authenticate,
  checkRights('accessGroup', ['canDelete']),
  rightCtrl.deleteAccessGroup
)

module.exports = router
