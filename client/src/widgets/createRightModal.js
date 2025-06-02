import { useEffect, useState } from 'react'
import { Modal, Select, Space, Switch } from 'antd'
import { Form } from 'antd'
import { useZustand } from '../zustand'
import { objectMapping } from '../globalVariables'

const RightCreateModal = ({
  isModalOpen,
  handleCancel,
  handleCreateRight,
  handleEditRight,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { objects } = useZustand()

  const handleOk = async () => {
    try {
      if (loading) return
      const { objectId, read, write, create, canDelete } = form.getFieldsValue()
      if (!objectId?.trim()) return alert('Vui lòng nhập đầy đủ thông tin')
      const currentObject = objects.find((i) => i._id === objectId)
      if (!currentObject) return alert('Đối tượng không tồn tại')

      if (isModalOpen?._id) {
        handleEditRight(isModalOpen?._id, {
          objectId,
          object: objectMapping[currentObject.name],
          read,
          write,
          create,
          canDelete,
        })
      } else {
        handleCreateRight({
          _id: Math.random() * 1000000,
          objectId,
          object: objectMapping[currentObject.name],
          read,
          write,
          create,
          canDelete,
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
      form.setFieldValue('read', isModalOpen?.read)
      form.setFieldValue('write', isModalOpen?.write)
      form.setFieldValue('canDelete', isModalOpen?.canDelete)
      form.setFieldValue('create', isModalOpen?.create)
      form.setFieldValue('objectId', isModalOpen?.objectId)
    } else {
      form.setFieldValue('read', false)
      form.setFieldValue('write', false)
      form.setFieldValue('canDelete', false)
      form.setFieldValue('create', false)
    }
  }, [])

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật quyền' : 'Tạo quyền mới'}
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
          name="objectId"
          label="Đối tượng"
          rules={[{ required: true, message: 'Hãy chọn đối tượng!' }]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={objects.map((i) => {
              return { value: i._id, label: objectMapping[i.name] }
            })}
          />
        </Form.Item>
        <Space.Compact style={{ display: 'flex' }}>
          <Form.Item name="read" style={{ flex: 1 }} label="Đọc">
            <Switch />
          </Form.Item>
          <Form.Item name="create" style={{ flex: 1 }} label="Tạo">
            <Switch />
          </Form.Item>
          <Form.Item name="write" style={{ flex: 1 }} label="Sửa">
            <Switch />
          </Form.Item>
          <Form.Item name="canDelete" style={{ flex: 1 }} label="Xóa">
            <Switch />
          </Form.Item>
        </Space.Compact>
      </Form>
    </Modal>
  )
}

export default RightCreateModal
