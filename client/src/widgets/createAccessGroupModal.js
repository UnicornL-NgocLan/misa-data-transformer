import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Input, Select, Space, Button, Table, Tooltip } from 'antd'
import { Tabs } from 'antd'
import RightCreateModal from './createRightModal'
import app from '../axiosConfig'
import { FiPlus } from 'react-icons/fi'
import { MdEdit } from 'react-icons/md'
import { MdDelete } from 'react-icons/md'
import { useZustand } from '../zustand'
import { objectMapping, sysmtemUserRole } from '../globalVariables'
import useCheckRights from '../utils/checkRights'

const AccessGroupCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchAccessGroups,
}) => {
  const { users, rights: currentRights } = useZustand()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isModalRightOpen, setIsModalRightOpen] = useState(false)
  const [rights, setRights] = useState([])
  const checkRights = useCheckRights()

  const handleOk = async () => {
    try {
      if (loading) return
      const { name, description, userIds } = form.getFieldsValue()
      if (!name?.trim()) return alert('Vui lòng nhập tên')
      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(`/api/update-access-group/${isModalOpen?._id}`, {
          name,
          description,
          rights,
          userIds,
        })
      } else {
        await app.post('/api/create-access-group', {
          name,
          description,
          rights,
          userIds,
        })
      }
      await handleFetchAccessGroups()
      handleClose()
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRight = (data) => {
    setRights([...rights, data])
  }

  const handleEditRight = (id, data) => {
    const newRights = rights.map((i) => (i._id === id ? { ...i, ...data } : i))
    setRights(newRights)
  }

  const handleClose = () => {
    form.resetFields()
    handleCancel()
  }

  const handleDeleteRecord = async (record) => {
    const newRights = rights.filter((i) => i._id !== record._id)
    setRights(newRights)
  }

  useEffect(() => {
    if (isModalOpen?._id) {
      form.setFieldValue('name', isModalOpen?.name)
      form.setFieldValue('description', isModalOpen?.description)
      form.setFieldValue('userIds', isModalOpen?.userIds)
      const respectiveRights = currentRights.filter(
        (i) => i.accessGroupId === isModalOpen._id
      )
      setRights(respectiveRights)
    }
  }, [])

  const items = [
    {
      key: '1',
      label: 'Thông tin chung',
      children: (
        <>
          <Space.Compact style={{ display: 'flex' }}>
            <Form.Item
              name="name"
              label="Tên nhóm quyền"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Hãy nhập tên nhóm quyền!' }]}
            >
              <Input className="w-full" placeholder="Tên nhóm quyền" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả" style={{ flex: 1 }}>
              <Input
                className="w-full"
                placeholder="Hãy miêu tả cho nhóm quyền này..."
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="userIds" label="Người dùng thuộc nhóm quyền">
            <Select
              mode="multiple"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={users
                .filter((i) => i.role !== sysmtemUserRole.admin && i.active)
                .map((i) => {
                  return { value: i._id, label: i.name }
                })}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: '2',
      label: 'Quyền',
      children: (
        <>
          <Button
            color="primary"
            variant="filled"
            onClick={() => setIsModalRightOpen(true)}
            icon={<FiPlus />}
            style={{ marginBottom: 16 }}
            size="small"
          >
            Tạo
          </Button>
          <Table
            columns={[
              {
                title: 'Đối tượng',
                dataIndex: 'object',
                key: 'object',
              },
              {
                title: 'Đọc',
                dataIndex: 'read',
                key: 'read',
                align: 'center',
                render: (isTrue) => <span>{isTrue ? '✅' : '❌'}</span>,
              },
              {
                title: 'Tạo',
                dataIndex: 'create',
                key: 'create',
                align: 'center',
                render: (isTrue) => <span>{isTrue ? '✅' : '❌'}</span>,
              },
              {
                title: 'Sửa',
                dataIndex: 'write',
                key: 'write',
                align: 'center',
                render: (isTrue) => <span>{isTrue ? '✅' : '❌'}</span>,
              },
              {
                title: 'Xóa',
                dataIndex: 'canDelete',
                key: 'canDelete',
                align: 'center',
                render: (isTrue) => <span>{isTrue ? '✅' : '❌'}</span>,
              },
              {
                title: 'Hành động',
                align: 'center',
                key: 'action',
                fixed: 'right',
                render: (_) => (
                  <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                      <Button
                        color="default"
                        variant="outlined"
                        size="small"
                        icon={<MdEdit />}
                        onClick={() => setIsModalRightOpen(_)}
                      ></Button>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        color="danger"
                        size="small"
                        variant="filled"
                        icon={<MdDelete />}
                        onClick={() => handleDeleteRecord(_)}
                      ></Button>
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
            dataSource={rights.map((i) => {
              return {
                ...i,
                object:
                  i.object ||
                  (i.objectId?.name ? objectMapping[i.objectId?.name] : ''),
              }
            })}
            bordered
            size="small"
            rowKey={(record) => record._id}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 8,
              simple: true,
              size: 'small',
              position: ['bottomRight'],
              showTotal: (total, range) => (
                <span>
                  {range[0]}-{range[1]} / {total}
                </span>
              ),
            }}
          />
        </>
      ),
    },
  ]

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật nhóm quyền' : 'Tạo nhóm quyền'}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleClose}
    >
      <Form
        form={form}
        name="dynamic_ruleEdit"
        onFinish={handleOk}
        disabled={!checkRights('accessGroup', ['write']) && isModalOpen?._id}
        layout="vertical"
      >
        <Tabs defaultActiveKey="1" items={items} />
      </Form>
      {isModalRightOpen && (
        <RightCreateModal
          isModalOpen={isModalRightOpen}
          handleCancel={() => setIsModalRightOpen(false)}
          handleCreateRight={handleCreateRight}
          handleEditRight={handleEditRight}
          objectList={rights.map((i) => {
            return {
              ...i,
              object:
                i.object ||
                (i.objectId?.name ? objectMapping[i.objectId?.name] : ''),
            }
          })}
        />
      )}
    </Modal>
  )
}

export default AccessGroupCreateModal
