const express = require('express')
const router = express.Router()
const rightCtrl = require('../controllers/right.js')
const { authenticate } = require('../middlewares/middleware.js')

router.post('/create-object', authenticate, rightCtrl.createObject)
router.post('/create-right', authenticate, rightCtrl.createRight)
router.post('/create-access-group', authenticate, rightCtrl.createAccessGroup)

router.patch('/update-right/:id', authenticate, rightCtrl.editRight)
router.patch(
  '/update-access-group/:id',
  authenticate,
  rightCtrl.editAccessGroup
)

router.get('/get-objects', authenticate, rightCtrl.getObjects)
router.get('/get-rights', authenticate, rightCtrl.getRights)
router.get('/get-access-groups', authenticate, rightCtrl.getAccessGroups)

router.delete('/delete-right/:id', authenticate, rightCtrl.deleteRight)
router.delete(
  '/delete-access-group/:id',
  authenticate,
  rightCtrl.deleteAccessGroup
)

module.exports = router
