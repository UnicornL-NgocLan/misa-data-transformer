import { useEffect, useState } from 'react'
import { Modal, Select } from 'antd'
import { Form } from 'antd'
import { useZustand } from '../zustand'
import { InputNumber } from 'antd'

const ChartelCapitalTransactionModal = ({
  isModalOpen,
  handleCancel,
  handleCreateChartelCapital,
  handleEditChartelCapital,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { companies } = useZustand()

  const handleOk = async () => {
    try {
      if (loading) return
      const { partner_id, value } = form.getFieldsValue()
      if (!partner_id) return alert('Vui lòng nhập đầy đủ thông tin')
      const companyPartner = companies.find(
        (i) => i._id === partner_id || i._id === partner_id._id
      )
      if (!companyPartner) return alert('Công ty góp vốn không tồn tại')

      if (isModalOpen?._id) {
        handleEditChartelCapital(isModalOpen?._id, {
          partner_id,
          partner: companyPartner?.name,
          company_id: isModalOpen?.company_id,
          value: value,
        })
      } else {
        handleCreateChartelCapital({
          _id: Math.random() * 1000000,
          partner_id,
          partner: companyPartner?.name,
          value,
        })
      }
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
      form.setFieldValue('value', isModalOpen?.value)
      form.setFieldValue(
        'partner_id',
        isModalOpen?.partner_id?._id || isModalOpen?.partner_id
      )
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật vốn góp' : 'Tạo vốn góp mới'}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleClose}
    >
      <Form
        form={form}
        name="dynamic_ruleEdit2"
        onFinish={handleOk}
        layout="vertical"
      >
        <Form.Item
          name="partner_id"
          label="Công ty góp vốn"
          rules={[{ required: true, message: 'Hãy chọn công ty!' }]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={companies.map((i) => {
              return { value: i._id, label: i.name }
            })}
          />
        </Form.Item>
        <Form.Item
          name="value"
          label="Giá trị (VNĐ)"
          rules={[{ required: true, message: 'Nhập giá trị vốn góp!' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            inputMode="decimal"
            formatter={(value) =>
              value
                ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') // thousands with comma
                : ''
            }
            parser={(value) =>
              value
                ? parseFloat(value.toString().replace(/,/g, '')) // remove commas
                : 0
            }
            min={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ChartelCapitalTransactionModal
