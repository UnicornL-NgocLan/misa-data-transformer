import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Input, Space } from 'antd'
import app from '../axiosConfig'
import { useZustand } from '../zustand'
import { Select } from 'antd'
import { InputNumber } from 'antd'

const CompanyCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchCompanies,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { companies, companyTypes } = useZustand()

  const handleOk = async () => {
    try {
      if (loading) return
      const {
        name,
        chartelCapital,
        taxCode,
        attachmentUrl,
        parentId,
        companyType,
        shortname,
      } = form.getFieldsValue()
      if (!name?.trim()) return alert('Vui lòng nhập đầy đủ thông tin')

      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(`/api/update-company/${isModalOpen?._id}`, {
          name,
          chartelCapital,
          taxCode,
          attachmentUrl,
          parentId: parentId || null,
          companyType: companyType || null,
          shortname,
        })
      } else {
        await app.post('/api/create-company', {
          name,
          chartelCapital,
          taxCode,
          attachmentUrl,
          parentId,
          companyType,
          shortname,
        })
      }
      await handleFetchCompanies()
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
      form.setFieldValue('chartelCapital', isModalOpen?.chartelCapital || 0)
      form.setFieldValue('taxCode', isModalOpen?.taxCode || '')
      form.setFieldValue('attachmentUrl', isModalOpen?.attachmentUrl || '')
      form.setFieldValue('parentId', isModalOpen?.parentId?._id)
      form.setFieldValue('companyType', isModalOpen?.companyType?._id)
      form.setFieldValue('shortname', isModalOpen?.shortname || '')
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật công ty' : 'Tạo công ty mới'}
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
            name="name"
            style={{ flex: 1 }}
            label="Tên công ty"
            rules={[{ required: true, message: 'Hãy nhập tên công ty!' }]}
          >
            <Input className="w-full" placeholder="Công ty TNHH ABC..." />
          </Form.Item>
          <Form.Item
            name="shortname"
            label="Tên viết tắt"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Hãy nhập tên viết tắt!' }]}
          >
            <Input className="w-full" placeholder="ABC" />
          </Form.Item>
        </Space.Compact>
        <Form.Item name="parentId" label="Công ty mẹ">
          <Select
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={companies
              .filter((i) => !isModalOpen?._id || i._id !== isModalOpen._id) // prevent self as parent
              .map((i) => ({ value: i._id, label: i.name }))}
          />
        </Form.Item>
        <Form.Item name="companyType" label="Khối công ty">
          <Select
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={companyTypes.map((i) => ({ value: i._id, label: i.name }))}
          />
        </Form.Item>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item
            name="chartelCapital"
            label="Vốn điều lệ"
            style={{ flex: 1 }}
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
          <Form.Item name="taxCode" label="Mã số thuế" style={{ flex: 1 }}>
            <Input className="w-full" placeholder="123456789..." />
          </Form.Item>
        </Space.Compact>
        <Form.Item name="attachmentUrl" label="Đường dẫn đính kèm">
          <Input
            className="w-full"
            placeholder="https://example.com/file.pdf"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CompanyCreateModal
