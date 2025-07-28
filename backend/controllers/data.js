const Companies = require('../models/company')
const Banks = require('../models/bank')
const BankAccounts = require('../models/bankAccount')
const Indentures = require('../models/indenture')
const PaymentPlans = require('../models/paymentPlan')
const Sources = require('../models/source')
const LoanContracts = require('../models/loanContract')
const InterCompanyFinances = require('../models/interCompanyFinance')
const CompanyTypes = require('../models/companyType')
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
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
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
      }).populate('companyId', 'name')
      res.status(200).json({ data: banks })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createSource: async (req, res) => {
    try {
      const { companyId, name, type, bankAccountId, value, currency } = req.body
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
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
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
        .populate('companyId updatedBy', 'name')
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
        activityGroup,
        type,
        account,
        date,
      } = req.body
      if (!subjectCompanyId || !activityGroup || !type || !date || !account)
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
        account,
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
      await InterCompanyFinances.create({
        subjectCompanyId,
        counterpartCompanyId,
        type,
        activityGroup,
        account,
        debit,
        credit,
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
        account: parameters.account,
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
}

module.exports = dataCtrl
