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
router.post(
  '/create-inter-company-finance',
  authenticate,
  checkRights('interCompanyFinance', ['create']),
  dataCtrl.createInterCompanyFinance
)
router.post(
  '/create-company-type',
  authenticate,
  checkRights('companyType', ['create']),
  dataCtrl.createCompanyType
)
router.post(
  '/create-chartel-capital-transaction',
  authenticate,
  checkRights('company', ['write']),
  dataCtrl.createChartelCapitalTransaction
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
router.patch(
  '/update-inter-company-finance/:id',
  authenticate,
  checkRights('interCompanyFinance', ['write']),
  dataCtrl.updateInterCompanyFinance
)
router.patch(
  '/update-company/:id',
  authenticate,
  checkRights('company', ['write']),
  dataCtrl.updateCompany
)
router.patch(
  '/update-company-type/:id',
  authenticate,
  checkRights('companyType', ['write']),
  dataCtrl.updateCompanyType
)
router.patch(
  '/update-chartel-capital-transaction/:id',
  authenticate,
  checkRights('company', ['write']),
  dataCtrl.updateChartelCapitalTransaction
)

router.get('/get-companies', authenticate, dataCtrl.getCompanies)
router.get('/get-banks', authenticate, dataCtrl.getBanks)
router.get('/get-bank-accounts', authenticate, dataCtrl.getBankAccounts)
router.get('/get-indentures', authenticate, dataCtrl.getIndentures)
router.get('/get-payment-plans', authenticate, dataCtrl.getPaymentPlans)
router.get('/get-sources', authenticate, dataCtrl.getSources)
router.get('/get-loan-contracts', authenticate, dataCtrl.getLoanContract)
router.get(
  '/get-inter-company-finances',
  authenticate,
  dataCtrl.getInterCompanyFinance
)
router.get('/get-company-types', authenticate, dataCtrl.getCompanyTypes)
router.get(
  '/get-chartel-capital-transactions',
  authenticate,
  dataCtrl.getChartelCaptitalTransaction
)

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
router.delete(
  '/delete-inter-company-finance/:id',
  authenticate,
  checkRights('interCompanyFinance', ['canDelete']),
  dataCtrl.deleteInterCompanyFinance
)
router.delete(
  '/delete-company-type/:id',
  authenticate,
  checkRights('companyType', ['canDelete']),
  dataCtrl.deleteCompanyType
)

router.delete(
  '/delete-chartel-capital-transaction/:id',
  authenticate,
  checkRights('company', ['write']),
  dataCtrl.deleteChartelCapitalTransaction
)

module.exports = router
