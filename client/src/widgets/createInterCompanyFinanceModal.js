import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Select, Space } from 'antd'
import app from '../axiosConfig'
import { InputNumber, DatePicker } from 'antd'
import { useZustand } from '../zustand'
import dayjs from 'dayjs'

const InterCompanyFinanceModal = ({
  isModalOpen,
  handleCancel,
  handleFetchInterCompanyFinances,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { companies, auth, accounts } = useZustand()

  const handleOk = async () => {
    try {
      if (loading) return
      const {
        subjectCompanyId,
        counterpartCompanyId,
        debit,
        credit,
        type,
        activityGroup,
        accountId,
        date,
      } = form.getFieldsValue()
      if (
        !subjectCompanyId ||
        !counterpartCompanyId ||
        !type ||
        !activityGroup ||
        !accountId ||
        !date
      )
        return alert('Vui lòng nhập đầy đủ thông tin')
      if (subjectCompanyId === counterpartCompanyId)
        return alert('Công ty chủ thể và công ty đối tác không được trùng nhau')
      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(
          `/api/update-inter-company-finance/${isModalOpen?._id}`,
          {
            subjectCompanyId,
            counterpartCompanyId,
            debit: debit || 0,
            type,
            activityGroup,
            credit: credit || 0,
            accountId,
            date,
          }
        )
      } else {
        await app.post('/api/create-inter-company-finance', {
          subjectCompanyId,
          counterpartCompanyId,
          debit,
          type,
          credit,
          activityGroup,
          accountId,
          date,
        })
      }
      await handleFetchInterCompanyFinances()
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
      form.setFieldValue('subjectCompanyId', isModalOpen?.subjectCompanyId?._id)
      form.setFieldValue(
        'counterpartCompanyId',
        isModalOpen?.counterpartCompanyId?._id
      )
      form.setFieldValue('debit', isModalOpen?.debit)
      form.setFieldValue('credit', isModalOpen?.credit)
      form.setFieldValue('type', isModalOpen?.type)
      form.setFieldValue('activityGroup', isModalOpen?.activityGroup)
      form.setFieldValue('date', dayjs(isModalOpen?.date))
      form.setFieldValue('accountId', isModalOpen?.accountId?._id)
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật công nợ' : 'Tạo công nợ mới'}
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
          name="subjectCompanyId"
          label="Công ty chủ thể"
          rules={[
            { required: true, message: 'Vui lòng chọn công ty chủ thể!' },
          ]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={companies
              .filter((i) => auth.companyIds.includes(i._id))
              .map((i) => {
                return { value: i._id, label: i.name }
              })}
          />
        </Form.Item>
        <Form.Item
          name="counterpartCompanyId"
          label="Công ty đối tác"
          rules={[
            { required: true, message: 'Vui lòng chọn công ty đối tác!' },
          ]}
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
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="accountId"
            label="Tài khoản"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Hãy nhập tài khoản!' }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={accounts.map((i) => {
                return { value: i._id, label: i.code }
              })}
              onChange={(i) => {
                const myAccount = accounts.find((item) => item._id === i)
                form.setFieldValue('type', myAccount.type)
                form.setFieldValue('activityGroup', myAccount.activityGroup)
              }}
            />
          </Form.Item>
          <Form.Item
            name="date"
            label="Ngày"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Nhập ngày!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Space.Compact>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            style={{ flex: 1 }}
            name="type"
            label="Loại"
            rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                { value: 'payable', label: 'Phải trả' },
                { value: 'receivable', label: 'Phải thu' },
              ]}
            />
          </Form.Item>
          <Form.Item
            style={{ flex: 1 }}
            name="activityGroup"
            label="Nhóm hoạt động"
            rules={[
              { required: true, message: 'Vui lòng chọn nhóm hoạt động!' },
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
                { value: 'business', label: 'Hoạt động kinh doanh' },
                { value: 'invest', label: 'Hoạt động đầu tư' },
                { value: 'finance', label: 'Hoạt động tài chính' },
                { value: 'others', label: 'Khác' },
              ]}
            />
          </Form.Item>
        </Space.Compact>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="debit"
            label="Nợ (VND)"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
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
          <Form.Item
            name="credit"
            label="Có (VND)"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
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
      </Form>
    </Modal>
  )
}

export default InterCompanyFinanceModal
