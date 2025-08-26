import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Input, Select } from 'antd'
import app from '../axiosConfig'

const MoneyFlowReasonCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchMoneyFlowReason,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleOk = async () => {
    try {
      if (loading) return
      const { name, type } = form.getFieldsValue()
      if (!name?.trim() || !type?.trim())
        return alert('Vui lòng nhập đầy đủ thông tin')
      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(`/api/update-money-flow-reason/${isModalOpen?._id}`, {
          name,
          type,
        })
      } else {
        await app.post('/api/create-money-flow-reason', {
          name,
          type,
        })
      }
      await handleFetchMoneyFlowReason()
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
      form.setFieldValue('name', isModalOpen?.name)
      form.setFieldValue('type', isModalOpen?.type)
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={
        isModalOpen?._id
          ? 'Cập nhật mục đích dòng tiền'
          : 'Tạo mục đích dòng tiền mới'
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
          name="name"
          label="Tên mục đích"
          rules={[{ required: true, message: 'Hãy nhập tên mục đích!' }]}
        >
          <Input
            className="w-full"
            placeholder="Chi thanh toán công tác phí..."
          />
        </Form.Item>
        <Form.Item
          name="type"
          label="Loại"
          rules={[
            {
              required: true,
              message: 'Hãy cho biết mục đích này liên quan đến thu hay chi!',
            },
          ]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
              { value: 'receivable', label: 'Thu' },
              { value: 'payable', label: 'Chi' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default MoneyFlowReasonCreateModal
