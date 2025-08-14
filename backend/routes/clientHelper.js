const express = require('express')
const router = express.Router()
const clientHelperCtrl = require('../controllers/clientHelper.js')

router.post('/process-tree-view-debt', clientHelperCtrl.processTreeViewDebtData)

module.exports = router
