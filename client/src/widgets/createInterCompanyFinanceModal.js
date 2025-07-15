import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Select, Space } from 'antd'
import app from '../axiosConfig'
import { InputNumber } from 'antd'
import { useZustand } from '../zustand'

const InterCompanyFinanceModal = ({
  isModalOpen,
  handleCancel,
  handleFetchInterCompanyFinances,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { companies, auth } = useZustand()

  const handleOk = async () => {
    try {
      if (loading) return
      const {
        subjectCompanyId,
        counterpartCompanyId,
        value,
        type,
        activityGroup,
      } = form.getFieldsValue()
      if (
        !subjectCompanyId ||
        !counterpartCompanyId ||
        !value ||
        !type ||
        !activityGroup
      )
        return alert('Vui lòng nhập đầy đủ thông tin')
      if (subjectCompanyId === counterpartCompanyId)
        return alert('Công ty chủ thể và công ty đối tác không được trùng nhau')
      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(
          `/api/update-inter-company-finance/${isModalOpen?._id}`,
          { subjectCompanyId, counterpartCompanyId, value, type, activityGroup }
        )
      } else {
        await app.post('/api/create-inter-company-finance', {
          subjectCompanyId,
          counterpartCompanyId,
          value,
          type,
          activityGroup,
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
      form.setFieldValue('value', isModalOpen?.value)
      form.setFieldValue('type', isModalOpen?.type)
      form.setFieldValue('activityGroup', isModalOpen?.activityGroup)
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
        <Form.Item
          name="value"
          label="Giá trị (VND)"
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
      </Form>
    </Modal>
  )
}

export default InterCompanyFinanceModal
