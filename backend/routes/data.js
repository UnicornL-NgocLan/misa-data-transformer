const express = require('express')
const router = express.Router()
const dataCtrl = require('../controllers/data.js')
const { authenticate, checkRights } = require('../middlewares/middleware.js')

router.post(
  '/create-company',
  authenticate,
  checkRights('company', ['create']),
  dataCtrl.createCompany
)
router.post(
  '/create-bank',
  authenticate,
  checkRights('bank', ['create']),
  dataCtrl.createBank
)
router.post(
  '/create-bank-account',
  authenticate,
  checkRights('bankAccount', ['create']),
  dataCtrl.createBankAccount
)
router.post(
  '/create-indenture',
  authenticate,
  checkRights('indenture', ['create']),
  dataCtrl.createIndenture
)
router.post(
  '/create-payment-plan',
  authenticate,
  checkRights('paymentPlan', ['create']),
  dataCtrl.createPaymentPlan
)
router.post(
  '/create-source',
  authenticate,
  checkRights('source', ['create']),
  dataCtrl.createSource
)
router.post(
  '/create-loan-contract',
  authenticate,
  checkRights('loanContract', ['create']),
  dataCtrl.createLoanContract
)

router.patch(
  '/update-bank/:id',
  authenticate,
  checkRights('bank', ['write']),
  dataCtrl.updateBank
)
router.patch(
  '/update-bank-account/:id',
  authenticate,
  checkRights('bankAccount', ['write']),
  dataCtrl.updateBankAccount
)
router.patch(
  '/update-indenture/:id',
  authenticate,
  checkRights('indenture', ['write']),
  dataCtrl.updateIndenture
)
router.patch(
  '/update-payment-plan/:id',
  authenticate,
  checkRights('paymentPlan', ['write']),
  dataCtrl.updatePaymentPlan
)
router.patch(
  '/update-source/:id',
  authenticate,
  checkRights('source', ['write']),
  dataCtrl.updateSource
)
router.patch(
  '/update-loan-contract/:id',
  authenticate,
  checkRights('loanContract', ['write']),
  dataCtrl.updateLoanContract
)

router.get('/get-companies', authenticate, dataCtrl.getCompanies)
router.get('/get-banks', authenticate, dataCtrl.getBanks)
router.get('/get-bank-accounts', authenticate, dataCtrl.getBankAccounts)
router.get('/get-indentures', authenticate, dataCtrl.getIndentures)
router.get('/get-payment-plans', authenticate, dataCtrl.getPaymentPlans)
router.get('/get-sources', authenticate, dataCtrl.getSources)
router.get('/get-loan-contracts', authenticate, dataCtrl.getLoanContract)

router.delete(
  '/delete-source/:id',
  authenticate,
  checkRights('source', ['canDelete']),
  dataCtrl.deleteSource
)
router.delete(
  '/delete-payment-plan/:id',
  authenticate,
  checkRights('paymentPlan', ['canDelete']),
  dataCtrl.deletePaymentPlan
)
router.delete(
  '/delete-loan-contract/:id',
  authenticate,
  checkRights('loanContract', ['canDelete']),
  dataCtrl.deleteLoanContract
)

module.exports = router
