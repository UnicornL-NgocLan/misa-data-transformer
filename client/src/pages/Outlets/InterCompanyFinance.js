import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Tag, Tooltip } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import InterCompanyFinanceModal from '../../widgets/createInterCompanyFinanceModal'
import { Input, Typography } from 'antd'
import Highlighter from 'react-highlight-words'
import { MdDelete } from 'react-icons/md'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import moment from 'moment'
import { MdEdit } from 'react-icons/md'
import useCheckRights from '../../utils/checkRights'
import { FaFileExport, FaUpload } from 'react-icons/fa'
import * as FileSaver from 'file-saver'
import { add7Hours } from '../../utils/plus7Hours'
import { validExcelFile } from '../../globalVariables'
import { FaExchangeAlt, FaChartArea } from 'react-icons/fa'
import { Tabs } from 'antd'
import InterCompanyFinanceChart from '../../widgets/interCompanyFinanceChart'

const InterCompanyFinance = () => {
  const [interCompanyFinances, setInterCompanyFinances] = useState([])
  const {
    interCompanyFinances: currentInterCompanyFinances,
    setInterCompanyFinanceState,
    companies,
    auth,
  } = useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchedColumn, setSearchedColumn] = useState('')
  const fileInputRef = useRef(null)
  const searchInput = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const checkRights = useCheckRights()

  const showModal = (user) => {
    setIsModalOpen(user)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = (clearFilters) => {
    clearFilters()
    setSearchText('')
  }

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Tìm kiếm
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              })
              setSearchText(selectedKeys[0])
              setSearchedColumn(dataIndex)
            }}
          >
            OK
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close()
            }}
          >
            Đóng
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1677ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ?.toString()
        ?.toLowerCase()
        ?.includes(value?.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100)
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: '#ffc069',
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  })

  const handleFetchInterCompanyFinances = async () => {
    try {
      const { data } = await app.get('/api/get-inter-company-finances')
      setInterCompanyFinances(data.data)
      setInterCompanyFinanceState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleExportExcel = () => {
    setIsProcessing(true)
    const worker = new Worker(
      new URL('../../workers/exportToExcelFile.worker.js', import.meta.url)
    )
    worker.postMessage({
      data: interCompanyFinances.map((i) => {
        let object = {
          ...i,
          subjectCompanyId: i.subjectCompanyId?.taxCode,
          counterpartCompanyId: i.counterpartCompanyId?.taxCode,
          lastUpdatedBy: i.lastUpdatedBy?.name,
          updatedAt: add7Hours(i.updatedAt),
          createdAt: add7Hours(i.createdAt),
          date: add7Hours(i.date),
          subjectCompanyName: i.subjectCompanyId?.name,
          counterpartCompanyName: i.counterpartCompanyId?.name,
        }
        delete object.__v
        return object
      }),
      fileName: 'Dữ liệu hệ thống nợ',
    })
    worker.onmessage = (e) => {
      const { blob, fileName } = e.data
      FileSaver.saveAs(blob, fileName)
      worker.terminate()
      setIsProcessing(false)
    }
    worker.onerror = (err) => {
      console.error('Worker error:', err)
      worker.terminate()
      setIsProcessing(false)
    }
  }

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-inter-company-finance/${record._id}`)
      const newSources = [...interCompanyFinances].filter(
        (i) => i._id !== record._id
      )
      setInterCompanyFinances(newSources)
      setInterCompanyFinanceState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
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
                (item) =>
                  i.subjectCompanyId && item.taxCode === i.subjectCompanyId
              ) &&
              companies.find(
                (item) =>
                  i.counterpartCompanyId &&
                  item.taxCode === i.counterpartCompanyId
              ) &&
              ['payable', 'receivable'].find((e) => e === i.type) &&
              ['business', 'finance', 'invest', 'others'].find(
                (e) => e === i.activityGroup
              ) &&
              (i._id ? interCompanyFinances.find((u) => u._id === i._id) : true)
          )

          if (!allValueValid) {
            fileInputRef.current.value = ''
            setIsProcessing(false)
            worker.terminate()
            return alert(
              'Kiểm tra lại mã số thuế công ty, loại, id, nhóm hoạt động xem có tồn tại trong hệ thống không?v'
            )
          }

          const myMapList = data.map((i) => {
            const {
              subjectCompanyId,
              counterpartCompanyId,
              debit,
              credit,
              type,
              activityGroup,
              date,
              account,
            } = i
            const newSubjectCompanyId = companies.find(
              (item) => item.taxCode === subjectCompanyId
            )
            const newCounterpartCompanyId = companies.find(
              (item) => item.taxCode === counterpartCompanyId
            )

            const valueInValid = debit < 0 || credit < 0
            if (
              valueInValid ||
              !newSubjectCompanyId ||
              !newCounterpartCompanyId ||
              !type ||
              !activityGroup ||
              !date ||
              !account
            ) {
              fileInputRef.current.value = ''
              setIsProcessing(false)
              worker.terminate()
              return alert('Đảm bảo dữ liệu phải đầy đủ')
            }

            const processedData = {
              subjectCompanyId: newSubjectCompanyId._id,
              counterpartCompanyId: newCounterpartCompanyId._id,
              debit,
              credit,
              type,
              activityGroup,
              date,
              account,
            }

            return i._id
              ? app.patch(
                  `/api/update-inter-company-finance/${i._id}`,
                  processedData
                )
              : app.post('/api/create-inter-company-finance', processedData)
          })
          try {
            await Promise.all(myMapList)
            await handleFetchInterCompanyFinances()
          } catch (error) {
            alert(error?.response?.data?.msg)
          }
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

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      align: 'right',
      sorter: (a, b) => moment(a.date) - moment(b.date),
      width: 100,
      render: (value) => <span>{moment(value).format('DD/MM/YYYY')}</span>,
    },
    {
      title: 'Công ty chủ thể',
      dataIndex: 'company',
      key: 'company',
      width: 350,
      ...getColumnSearchProps('company'),
    },
    {
      title: 'Công ty đối tác',
      dataIndex: 'counterpartCompany',
      key: 'counterpartCompany',
      width: 350,
      ...getColumnSearchProps('counterpartCompany'),
    },
    {
      title: 'Tài khoản',
      dataIndex: 'account',
      key: 'account',
      width: 100,
      ...getColumnSearchProps('account'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      fixed: 'right',
      filters: [
        {
          value: 'payable',
          text: 'Phải trả',
        },
        {
          value: 'receivable',
          text: 'Phải thu',
        },
      ],
      onFilter: (value, record) => record.type === value,
      render: (state) => (
        <Tag color={state === 'payable' ? 'red' : 'green'}>
          {state === 'payable' ? 'Phải trả' : 'Phải thu'}
        </Tag>
      ),
    },
    {
      title: 'Nhóm hoạt động',
      dataIndex: 'activityGroup',
      key: 'activityGroup',
      align: 'center',
      fixed: 'right',
      filters: [
        {
          value: 'business',
          text: 'Hoạt động kinh doanh',
        },
        {
          value: 'invest',
          text: 'Hoạt động đầu tư',
        },
        {
          value: 'finance',
          text: 'Hoạt động tài chính',
        },
        {
          value: 'others',
          text: 'Khác',
        },
      ],
      onFilter: (value, record) => record.activityGroup === value,
      render: (state) => (
        <span>
          {state === 'business'
            ? 'Hoạt động kinh doanh'
            : state === 'invest'
            ? 'Hoạt động đầu tư'
            : state === 'finance'
            ? 'Hoạt động tài chính'
            : 'Khác'}
        </span>
      ),
    },
    {
      title: 'Nợ (VND)',
      dataIndex: 'debit',
      key: 'debit',
      align: 'right',
      sorter: (a, b) => a.debit - b.debit,
      width: 120,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Có (VND)',
      dataIndex: 'credit',
      key: 'credit',
      align: 'right',
      sorter: (a, b) => a.credit - b.credit,
      width: 120,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Số dư (VND)',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      sorter: (a, b) => a.balance - b.balance,
      width: 120,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Lần cập nhật gần nhất',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      align: 'center',
      sorter: (a, b) => moment(a.updatedAt) - moment(b.updatedAt),
      render: (value) => (
        <span>{moment(value).format('DD/MM/YYYY HH:mm:ss')}</span>
      ),
    },
    {
      title: 'Người cập nhật gần nhất',
      dataIndex: 'lastUpdatedBy',
      align: 'center',
      key: 'lastUpdatedBy',
      width: 300,
      ...getColumnSearchProps('lastUpdatedBy'),
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      fixed: 'right',
      hidden:
        !checkRights('interCompanyFinance', ['write']) &&
        !checkRights('interCompanyFinance', ['canDelete']),
      width: 100,
      render: (_) => (
        <Space size="middle">
          {checkRights('interCompanyFinance', ['write']) && (
            <Tooltip title="Chỉnh sửa">
              <Button
                color="default"
                variant="outlined"
                size="small"
                icon={<MdEdit />}
                onClick={() => showModal(_)}
              ></Button>
            </Tooltip>
          )}
          {checkRights('interCompanyFinance', ['canDelete']) && (
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

  useEffect(() => {
    if (currentInterCompanyFinances.length > 0)
      setInterCompanyFinances(currentInterCompanyFinances)
  }, [])

  return (
    <>
      <Tabs
        defaultActiveKey="1"
        items={[FaExchangeAlt, FaChartArea].map((Icon, i) => {
          const id = String(i + 1)
          return {
            key: id,
            disabled: id === '2' && auth.role === 'basic',
            label: `${id === '1' ? 'Hệ thống công nợ' : 'Biểu đồ trực quan'}`,
            children:
              id === '1' ? (
                <>
                  <Space.Compact>
                    {checkRights('interCompanyFinance', ['create']) && (
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
                    <Button
                      color="primary"
                      disabled={isProcessing}
                      onClick={handleExportExcel}
                      style={{ marginBottom: 16 }}
                      icon={<FaFileExport />}
                    >
                      Export
                    </Button>
                    {!checkRights('interCompanyFinance', ['read']) &&
                    !checkRights('interCompanyFinance', ['write']) ? (
                      <></>
                    ) : (
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
                          Upload
                        </Button>
                      </div>
                    )}
                  </Space.Compact>
                  <Table
                    columns={columns}
                    dataSource={
                      checkRights('interCompanyFinance', ['read'])
                        ? [...interCompanyFinances].map((i) => {
                            return {
                              ...i,
                              balance: i.debit - i.credit,
                              company: i.subjectCompanyId?.name,
                              counterpartCompany: i.counterpartCompanyId?.name,
                              lastUpdatedBy: i.lastUpdatedBy?.name,
                            }
                          })
                        : []
                    }
                    bordered
                    size="small"
                    rowKey={(record) => record._id}
                    scroll={{ x: 'max-content' }}
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
                    <InterCompanyFinanceModal
                      handleCancel={handleCancel}
                      isModalOpen={isModalOpen}
                      handleFetchInterCompanyFinances={
                        handleFetchInterCompanyFinances
                      }
                    />
                  )}
                </>
              ) : (
                <InterCompanyFinanceChart data={interCompanyFinances} />
              ),
            icon: <Icon />,
          }
        })}
      />
    </>
  )
}
export default InterCompanyFinance
