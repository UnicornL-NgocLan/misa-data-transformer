import { useEffect } from 'react'
import { Modal } from 'antd'
import { Form, Select, Input } from 'antd'
import { sysmtemUserRole } from '../globalVariables'
import { useZustand } from '../zustand'

const UpdateRoleModal = ({
  isModalOpen,
  handleCancel,
  handleUpdateRole,
  loading,
}) => {
  const [form] = Form.useForm()
  const { companies } = useZustand()

  const handleOk = () => {
    if (loading) return
    const { role, companyIds, name, username } = form.getFieldsValue()
    if (!role.trim() || !name.trim() || !username.trim())
      return alert('Vui lòng nhập đầy đủ thông tin')
    handleUpdateRole(role, isModalOpen?._id, companyIds, name, username)
  }

  const handleClose = () => {
    form.resetFields()
    handleCancel()
  }

  useEffect(() => {
    form.setFieldValue('role', isModalOpen?.role)
    form.setFieldValue('name', isModalOpen?.name)
    form.setFieldValue('username', isModalOpen?.username)
    form.setFieldValue('companyIds', isModalOpen?.companyIds)
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title="Cập nhật thông tin"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleClose}
    >
      <Form
        form={form}
        name="dynamic_ruleEdit"
        onFinish={handleOk}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label="Tên đăng nhập"
          rules={[{ required: true, message: 'Hãy nhập tên đăng nhập!' }]}
        >
          <Input className="w-full" placeholder="Nhập tên đăng nhập" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên người dùng"
          rules={[{ required: true, message: 'Hãy nhập tên người dùng!' }]}
        >
          <Input className="w-full" placeholder="Nhập tên người dùng" />
        </Form.Item>
        <Form.Item
          name="role"
          label="Quyền của người dùng"
          rules={[{ required: true, message: 'Hãy chọn quyền muốn cập nhật!' }]}
        >
          <Select
            options={[
              { value: sysmtemUserRole.basic, label: <span>Cơ bản</span> },
              { value: sysmtemUserRole.manager, label: <span>Quản lý</span> },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="companyIds"
          label="Công ty người dùng đảm nhận"
          rules={[{ required: true, message: 'Hãy chọn công ty!' }]}
        >
          <Select
            mode="tags"
            maxTagCount={1}
            options={companies.map((i) => {
              return { value: i._id, label: i.name }
            })}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UpdateRoleModal
