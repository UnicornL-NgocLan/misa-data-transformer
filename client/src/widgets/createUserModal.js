import { useEffect } from 'react'
import { Modal, Space } from 'antd'
import { Form, Select, Input, DatePicker } from 'antd'
import { sysmtemUserRole } from '../globalVariables'
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import app from '../axiosConfig'
import { useZustand } from '../zustand'

const CreateUserModal = ({
  isModalOpen,
  handleCancel,
  loading,
  handleFetchUsers,
}) => {
  const [form] = Form.useForm()
  const { companies } = useZustand()

  const handleOk = async () => {
    try {
      if (loading) return
      const {
        name,
        username,
        password,
        role,
        companyIds,
        joiningDate,
        birthdate,
        code,
      } = form.getFieldsValue()
      if (
        !role?.trim() ||
        !name?.trim() ||
        !username?.trim() ||
        !password?.trim() ||
        companyIds?.length === 0
      )
        return alert('Vui lòng nhập đầy đủ thông tin')
      await app.post('/api/create-user', {
        name,
        username,
        password,
        role,
        companyIds,
        joiningDate,
        birthdate,
        code,
      })
      await handleFetchUsers()
      handleClose()
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleClose = () => {
    form.resetFields()
    handleCancel()
  }

  useEffect(() => {
    form.setFieldValue('role', 'basic')
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      width={700}
      confirmLoading={loading}
      title="Tạo người dùng mới"
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
            name="username"
            label="Tên đăng nhập"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Hãy nhập tên đăng nhập!' }]}
          >
            <Input className="w-full" placeholder="Nhập tên đăng nhập" />
          </Form.Item>
          <Form.Item
            name="name"
            style={{ flex: 1 }}
            label="Tên người dùng"
            rules={[{ required: true, message: 'Hãy nhập tên người dùng!' }]}
          >
            <Input className="w-full" placeholder="Nhập tên người dùng" />
          </Form.Item>
          <Form.Item
            name="password"
            style={{ flex: 1 }}
            label="Mật khẩu"
            rules={[{ required: true, message: 'Hãy nhập mật khẩu!' }]}
          >
            <Input.Password
              className="w-full"
              placeholder="Nhập mật khẩu"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
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

export default CreateUserModal
