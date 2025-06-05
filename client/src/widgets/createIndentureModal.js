import { useEffect, useState } from 'react'
import { Modal, Space } from 'antd'
import { Form, Input, Select, DatePicker } from 'antd'
import app from '../axiosConfig'
import { useZustand } from '../zustand'
import { InputNumber } from 'antd'
import dayjs from 'dayjs'

const IndentureCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchIndentures,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { banks, companies, auth, loanContracts } = useZustand()
  const [hasLoanContract, setHasLoanContract] = useState(false)

  const handleOk = async () => {
    try {
      if (loading) return
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
        currency,
        exchangeRate,
        loanContractId,
      } = form.getFieldsValue()
      if (
        !number?.trim() ||
        !amount ||
        !date ||
        !dueDate ||
        !interestRate ||
        !residual ||
        !state?.trim() ||
        !companyId?.trim() ||
        !currency ||
        !exchangeRate
      )
        return alert('Vui lòng nhập đầy đủ thông tin')
      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(`/api/update-indenture/${isModalOpen?._id}`, {
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
          currency,
          exchangeRate,
          loanContractId,
        })
      } else {
        await app.post('/api/create-indenture', {
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
          currency,
          exchangeRate,
          loanContractId,
        })
      }
      await handleFetchIndentures()
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

  const handleCalculateValueInterest = () => {
    const { interestRate, amount } = form.getFieldsValue()
    form.setFieldValue('interestAmount', ((interestRate * amount) / 100) * 0.5)
  }

  useEffect(() => {
    if (isModalOpen?._id) {
      form.setFieldValue('number', isModalOpen?.number)
      form.setFieldValue('bankId', isModalOpen?.bankId?._id)
      form.setFieldValue('amount', isModalOpen?.amount)
      form.setFieldValue('date', dayjs(isModalOpen?.date))
      form.setFieldValue('dueDate', dayjs(isModalOpen?.dueDate))
      form.setFieldValue('interestRate', isModalOpen?.interestRate)
      form.setFieldValue('interestAmount', isModalOpen?.interestAmount)
      form.setFieldValue('residual', isModalOpen?.residual)
      form.setFieldValue('state', isModalOpen?.state)
      form.setFieldValue('currrency', isModalOpen?.currrency)
      form.setFieldValue('exchangeRate', isModalOpen?.exchangeRate)
      form.setFieldValue('loanContractId', isModalOpen?.loanContractId?._id)
      form.setFieldValue('companyId', isModalOpen?.companyId?._id)
    } else {
      form.setFieldValue('interestRate', 0)
      form.setFieldValue('currrency', 'vnd')
      form.setFieldValue('exchangeRate', 1)
      form.setFieldValue('state', 'ongoing')
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật khế ước' : 'Tạo khế ước mới'}
      open={isModalOpen}
      onOk={handleOk}
      width={800}
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
            name="number"
            style={{ flex: 1 }}
            label="Số khế ước ngân hàng"
            rules={[{ required: true, message: 'Nhập đầy đủ!' }]}
          >
            <Input className="w-full" placeholder="" />
          </Form.Item>
          <Form.Item
            name="date"
            style={{ flex: 1 }}
            label="Ngày"
            rules={[{ required: true, message: 'Nhập đầy đủ!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="dueDate"
            style={{ flex: 1 }}
            label="Ngày đến hạn"
            rules={[{ required: true, message: 'Nhập đầy đủ!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="loanContractId"
            label="Hợp đồng vay"
            style={{ flex: 1 }}
          >
            <Select
              showSearch
              allowClear
              onChange={(value) => {
                if (value) {
                  const myLoanContract = loanContracts.find(
                    (i) => i?._id?.toString() === value.toString()
                  )
                  if (myLoanContract) {
                    form.setFieldValue('bankId', myLoanContract.bankId._id)
                    form.setFieldValue(
                      'companyId',
                      myLoanContract.companyId._id
                    )
                    form.setFieldValue('currency', myLoanContract.currency)
                  }
                }
                setHasLoanContract(value)
              }}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={loanContracts.map((i) => {
                return {
                  value: i._id,
                  label:
                    i.name +
                    ` (${i.value
                      .toString()
                      .replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ','
                      )} ${i.currency?.toUpperCase()})`,
                }
              })}
            />
          </Form.Item>
          <Form.Item
            name="bankId"
            label="Ngân hàng"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Hãy chọn ngân hàng!' }]}
          >
            <Select
              showSearch
              disabled={hasLoanContract}
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
        <Space.Compact
          direction="horizontal"
          size="middle"
          style={{ display: 'flex', width: '100%' }}
        >
          <Form.Item
            name="amount"
            label="Giá trị"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập đầy đủ!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              inputMode="decimal"
              onChange={handleCalculateValueInterest}
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
              disabled={hasLoanContract}
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
        <Space.Compact
          direction="horizontal"
          size="middle"
          style={{ display: 'flex', width: '100%' }}
        >
          <Form.Item
            name="interestRate"
            style={{ flex: 1 }}
            label="Lãi suất"
            rules={[{ required: true, message: 'Nhập đầy đủ!' }]}
          >
            <InputNumber
              inputMode="decimal"
              style={{ width: '100%' }}
              onChange={handleCalculateValueInterest}
              min={0}
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
              addonAfter="%"
            />
          </Form.Item>
          <Form.Item
            name="interestAmount"
            style={{ flex: 1 }}
            label="Giá trị lãi"
            rules={[{ required: true, message: 'Nhập đầy đủ!' }]}
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
          <Form.Item
            name="residual"
            label="Giá trị còn lại"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập đầy đủ!' }]}
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
        </Space.Compact>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="companyId"
            label="Công ty"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: 'Tài khoản này thuộc công ty nào!' },
            ]}
          >
            <Select
              showSearch
              disabled={hasLoanContract}
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
            name="state"
            label="Trạng thái"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Hãy chọn trạng thái!' }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                { value: 'ongoing', label: 'Đang thực hiện' },
                { value: 'done', label: 'Hoàn thành' },
              ]}
            />
          </Form.Item>
        </Space.Compact>
      </Form>
    </Modal>
  )
}

export default IndentureCreateModal
