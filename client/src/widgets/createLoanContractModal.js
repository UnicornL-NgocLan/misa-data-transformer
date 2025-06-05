import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Input, Select, DatePicker, Space } from 'antd'
import app from '../axiosConfig'
import { InputNumber } from 'antd'
import dayjs from 'dayjs'
import { useZustand } from '../zustand'

const LoanContractCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchLoanContracts,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { companies, auth, banks } = useZustand()

  const handleOk = async () => {
    try {
      if (loading) return
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
      } = form.getFieldsValue()
      if (
        !name ||
        !value ||
        !bankId ||
        !companyId ||
        !date ||
        !state ||
        !currency
      )
        return alert('Vui lòng nhập đầy đủ thông tin')

      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(`/api/update-loan-contract/${isModalOpen?._id}`, {
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
      } else {
        await app.post('/api/create-loan-contract', {
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
      }
      await handleFetchLoanContracts()
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

  const handleCalculateValueConversed = () => {
    const { exchangeRate, value } = form.getFieldsValue()
    form.setFieldValue('conversedValue', exchangeRate * value)
  }

  useEffect(() => {
    if (isModalOpen?._id) {
      form.setFieldValue('name', isModalOpen?.name)
      form.setFieldValue('value', isModalOpen?.value)
      form.setFieldValue('dueDate', dayjs(isModalOpen?.dueDate, 'DD/MM/YYYY'))
      form.setFieldValue('date', dayjs(isModalOpen?.date, 'DD/MM/YYYY'))
      form.setFieldValue('state', isModalOpen?.state)
      form.setFieldValue('exchangeRate', isModalOpen?.exchangeRate)
      form.setFieldValue('currency', isModalOpen?.currency)
      form.setFieldValue('companyId', isModalOpen?.companyId?._id)
      form.setFieldValue('bankId', isModalOpen?.bankId?._id)
      form.setFieldValue('conversedValue', isModalOpen?.conversedValue)
    } else {
      form.setFieldValue('state', 'ongoing')
      form.setFieldValue('currency', 'vnd')
      form.setFieldValue('exchangeRate', 1)
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      width={800}
      confirmLoading={loading}
      title={
        isModalOpen?._id ? 'Cập nhật hợp đồng vay' : 'Tạo hợp đồng vay mới'
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
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="companyId"
            label="Công ty"
            style={{ flex: 1 }}
            rules={[
              {
                required: true,
                message: 'Hợp đồng vay này thuộc công ty nào!',
              },
            ]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={companies
                .filter((i) => auth.companyIds.includes(i._id))
                .map((i) => {
                  return { value: i._id, label: i.name }
                })}
            />
          </Form.Item>
          <Form.Item
            name="bankId"
            label="Ngân hàng"
            style={{ flex: 1 }}
            rules={[
              {
                required: true,
                message: 'Hợp đồng vay liên quan đến ngân hàng nào!',
              },
            ]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={banks.map((i) => {
                return { value: i._id, label: i.name }
              })}
            />
          </Form.Item>
        </Space.Compact>
        <Form.Item
          name="name"
          label="Tên hợp đồng"
          style={{ flex: 3 }}
          rules={[{ required: true, message: 'Nhập tên hợp đồng!' }]}
        >
          <Input className="w-full" placeholder="" />
        </Form.Item>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="date"
            label="Ngày hợp đồng"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập ngày thanh toán!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dueDate" label="Ngày hết hạn" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="value"
            label="Giá trị hợp đồng"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập giá trị hợp đồng!' }]}
          >
            <InputNumber
              inputMode="decimal"
              style={{ width: '100%' }}
              onChange={handleCalculateValueConversed}
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
          <Form.Item
            style={{ flex: 1 }}
            name="currency"
            label="Loại tiền"
            rules={[
              {
                required: true,
                message: 'Hãy cho biết tài khoản này thuộc tiền tệ gì!',
              },
            ]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                { value: 'vnd', label: 'VND' },
                { value: 'usd', label: 'USD' },
                { value: 'cny', label: 'CNY' },
                { value: 'thb', label: 'THB' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="exchangeRate"
            label="Tỷ giá hối đoái"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập tỷ giá hối đoái!' }]}
          >
            <InputNumber
              inputMode="decimal"
              style={{ width: '100%' }}
              onChange={handleCalculateValueConversed}
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
          <Form.Item
            name="conversedValue"
            label="Giá trị quy đổi (VND)"
            style={{ flex: 1 }}
          >
            <InputNumber
              inputMode="decimal"
              readOnly={true}
              disabled={true}
              style={{ width: '100%' }}
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
        </Space.Compact>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="state"
            label="Trạng thái"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Hãy chọn trạng thái!' }]}
          >
            <Select
              showSearch
              disabled={!isModalOpen?._id}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                { value: 'ongoing', label: 'Đang mở' },
                { value: 'done', label: 'Đóng' },
              ]}
            />
          </Form.Item>
        </Space.Compact>
      </Form>
    </Modal>
  )
}

export default LoanContractCreateModal
