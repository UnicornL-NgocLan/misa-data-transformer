const express = require('express')
const router = express.Router()
const clientHelperCtrl = require('../controllers/clientHelper.js')
const { authenticate, checkRights } = require('../middlewares/middleware.js')

router.post('/process-tree-view-debt', clientHelperCtrl.processTreeViewDebtData)
router.get(
  '/get-chartel-captial-proportion-link',
  authenticate,
  checkRights('chartelCapital', ['read']),
  clientHelperCtrl.getMetabaseLinkChartelCaptialProportion
)

module.exports = router
