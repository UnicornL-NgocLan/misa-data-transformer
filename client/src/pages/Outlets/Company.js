import { useState, useEffect, useRef } from 'react'
import { Table, Space, Button, Tooltip } from 'antd'
import { useZustand } from '../../zustand'
import useCheckRights from '../../utils/checkRights'
import { FiCloudLightning, FiPlus } from 'react-icons/fi'
import { MdEdit, MdDelete } from 'react-icons/md'
import CompanyCreateModal from '../../widgets/createCompanyModal'
import app from '../../axiosConfig'
import { Tabs } from 'antd'
import { FaRegBuilding, FaTag, FaUpload } from 'react-icons/fa'
import CompanyTypeModal from '../../widgets/createCompanyTypeModal'
import { validExcelFile } from '../../globalVariables'

const Company = () => {
  const [companies, setCompanies] = useState([])
  const fileInputRef = useRef(null)
  const [companyTypes, setCompanyTypes] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const checkRights = useCheckRights()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCompanyTypeModalOpen, setIsCompanyTypeModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    companies: currentCompanies,
    auth,
    setCompanyState,
    companyTypes: currentCompanyTypes,
    setCompanyTypeState,
    chartelCapitalTransactions,
    setChartelCapitalTransactionsState,
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
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      hidden: !checkRights('chartelCapital', ['read']),
      width: 200,
      sorter: (a, b) => a.total - b.total,
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
      render: (_) =>
        auth.companyIds.find((item) => {
          return item === _._id
        }) ? (
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
        ) : null,
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

  const handleFetchChartelCapitalTransactions = async () => {
    try {
      const { data } = await app.get('/api/get-chartel-capital-transactions')
      setChartelCapitalTransactionsState(data?.data)
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

  const handleAddFile = async (e) => {
    try {
      const file = e.target.files
      const fileType = file[0].type
      if (!validExcelFile.includes(fileType))
        return alert('File của bạn phải là excel')

      setIsProcessing(true)
      // Read file into ArrayBuffer
      const buffer = await new Promise((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.readAsArrayBuffer(file[0])
        fileReader.onload = (e) => resolve(e.target.result)
        fileReader.onerror = (err) => reject(err)
      })

      // Create a worker from public directory
      const worker = new Worker(
        new URL('../../workers/excelWorker.worker.js', import.meta.url)
      )

      // Post the buffer to the worker
      worker.postMessage(buffer)

      // Handle response from the worker
      worker.onmessage = async (e) => {
        const { success, data, error } = e.data
        if (success) {
          const allValueValid = data.every(
            (i) =>
              companies.find(
                (item) => item.taxCode.toString() === i.company_id.toString()
              ) &&
              companies.find(
                (item) => item.taxCode.toString() === i.partner_id.toString()
              ) &&
              companies.every((item) =>
                auth.companyIds.includes(item._id.toString())
              )
          )

          if (!allValueValid) {
            fileInputRef.current.value = ''
            setIsProcessing(false)
            worker.terminate()
            return alert(
              'Phát hiện mã số thuế không hợp lệ trong file upload hoặc tồn tại công ty trong file bạn không có quyền cập nhật. Vui lòng kiểm tra!'
            )
          }

          const myMapList = data.map((i) => {
            const { company_id, partner_id, value } = i
            const newCompanyId = companies.find(
              (item) => item.taxCode.toString() === company_id.toString()
            )

            const partnerCompanyId = companies.find(
              (item) => item.taxCode.toString() === partner_id.toString()
            )

            if (!newCompanyId || !partnerCompanyId || !value) {
              fileInputRef.current.value = ''
              setIsProcessing(false)
              worker.terminate()
              return alert('Đảm bảo dữ liệu phải đầy đủ')
            }

            const processedData = {
              company_id: newCompanyId,
              partner_id: partnerCompanyId,
              value,
            }

            return app.post(
              '/api/create-chartel-capital-transaction',
              processedData
            )
          })

          await Promise.all(myMapList)
          await handleFetchChartelCapitalTransactions()
          setIsProcessing(false)
        } else {
          alert('Lỗi xử lý file: ' + error)
        }

        worker.terminate()
      }

      // Handle worker errors
      worker.onerror = (err) => {
        console.error('Worker error:', err)
        alert('Đã xảy ra lỗi trong quá trình xử lý file.')
        worker.terminate()
      }
    } catch (error) {
      alert('Lỗi không xác định: ' + error?.response?.data?.msg)
      setIsProcessing(false)
    } finally {
      fileInputRef.current.value = ''
      setIsProcessing(false)
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
                <Space.Compact>
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
                  {checkRights('chartelCapital', ['create']) && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleAddFile}
                      />
                      <Button
                        icon={<FaUpload />}
                        color="primary"
                        disabled={isProcessing}
                        onClick={() => {
                          fileInputRef.current.click()
                        }}
                      >
                        Upload vốn điều lệ
                      </Button>
                    </div>
                  )}
                </Space.Compact>
                <Table
                  columns={columns}
                  dataSource={
                    checkRights('company', ['read'])
                      ? companies.map((i) => {
                          const listOfRespectiveChartelCapital =
                            chartelCapitalTransactions.filter(
                              (item) => item.company_id?._id === i._id
                            )
                          let totalValue = 0

                          for (const line of listOfRespectiveChartelCapital) {
                            totalValue += line.value
                          }
                          return {
                            ...i,
                            parentCompany: i?.parentId?.name,
                            companyTypeName: i?.companyType?.name,
                            total: totalValue,
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
