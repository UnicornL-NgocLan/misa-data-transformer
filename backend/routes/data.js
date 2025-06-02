const express = require('express')
const router = express.Router()
const dataCtrl = require('../controllers/data.js')
const { authenticate } = require('../middlewares/middleware.js')

router.post('/create-company', authenticate, dataCtrl.createCompany)
router.post('/create-bank', authenticate, dataCtrl.createBank)
router.post(
  '/create-bank-account',

  authenticate,
  dataCtrl.createBankAccount
)
router.post(
  '/create-indenture',

  authenticate,
  dataCtrl.createIndenture
)
router.post(
  '/create-payment-plan',

  authenticate,
  dataCtrl.createPaymentPlan
)
router.post('/create-source', authenticate, dataCtrl.createSource)

router.patch('/update-bank/:id', authenticate, dataCtrl.updateBank)
router.patch(
  '/update-bank-account/:id',

  authenticate,
  dataCtrl.updateBankAccount
)
router.patch(
  '/update-indenture/:id',

  authenticate,
  dataCtrl.updateIndenture
)
router.patch(
  '/update-payment-plan/:id',

  authenticate,
  dataCtrl.updatePaymentPlan
)
router.patch('/update-source/:id', authenticate, dataCtrl.updateSource)

router.get('/get-companies', authenticate, dataCtrl.getCompanies)
router.get('/get-banks', authenticate, dataCtrl.getBanks)
router.get(
  '/get-bank-accounts',

  authenticate,
  dataCtrl.getBankAccounts
)
router.get('/get-indentures', authenticate, dataCtrl.getIndentures)
router.get(
  '/get-payment-plans',

  authenticate,
  dataCtrl.getPaymentPlans
)
router.get('/get-sources', authenticate, dataCtrl.getSources)

router.delete(
  '/delete-source/:id',

  authenticate,
  dataCtrl.deleteSource
)
router.delete(
  '/delete-payment-plan/:id',

  authenticate,
  dataCtrl.deletePaymentPlan
)

module.exports = router
