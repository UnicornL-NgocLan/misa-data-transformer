const Rights = require('../models/right')
const AccessGroups = require('../models/accessGroup')
const Objects = require('../models/object')

const dataCtrl = {
  createRight: async (req, res) => {
    try {
      const { objectId, read, create, write, canDelete } = req.body
      if (!objectId || !read || !create || !write || !canDelete)
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })

      await Rights.create({
        objectId,
        read,
        create,
        write,
        canDelete,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất quyền' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getRights: async (req, res) => {
    try {
      const data = await Rights.find({}).populate('objectId', 'name')
      res.status(200).json({ data })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  editRight: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      const newOne = await Rights.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Quyền này không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteRight: async (req, res) => {
    try {
      const { id } = req.params
      await Rights.findOneAndDelete({ _id: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createAccessGroup: async (req, res) => {
    try {
      const { name, description, companyIds, userIds, rights } = req.body
      if (!name.trim())
        return res
          .status(400)
          .json({ msg: 'Vui lòng cung cấp đầy đủ thông tin' })

      const group = await AccessGroups.create({
        name,
        description,
        companyIds,
        userIds,
      })
      for (const right of rights) {
        await Rights.create({
          objectId: right.objectId,
          accessGroupId: group._id,
          read: right.read,
          write: right.write,
          canDelete: right.canDelete,
          create: right.create,
        })
      }

      res.status(200).json({ msg: 'Đã tạo hoàn tất nhóm quyền' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getAccessGroups: async (req, res) => {
    try {
      const data = await AccessGroups.find({})
      res.status(200).json({ data })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  editAccessGroup: async (req, res) => {
    try {
      let parameters = { ...req.body }
      const { id } = req.params
      Object.keys(parameters).forEach((key) => {
        if (parameters[key] === null) {
          delete parameters[key]
        }
      })
      const newOne = await AccessGroups.findOneAndUpdate(
        { _id: id },
        { ...parameters },
        { new: true }
      )
      if (!newOne)
        return res
          .status(400)
          .json({ msg: 'Nhóm quyền này không có trong cơ sở dữ liệu' })
      res.status(200).json({ msg: 'Đã cập nhật thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  deleteAccessGroup: async (req, res) => {
    try {
      const { id } = req.params
      await AccessGroups.findOneAndDelete({ _id: id })
      await Rights.deleteMany({ accessGroupId: id })
      res.status(200).json({ msg: 'Đã xóa thành công' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  createObject: async (req, res) => {
    try {
      const { name } = req.body
      if (!name.trim())
        return res.status(400).json({ msg: 'Vui lòng nhập tên' })

      await Objects.create({
        name,
      })

      res.status(200).json({ msg: 'Đã tạo hoàn tất đối tượng' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getObjects: async (req, res) => {
    try {
      const data = await Objects.find({})
      res.status(200).json({ data })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
}

module.exports = dataCtrl
