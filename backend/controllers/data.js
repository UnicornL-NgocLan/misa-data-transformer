const Companies = require('../models/company')
const Banks = require('../models/bank')
const BankAccounts = require('../models/bankAccount')
const Indentures = require('../models/indenture')
const PaymentPlans = require('../models/paymentPlan')
const Sources = require('../models/source')
const LoanContracts = require('../models/loanContract')
const InterCompanyFinances = require('../models/interCompanyFinance')
const CompanyTypes = require('../models/companyType')
const ChartelCapitalTransactions = require('../models/chartelCapitalTransaction')
const Accounts = require('../models/account')
const MoneyFlowReasons = require('../models/moneyFlowReason')
const DocumentSets = require('../models/documentSet')
const Documents = require('../models/document')
const Sequences = require('../models/sequence')
const moment = require('moment-timezone')

const dataCtrl = {
  createCompany: async (req, res) => {
    try {
      const {
        name,
        chartelCapital,
        taxCode,
        attachmentUrl,
        parentId,
        companyType,
        shortname,
      } = req.body
      if (!name.trim())
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
      const existingCompany = await Companies.findOne({ name })
      if (existingCompany)
        return res.status(400).json({ msg: 'Công ty đã tồn tại' })

      await Companies.create({
        name,
        chartelCapital: chartelCapital || 0,
        taxCode: taxCode || '',
        attachmentUrl: attachmentUrl || '',
        parentId,
        companyType,
        shortname,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất công ty' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createCompanyType: async (req, res) => {
    try {
      const { name } = req.body
      if (!name.trim())
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
      const existingRecord = await CompanyTypes.findOne({ name })
      if (existingRecord)
        return res.status(400).json({ msg: 'Loại công ty đã tồn tại' })

      await CompanyTypes.create({
        name,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất loại công ty' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getCompanies: async (req, res) => {
    try {
      const companies = await Companies.find({}).populate(
        'companyType parentId'
      )
      res.status(200).json({ data: companies })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getCompanyTypes: async (req, res) => {
    try {
      const companyTypes = await CompanyTypes.find({}).select('name')
      res.status(200).json({ data: companyTypes })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateCompanyType: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      const newOne = await CompanyTypes.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Loại công ty không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteCompanyType: async (req, res) => {
    try {
      const { id } = req.params
      await CompanyTypes.findOneAndDelete({ _id: id })
      await Companies.updateMany(
        {
          companyType: id,
        },
        {
          companyType: undefined,
        }
      )
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createBank: async (req, res) => {
    try {
      const { name } = req.body
      if (!name.trim())
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
      const existingRecord = await Banks.findOne({ name })
      if (existingRecord)
        return res.status(400).json({ msg: 'Ngân hàng đã tồn tại' })

      await Banks.create({
        name,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất ngân hàng' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createIndenture: async (req, res) => {
    try {
      const {
        number,
        bankId,
        amount,
        date,
        dueDate,
        interestRate,
        interestAmount,
        residual,
        state,
        companyId,
        loanContractId,
        currency,
        exchangeRate,
      } = req.body
      if (
        !number.trim() ||
        !amount ||
        !date ||
        !dueDate ||
        !interestRate ||
        !residual ||
        !state.trim() ||
        !companyId.trim() ||
        !currency ||
        !exchangeRate
      )
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })

      await Indentures.create({
        number,
        bankId,
        amount,
        date,
        dueDate,
        interestRate,
        interestAmount,
        residual,
        state,
        companyId,
        loanContractId,
        currency,
        exchangeRate,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất ngân hàng' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateIndenture: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params

      const newOne = await Indentures.findOneAndUpdate(
        { _id: id, companyId: { $in: req.user.companyIds } },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Khế ước này không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getIndentures: async (req, res) => {
    try {
      const banks = await Indentures.find({
        companyId: { $in: req.user.companyIds },
      })
        .populate('bankId companyId', 'name')
        .populate('loanContractId', 'name companyId')
      res.status(200).json({ data: banks })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateBank: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      const newOne = await Banks.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Ngân hàng không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateCompany: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params

      const newOne = await Companies.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Công ty không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getBanks: async (req, res) => {
    try {
      const banks = await Banks.find({}).select('name active')
      res.status(200).json({ data: banks })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createBankAccount: async (req, res) => {
    try {
      const { accountNumber, bankId, companyId, currency } = req.body
      if (
        !accountNumber.trim() ||
        !bankId.trim() ||
        !companyId.trim() ||
        !currency.trim()
      )
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
      const existingRecord = await BankAccounts.findOne({ accountNumber })
      if (existingRecord)
        return res.status(400).json({ msg: 'Số tài khoản đã tồn tại' })

      await BankAccounts.create({ accountNumber, bankId, companyId, currency })

      res.status(200).json({ msg: 'Đã tạo hoàn tất số tài khoản' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getBankAccounts: async (req, res) => {
    try {
      const banks = await BankAccounts.find({
        companyId: { $in: req.user.companyIds },
      })
        .select('accountNumber bankId companyId active currency')
        .populate('bankId companyId')
      res.status(200).json({ data: banks })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateBankAccount: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      const newOne = await BankAccounts.findOneAndUpdate(
        { _id: id, companyId: { $in: req.user.companyIds } },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Số tài khoản không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createPaymentPlan: async (req, res) => {
    try {
      const {
        subject,
        content,
        amount,
        dueDate,
        companyId,
        document,
        total,
        exchangeRate,
        currency,
        note,
        conversedValue,
        type,
        documentLink,
        documentState,
        moneyFlowGroupId,
      } = req.body
      if (
        !subject.trim() ||
        !amount ||
        !dueDate ||
        !content.trim() ||
        !companyId.trim() ||
        !currency.trim() ||
        !type.trim() ||
        !documentState
      )
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })

      await PaymentPlans.create({
        companyId,
        subject,
        content,
        amount,
        dueDate,
        document,
        currency,
        exchangeRate,
        total,
        conversedValue,
        note,
        type,
        documentLink,
        documentState,
        moneyFlowGroupId,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất kế hoạch thanh toán' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updatePaymentPlan: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params

      const newOne = await PaymentPlans.findOneAndUpdate(
        { _id: id, companyId: { $in: req.user.companyIds } },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Kế hoạc thanh toán này không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deletePaymentPlan: async (req, res) => {
    try {
      const { id } = req.params
      await PaymentPlans.findOneAndDelete({ _id: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getPaymentPlans: async (req, res) => {
    try {
      const banks = await PaymentPlans.find({
        companyId: { $in: req.user.companyIds },
      }).populate('companyId moneyFlowGroupId', 'name')
      res.status(200).json({ data: banks })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createSource: async (req, res) => {
    try {
      const {
        companyId,
        name,
        type,
        bankAccountId,
        value,
        currency,
        moneyFlowGroupId,
      } = req.body
      if (
        !type ||
        !companyId ||
        !name ||
        !currency ||
        (type === 'bank' && !bankAccountId) ||
        !value
      )
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })

      await Sources.create({
        companyId,
        name,
        type,
        bankAccountId,
        value,
        currency,
        updatedBy: req.user._id,
        moneyFlowGroupId,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất nguồn' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateSource: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params

      const newOne = await Sources.findOneAndUpdate(
        { _id: id, companyId: { $in: req.user.companyIds } },
        { ...parameters, updatedBy: req.user._id },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Nguồn này không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteSource: async (req, res) => {
    try {
      const { id } = req.params
      await Sources.findOneAndDelete({ _id: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getSources: async (req, res) => {
    try {
      const list = await Sources.find({
        companyId: { $in: req.user.companyIds },
      })
        .select(
          'companyId name type bankAccountId value updatedBy currency updatedAt'
        )
        .populate('companyId updatedBy moneyFlowGroupId', 'name')
      res.status(200).json({ data: list })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createLoanContract: async (req, res) => {
    try {
      const {
        name,
        value,
        bankId,
        companyId,
        date,
        dueDate,
        state,
        currency,
        exchangeRate,
        conversedValue,
      } = req.body
      if (
        !name ||
        !value ||
        !bankId ||
        !companyId ||
        !date ||
        !state ||
        !currency
      )
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ thông tin' })
      await LoanContracts.create({
        name,
        value,
        bankId,
        companyId,
        date,
        dueDate,
        state,
        currency,
        exchangeRate,
        conversedValue,
      })
      res.status(200).json({ msg: 'Đã tạo thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getLoanContract: async (req, res) => {
    try {
      const loanContracts = await LoanContracts.find({
        companyId: { $in: req.user.companyIds },
      }).populate('companyId bankId', 'name')
      res.status(200).json({ data: loanContracts })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateLoanContract: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      const newOne = await LoanContracts.findOneAndUpdate(
        { _id: id, companyId: { $in: req.user.companyIds } },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Hợp đồng vay này không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteLoanContract: async (req, res) => {
    try {
      const { id } = req.params
      await LoanContracts.findOneAndDelete({
        _id: id,
        companyId: { $in: req.user.companyIds },
      })
      await Indentures.updateMany(
        {
          loanContractId: id,
        },
        {
          loanContractId: undefined,
        }
      )
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createInterCompanyFinance: async (req, res) => {
    try {
      const {
        subjectCompanyId,
        counterpartCompanyId,
        debit,
        credit,
        type,
        activityGroup,
        accountId,
        date,
      } = req.body
      if (!subjectCompanyId || !type || !activityGroup || !date || !accountId)
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
      if (!counterpartCompanyId)
        return res
          .status(400)
          .json({ msg: 'Công ty đối tác không có trong hệ thống' })
      if (subjectCompanyId === counterpartCompanyId)
        return res
          .status(400)
          .json({ msg: 'Công ty chủ thể và đối tác không thể trùng nhau' })
      const list = await InterCompanyFinances.find({
        subjectCompanyId,
        counterpartCompanyId,
        type,
        activityGroup,
        accountId,
      })

      if (req.user.companyIds.indexOf(subjectCompanyId) === -1)
        return res
          .status(400)
          .json({ msg: 'Bạn không có quyền ghi nhận công nợ cho công ty này' })

      const existingRecord =
        list.length > 0
          ? list?.some((item) => {
              const dateCreated = moment(item.date)
                .tz('Asia/Bangkok')
                .format('YYYY-MM-DD')
              const dateInput = moment(date)
                .tz('Asia/Bangkok')
                .format('YYYY-MM-DD')
              if (dateCreated === dateInput) {
                return true
              }
            })
          : false

      if (existingRecord)
        return res.status(400).json({
          msg: 'Đã có tồn tại dữ liệu ghi nhận công nợ liên quan 2 công ty đó và loại, nhóm hoạt động, ngày, tài khoản',
        })

      const existingAccount = await Accounts.findOne({ _id: accountId })
      if (!existingAccount)
        return res
          .status(400)
          .json({ msg: 'Tài khoản kế toán không tồn tại trong hệ thống!' })

      await InterCompanyFinances.create({
        subjectCompanyId,
        counterpartCompanyId,
        type,
        activityGroup,
        debit,
        credit,
        accountId,
        date,
        lastUpdatedBy: req.user._id,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất giao dịch liên công ty' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateInterCompanyFinance: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })

      if (req.user.companyIds.indexOf(parameters.subjectCompanyId) === -1)
        return res
          .status(400)
          .json({ msg: 'Bạn không có quyền cập nhật công nợ cho công ty này' })

      const list = await InterCompanyFinances.find({
        subjectCompanyId: parameters.subjectCompanyId,
        counterpartCompanyId: parameters.counterpartCompanyId,
        type: parameters.type,
        accountId: parameters.accountId,
        activityGroup: parameters.activityGroup,
      })

      const existingRecord =
        list.length > 0
          ? list?.some((item) => {
              const dateCreated = moment(item.date)
                .tz('Asia/Bangkok')
                .format('YYYY-MM-DD')
              const dateInput = moment(parameters.date)
                .tz('Asia/Bangkok')
                .format('YYYY-MM-DD')
              if (
                dateCreated === dateInput &&
                item._id.toString() !== id?.toString()
              ) {
                return true
              }
            })
          : false

      if (existingRecord)
        return res.status(400).json({
          msg: 'Đã có tồn tại dữ liệu ghi nhận công nợ liên quan 2 công ty đó và loại, nhóm hoạt động, ngày, tài khoản',
        })

      const newOne = await InterCompanyFinances.findOneAndUpdate(
        { _id: id },
        { ...parameters, lastUpdatedBy: req.user._id },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Giao dịch liên công ty không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getInterCompanyFinance: async (req, res) => {
    try {
      const interCompanyFinances = await InterCompanyFinances.find({
        $or: [
          { subjectCompanyId: { $in: req.user.companyIds } },
          { counterpartCompanyId: { $in: req.user.companyIds } },
        ],
      })
        .populate('lastUpdatedBy', 'name')
        .populate(
          'counterpartCompanyId subjectCompanyId',
          'name shortname taxCode'
        )
        .populate('accountId')
      res.status(200).json({ data: interCompanyFinances })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteInterCompanyFinance: async (req, res) => {
    try {
      const { id } = req.params
      await InterCompanyFinances.findOneAndDelete({ _id: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createChartelCapitalTransaction: async (req, res) => {
    try {
      const { value, company_id, partner_id, realValue } = req.body
      if (!value || !company_id || !partner_id || !realValue)
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ thông tin' })
      const existingCurrentCompany = await Companies.find({ _id: company_id })
      if (!existingCurrentCompany)
        return res
          .status(400)
          .json({ msg: 'Công ty nhận vốn không có trong hệ thống!' })
      const existingPartnerCompany = await Companies.find({ _id: partner_id })
      if (!existingPartnerCompany)
        return res
          .status(400)
          .json({ msg: 'Công ty góp vốn không có trong hệ thống' })

      const existingRecord = await ChartelCapitalTransactions.findOne({
        company_id: company_id,
        partner_id: partner_id,
      })

      if (existingRecord)
        return res.status(400).json({
          msg: 'Đã có tồn tại dữ liệu ghi nhận vốn góp liên quan 2 công ty trên',
        })

      await ChartelCapitalTransactions.create({
        value,
        company_id,
        partner_id,
        realValue,
      })
      res.status(200).json({ msg: 'Đã tạo thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateChartelCapitalTransaction: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      if (req.user.companyIds.indexOf(parameters.company_id) === -1)
        return res.status(400).json({
          msg: 'Bạn không có quyền cập nhật vốn điều lệ cho công ty này',
        })
      const newOne = await ChartelCapitalTransactions.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Vốn góp công ty không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteChartelCapitalTransaction: async (req, res) => {
    try {
      const { id } = req.params
      await ChartelCapitalTransactions.findOneAndDelete({ _id: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getChartelCaptitalTransaction: async (req, res) => {
    try {
      const chartelCapitalTransactions = await ChartelCapitalTransactions.find({
        $or: [
          { company_id: { $in: req.user.companyIds } },
          { partner_id: { $in: req.user.companyIds } },
        ],
      }).populate('company_id partner_id', 'name shortname')
      res.status(200).json({ data: chartelCapitalTransactions })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createAccount: async (req, res) => {
    try {
      const { code, type, activityGroup } = req.body
      if (!code || !type || !activityGroup)
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
      const existingCode = await Accounts.findOne({ code })
      if (existingCode)
        return res.status(400).json({ msg: 'Tài khoản này đã tồn tại rồi!' })
      await Accounts.create({
        code,
        type,
        activityGroup,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất tài khoản' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateAccount: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })

      const existingRecord = await Accounts.findOne({
        _id: { $ne: id },
        code: parameters.code,
      })

      if (existingRecord)
        return res
          .status(400)
          .json({ msg: 'Đã tồn tại tài khoản với mã được cập nhật' })

      const newOne = await Accounts.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Tài khoản được cập nhật không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const { id } = req.params
      const existingRecord = await InterCompanyFinances.findOne({
        accountId: id,
      })
      if (existingRecord)
        return res.status(400).json({
          msg: 'Có ít nhất 1 chi tiết công nợ liên quan đến tài khoản này, vui lòng qua danh mục hệ thống công nợ để kiểm tra',
        })
      await Accounts.findOneAndDelete({ _id: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getAccounts: async (req, res) => {
    try {
      const accounts = await Accounts.find({})
      res.status(200).json({ data: accounts })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createMoneyFlowReason: async (req, res) => {
    try {
      const { name, type } = req.body
      if (!name || !type)
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })
      const existingRecord = await MoneyFlowReasons.findOne({ name, type })
      if (existingRecord)
        return res.status(400).json({ msg: 'Nhóm dòng tiền đã tồn tại' })

      await MoneyFlowReasons.create({
        name,
        type,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất nhóm dòng tiền' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getMoneyFlowReasons: async (req, res) => {
    try {
      const moneyFlowGroups = await MoneyFlowReasons.find({}).select(
        'name type'
      )
      res.status(200).json({ data: moneyFlowGroups })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateMoneyFlowReason: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      const existingRecord = await MoneyFlowReasons.findOne({
        _id: { $ne: id },
        name: parameters.name,
      })

      if (existingRecord)
        return res
          .status(400)
          .json({ msg: 'Đã tồn tại nhóm dòng tiền với tên được cập nhật' })

      const newOne = await MoneyFlowReasons.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Nhóm dòng tiền không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteMoneyFlowReason: async (req, res) => {
    try {
      const { id } = req.params
      await MoneyFlowReasons.findOneAndDelete({ _id: id })

      await Sources.updateMany(
        {
          moneyFlowGroupId: id,
        },
        {
          moneyFlowGroupId: undefined,
        }
      )

      await PaymentPlans.updateMany(
        {
          moneyFlowGroupId: id,
        },
        {
          moneyFlowGroupId: undefined,
        }
      )
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  createDocumentSet: async (req, res) => {
    try {
      const { description, company_id, type } = req.body

      if (!company_id)
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })

      if (!type)
        return res.status(400).json({ msg: 'Vui lòng chọn loại bộ tài liệu' })

      const existingSequence = await Sequences.findOne({
        name: 'document_set',
      })

      let mySequence = 1
      let currentDate = moment().add(7, 'hours')
      let year = currentDate.format('YY') // lấy 2 chữ số cuối của năm
      let month = currentDate.format('MM')

      if (!existingSequence) {
        mySequence = await Sequences.create({
          name: 'document_set',
          current_number: 1,
        })
      } else {
        mySequence = existingSequence.current_number + 1
        await Sequences.findOneAndUpdate(
          { _id: existingSequence._id },
          { current_number: mySequence }
        )
      }
      const newDocumentSet = await DocumentSets.create({
        name: `${year}${month}${mySequence.toString().padStart(5, '0')}`,
        description,
        company_id,
        type,
        created_by: req.user._id,
        updated_by: req.user._id,
      })

      res
        .status(200)
        .json({ msg: 'Đã tạo hoàn tất bộ tài liệu', data: newDocumentSet })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateDocumentSet: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params

      const existingRecord = await DocumentSets.findOne({
        _id: id,
      })

      if (!existingRecord)
        return res.status(400).json({ msg: 'Không tìm thấy bộ tài liệu này' })
      if (existingRecord?.is_locked)
        return res
          .status(400)
          .json({ msg: 'Bộ tài liệu đã được khóa, không thể chỉnh sửa' })

      const newOne = await DocumentSets.findOneAndUpdate(
        { _id: id },
        { ...parameters, updated_by: req.user._id },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Bộ tài liệu không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công', data: newOne })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getDocumentSets: async (req, res) => {
    try {
      const documentSets = await DocumentSets.find({}).populate(
        'created_by company_id'
      )
      res.status(200).json({ data: documentSets })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteDocumentSet: async (req, res) => {
    try {
      const { id } = req.params
      const existingRecord = await DocumentSets.findOne({
        _id: id,
      })
      if (!existingRecord)
        return res.status(400).json({ msg: 'Không tìm thấy bộ tài liệu này' })

      if (existingRecord.created_by.toString() !== req.user._id.toString())
        return res.status(400).json({
          msg: 'Bạn không có quyền xóa bộ tài liệu này do không phải là người tạo',
        })

      await DocumentSets.findOneAndDelete({ _id: id })

      await Documents.deleteMany({
        set_id: id,
      })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createDocument: async (req, res) => {
    try {
      const {
        invoice_number,
        invoice_date,
        tax_code,
        set_id,
        file,
        name,
        type,
      } = req.body

      await Documents.create({
        invoice_number,
        invoice_date,
        tax_code,
        set_id,
        file,
        name,
        type,
        created_by: req.user._id,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất tài liệu' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  updateDocument: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })

      const newOne = await Documents.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Tài liệu không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteDocument: async (req, res) => {
    try {
      const { id } = req.params
      await Documents.findOneAndDelete({ _id: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getDocuments: async (req, res) => {
    try {
      const documents = await Documents.find({
        set_id: req.params.id,
      }).populate('set_id created_by', 'name')
      res.status(200).json({ data: documents })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
}

module.exports = dataCtrl
