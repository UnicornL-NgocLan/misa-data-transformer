import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Input, Space } from 'antd'
import app from '../axiosConfig'
import { useZustand } from '../zustand'
import { Tabs, Button, Select, Table, Tooltip } from 'antd'
import { FiPlus } from 'react-icons/fi'
import EnOK from '../images/en ok.png'
import { MdDelete, MdEdit } from 'react-icons/md'
import ChartelCapitalTransactionModal from './createChartelCapitalTransaction'
import useCheckRights from '../utils/checkRights'

const CompanyCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchCompanies,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isModalChartelCapitalOpen, setIsModalChartelCapitalOpen] =
    useState(false)
  const [chartelCapitals, setChartelCapitals] = useState([])
  const {
    companies,
    companyTypes,
    chartelCapitalTransactions,
    setChartelCapitalTransactionsState,
  } = useZustand()
  const checkRights = useCheckRights()

  const handleOk = async () => {
    try {
      if (loading) return
      const { name, taxCode, attachmentUrl, parentId, companyType, shortname } =
        form.getFieldsValue()
      if (!name?.trim()) return alert('Vui lòng nhập đầy đủ thông tin')

      setLoading(true)
      if (isModalOpen?._id) {
        await app.patch(`/api/update-company/${isModalOpen?._id}`, {
          name,
          taxCode,
          attachmentUrl,
          parentId: parentId || null,
          companyType: companyType || null,
          shortname,
        })

        for (const item of chartelCapitals) {
          if (typeof item._id !== 'string') {
            await app.post('/api/create-chartel-capital-transaction', {
              ...item,
            })
          } else {
            if (item.willDelete) {
              await app.delete(
                `/api/delete-chartel-capital-transaction/${item._id}`
              )
            } else if (item.willEdit) {
              await app.patch(
                `/api/update-chartel-capital-transaction/${item._id}`,
                {
                  partner_id: item.partner_id,
                  value: item.value,
                  company_id: item.company_id?._id,
                }
              )
            }
          }
        }

        await handleRefetchChartelCapitalTransactions()
      } else {
        await app.post('/api/create-company', {
          name,
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

  const handleRefetchChartelCapitalTransactions = async () => {
    try {
      const { data } = await app.get('/api/get-chartel-capital-transactions')
      setChartelCapitalTransactionsState(data?.data)
      setChartelCapitals(
        data?.data?.filter((i) => i.company_id?._id === isModalOpen?._id)
      )
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleClose = () => {
    form.resetFields()
    handleCancel()
  }

  const handleCreateChartelCapital = (data) => {
    if (
      chartelCapitals.find(
        (item) =>
          item.partner_id === data.partner_id ||
          item.partner_id?._id === data.partner_id
      )
    )
      return alert('Đã ghi nhận vốn góp từ công ty này rồi!')
    setChartelCapitals([
      ...chartelCapitals,
      { ...data, company_id: isModalOpen?._id },
    ])
  }

  const handleEditChartelCapital = (id, data) => {
    const newList = chartelCapitals.map((i) =>
      i._id === id ? { ...i, ...data, willEdit: true } : i
    )
    setChartelCapitals(newList)
  }

  const handleDeleteRecord = async (record) => {
    const newList = chartelCapitals.map((i) =>
      i._id === record._id ? { ...i, willDelete: true } : i
    )
    setChartelCapitals(newList)
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

      const listChartelCapitalTransactions = chartelCapitalTransactions.filter(
        (i) => i.company_id?._id === isModalOpen?._id
      )
      setChartelCapitals(listChartelCapitalTransactions)
    }
  }, [])

  const items = [
    {
      key: '1',
      label: 'Thông tin chung',
      children: (
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
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={companies
                .filter((i) => !isModalOpen?._id || i._id !== isModalOpen._id) // prevent self as parent
                .map((i) => ({ value: i._id, label: i.name }))}
            />
          </Form.Item>
          <Space.Compact style={{ display: 'flex' }}>
            <Form.Item
              name="companyType"
              label="Khối công ty"
              style={{ flex: 1 }}
            >
              <Select
                showSearch
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={companyTypes.map((i) => ({
                  value: i._id,
                  label: i.name,
                }))}
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
      ),
    },
    {
      key: '2',
      label: 'Vốn góp',
      disabled: !checkRights('chartelCapital', ['read']),
      children:
        isModalOpen && isModalOpen._id ? (
          <>
            {checkRights('chartelCapital', ['create']) && (
              <Button
                color="primary"
                variant="filled"
                onClick={() => setIsModalChartelCapitalOpen(true)}
                icon={<FiPlus />}
                style={{ marginBottom: 16 }}
                size="small"
              >
                Tạo
              </Button>
            )}
            <Table
              columns={[
                {
                  title: 'Công ty góp vốn',
                  dataIndex: 'partner',
                  key: 'partner',
                  render: (value) => <span>{value}</span>,
                },
                {
                  title: 'Giá trị (VNĐ)',
                  dataIndex: 'value',
                  key: 'value',
                  align: 'center',
                  render: (value) => (
                    <span>{Intl.NumberFormat().format(value)}</span>
                  ),
                },
                {
                  title: 'Hành động',
                  align: 'center',
                  key: 'action',
                  fixed: 'right',
                  hidden:
                    !checkRights('chartelCapital', ['write']) &&
                    !checkRights('chartelCapital', ['canDelete']),
                  render: (_) => (
                    <Space size="middle">
                      {checkRights('chartelCapital', ['write']) && (
                        <Tooltip title="Chỉnh sửa">
                          <Button
                            color="default"
                            variant="outlined"
                            size="small"
                            icon={<MdEdit />}
                            onClick={() => setIsModalChartelCapitalOpen(_)}
                          ></Button>
                        </Tooltip>
                      )}
                      {checkRights('chartelCapital', ['canDelete']) && (
                        <Tooltip title="Xóa">
                          <Button
                            color="danger"
                            size="small"
                            variant="filled"
                            icon={<MdDelete />}
                            onClick={() => handleDeleteRecord(_)}
                          ></Button>
                        </Tooltip>
                      )}
                    </Space>
                  ),
                },
              ]}
              dataSource={chartelCapitals
                .filter((i) => !i.willDelete)
                .map((i) => {
                  return {
                    ...i,
                    partner: companies.find(
                      (item) =>
                        item._id === i.partner_id ||
                        item._id === i.partner_id?._id
                    )?.name,
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
            {isModalChartelCapitalOpen && (
              <ChartelCapitalTransactionModal
                isModalOpen={isModalChartelCapitalOpen}
                handleCancel={() => setIsModalChartelCapitalOpen(false)}
                handleEditChartelCapital={handleEditChartelCapital}
                handleCreateChartelCapital={handleCreateChartelCapital}
              />
            )}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'centter',
            }}
          >
            <img alt="" src={EnOK} style={{ width: 100 }} />
            <p style={{ fontWeight: 500 }}>
              Hãy tạo công ty trước, rồi mới thêm danh sách vốn góp sau nhé!
            </p>
          </div>
        ),
    },
  ]

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      width={700}
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật công ty' : 'Tạo công ty mới'}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleClose}
    >
      <Tabs defaultActiveKey="1" items={items} />
    </Modal>
  )
}

export default CompanyCreateModal
