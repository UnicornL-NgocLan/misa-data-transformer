import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Input, Select } from 'antd'
import app from '../axiosConfig'

const AccountCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchAccounts,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleOk = async () => {
    try {
      if (loading) return
      const { code, type, activityGroup } = form.getFieldsValue()
      if (!code?.trim() || !type?.trim() || !activityGroup?.trim())
        return alert('Vui lòng nhập đầy đủ thông tin')
      if (code.length !== 3) return alert('Mã tài khoản phải 3 ký tự')
      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(`/api/update-account/${isModalOpen?._id}`, {
          code,
          type,
          activityGroup,
        })
      } else {
        await app.post('/api/create-account', {
          code,
          type,
          activityGroup,
        })
      }
      await handleFetchAccounts()
      handleClose()
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.resetFields()
    handleCancel()
  }

  useEffect(() => {
    if (isModalOpen?._id) {
      form.setFieldValue('code', isModalOpen?.code)
      form.setFieldValue('type', isModalOpen?.type)
      form.setFieldValue('activityGroup', isModalOpen?.activityGroup)
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={
        isModalOpen?._id
          ? 'Cập nhật tài khoản kế toán'
          : 'Tạo tài khoản kế toán mới'
      }
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
          name="code"
          label="Mã tài khoản"
          rules={[
            { required: true, message: 'Hãy nhập mã tài khoản kế toán!' },
          ]}
        >
          <Input
            className="w-full"
            placeholder="00001057..."
            maxLength={3}
            minLength={3}
          />
        </Form.Item>
        <Form.Item
          style={{ flex: 1 }}
          name="type"
          label="Loại"
          rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
              { value: 'payable', label: 'Phải trả' },
              { value: 'receivable', label: 'Phải thu' },
              { value: 'investing', label: 'Đã đầu tư' },
              { value: 'investing_receivable', label: 'Phải thu đầu tư' },
            ]}
          />
        </Form.Item>
        <Form.Item
          style={{ flex: 1 }}
          name="activityGroup"
          label="Nhóm hoạt động"
          rules={[{ required: true, message: 'Vui lòng chọn nhóm hoạt động!' }]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
              { value: 'business', label: 'Hoạt động kinh doanh' },
              { value: 'invest', label: 'Hoạt động đầu tư' },
              { value: 'finance', label: 'Hoạt động tài chính' },
              { value: 'others', label: 'Khác' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AccountCreateModal
