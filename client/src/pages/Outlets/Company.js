import { useState, useEffect } from 'react'
import { Table, Space, Button, Tooltip } from 'antd'
import { useZustand } from '../../zustand'
import useCheckRights from '../../utils/checkRights'
import { FiPlus } from 'react-icons/fi'
import { MdEdit, MdDelete } from 'react-icons/md'
import CompanyCreateModal from '../../widgets/createCompanyModal'
import app from '../../axiosConfig'
import { Tabs } from 'antd'
import { FaRegBuilding, FaTag } from 'react-icons/fa'
import CompanyTypeModal from '../../widgets/createCompanyTypeModal'

const Company = () => {
  const [companies, setCompanies] = useState([])
  const [companyTypes, setCompanyTypes] = useState([])
  const checkRights = useCheckRights()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCompanyTypeModalOpen, setIsCompanyTypeModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    companies: currentCompanies,
    setCompanyState,
    companyTypes: currentCompanyTypes,
    setCompanyTypeState,
  } = useZustand()

  const columns = [
    {
      title: 'Tên công ty',
      dataIndex: 'name',
      key: 'name',
      width: 450,
    },
    {
      title: 'Tên viết tắt',
      dataIndex: 'shortname',
      key: 'shortname',
      width: 200,
    },
    {
      title: 'Công ty mẹ',
      dataIndex: 'parentCompany',
      key: 'parentCompany',
      width: 450,
    },
    {
      title: 'Khối công ty',
      dataIndex: 'companyTypeName',
      key: 'companyTypeName',
      width: 300,
    },
    {
      title: 'Mã số thuế',
      dataIndex: 'taxCode',
      key: 'taxCode',
      width: 200,
    },
    {
      title: 'Vốn điều lệ (VND)',
      dataIndex: 'chartelCapital',
      key: 'chartelCapital',
      align: 'right',
      width: 200,
      sorter: (a, b) => a.chartelCapital - b.chartelCapital,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Link chứng từ kèm theo',
      dataIndex: 'attachmentUrl',
      key: 'attachmentUrl',
      width: 200,
      render: (value) => (
        <a href={value} target="_blank">
          {value}
        </a>
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      width: 100,
      hidden: !checkRights('company', ['write']),
      render: (_) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              color="default"
              variant="outlined"
              size="small"
              icon={<MdEdit />}
              onClick={() => showModal(_)}
            ></Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-company-type/${record._id}`)
      const newSources = [...companyTypes].filter((i) => i._id !== record._id)
      const newCompanies = [...companies].map((i) => {
        if (i.companyType?._id === record._id) {
          return { ...i, companyType: null }
        }
        return i
      })
      setCompanies(newCompanies)
      setCompanyState(newCompanies)
      setCompanyTypes(newSources)
      setCompanyTypeState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const companyTypeColumns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      width: 100,
      hidden:
        !checkRights('companyType', ['write']) &&
        !checkRights('companyType', ['canDelete']),
      render: (_) => (
        <Space size="middle">
          {checkRights('companyType', ['write']) && (
            <Tooltip title="Chỉnh sửa">
              <Button
                color="default"
                variant="outlined"
                size="small"
                icon={<MdEdit />}
                onClick={() => setIsCompanyTypeModalOpen(_)}
              ></Button>
            </Tooltip>
          )}
          {checkRights('companyType', ['canDelete']) && (
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
  ]

  const showModal = (record) => {
    setIsModalOpen(record)
  }

  const handleFetchCompanies = async () => {
    try {
      const { data } = await app.get('/api/get-companies')
      setCompanies(data.data)
      setCompanyState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleFetchCompanyTypes = async () => {
    try {
      const { data } = await app.get('/api/get-company-types')
      setCompanyTypes(data.data)
      setCompanyTypeState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  useEffect(() => {
    if (currentCompanies.length > 0) setCompanies(currentCompanies)
    if (currentCompanyTypes.length > 0) setCompanyTypes(currentCompanyTypes)
  }, [])
  return (
    <Tabs
      defaultActiveKey="1"
      items={[FaRegBuilding, FaTag].map((Icon, i) => {
        const id = String(i + 1)
        return {
          key: id,
          label: i === 0 ? 'Công ty' : 'Khối',
          children:
            i === 0 ? (
              <>
                {checkRights('company', ['create']) && (
                  <Button
                    color="primary"
                    onClick={() => showModal(true)}
                    variant="filled"
                    style={{ marginBottom: 16 }}
                    icon={<FiPlus />}
                  >
                    Tạo
                  </Button>
                )}
                <Table
                  columns={columns}
                  dataSource={
                    checkRights('company', ['read'])
                      ? companies.map((i) => {
                          return {
                            ...i,
                            parentCompany: i?.parentId?.name,
                            companyTypeName: i?.companyType?.name,
                          }
                        })
                      : []
                  }
                  bordered
                  size="small"
                  rowKey={(record) => record._id}
                  pagination={{
                    pageSize: 40,
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
                {isModalOpen && (
                  <CompanyCreateModal
                    handleCancel={() => setIsModalOpen(false)}
                    isModalOpen={isModalOpen}
                    handleFetchCompanies={handleFetchCompanies}
                  />
                )}
              </>
            ) : (
              <>
                {checkRights('companyType', ['create']) && (
                  <Button
                    color="primary"
                    onClick={() => setIsCompanyTypeModalOpen(true)}
                    variant="filled"
                    style={{ marginBottom: 16 }}
                    icon={<FiPlus />}
                  >
                    Tạo
                  </Button>
                )}
                <Table
                  columns={companyTypeColumns}
                  dataSource={
                    checkRights('companyType', ['read'])
                      ? currentCompanyTypes
                      : []
                  }
                  bordered
                  size="small"
                  rowKey={(record) => record._id}
                  pagination={{
                    pageSize: 40,
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
                {isCompanyTypeModalOpen && (
                  <CompanyTypeModal
                    handleCancel={() => setIsCompanyTypeModalOpen(false)}
                    isModalOpen={isCompanyTypeModalOpen}
                    handleFetchCompanyTypes={handleFetchCompanyTypes}
                  />
                )}
              </>
            ),
          icon: <Icon />,
        }
      })}
    />
  )
}
export default Company
