import { useEffect } from 'react'
import { Modal, Space } from 'antd'
import { Form, Select, Input, DatePicker } from 'antd'
import { sysmtemUserRole } from '../globalVariables'
import { useZustand } from '../zustand'
import dayjs from 'dayjs'

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
    const { role, companyIds, name, username, joiningDate, birthdate, code } =
      form.getFieldsValue()
    if (!role.trim() || !name.trim() || !username.trim())
      return alert('Vui lòng nhập đầy đủ thông tin')
    handleUpdateRole(
      role,
      isModalOpen?._id,
      companyIds,
      name,
      username,
      joiningDate,
      birthdate,
      code
    )
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
    form.setFieldValue('code', isModalOpen?.code)
    form.setFieldValue(
      'joiningDate',
      isModalOpen?.joiningDate ? dayjs(isModalOpen?.joiningDate) : null
    )
    form.setFieldValue(
      'birthdate',
      isModalOpen?.birthdate ? dayjs(isModalOpen?.birthdate) : null
    )
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
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            style={{ flex: 1 }}
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Hãy nhập tên đăng nhập!' }]}
          >
            <Input className="w-full" placeholder="Nhập tên đăng nhập" />
          </Form.Item>
          <Form.Item
            style={{ flex: 1 }}
            name="name"
            label="Tên người dùng"
            rules={[{ required: true, message: 'Hãy nhập tên người dùng!' }]}
          >
            <Input className="w-full" placeholder="Nhập tên người dùng" />
          </Form.Item>
        </Space.Compact>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item name="code" label="Mã nhân sự" style={{ flex: 1 }}>
            <Input className="w-full" placeholder="Nhập mã nhân sự" />
          </Form.Item>
          <Form.Item name="birthdate" label="Ngày sinh" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="joiningDate"
            label="Ngày vào làm"
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Space.Compact>
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
