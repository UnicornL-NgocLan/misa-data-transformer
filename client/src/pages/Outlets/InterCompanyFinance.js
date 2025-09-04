import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Table, Button, Space, Tag, Tooltip } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import InterCompanyFinanceModal from '../../widgets/createInterCompanyFinanceModal'
import { Input } from 'antd'
import Highlighter from 'react-highlight-words'
import { MdDelete } from 'react-icons/md'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import moment from 'moment'
import { MdEdit } from 'react-icons/md'
import useCheckRights from '../../utils/checkRights'
import { FaFileExport, FaUpload, FaClipboardCheck } from 'react-icons/fa'
import * as FileSaver from 'file-saver'
import { add7Hours } from '../../utils/plus7Hours'
import { validExcelFile } from '../../globalVariables'
import { FaExchangeAlt, FaChartArea } from 'react-icons/fa'
import { Tabs } from 'antd'
import InterCompanyFinanceChart from '../../widgets/interCompanyFinanceChart'
import dayjs from 'dayjs'
import { FaTrash } from 'react-icons/fa'
import { DatePicker } from 'antd'
import { Select } from 'antd'
import InterCompanyFinanceList from '../../widgets/interCompanyFinanceDiffList'
import { IoFilterSharp } from 'react-icons/io5'
import UploadMisaDebtModal from '../../widgets/uploadMisaDebtModal'
const { RangePicker } = DatePicker

const InterCompanyFinance = () => {
  const [interCompanyFinances, setInterCompanyFinances] = useState([])
  const {
    interCompanyFinances: currentInterCompanyFinances,
    setInterCompanyFinanceState,
    companies,
    auth,
    accounts,
  } = useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalUploadMisaOpen, setIsModalUploadMisaOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchedColumn, setSearchedColumn] = useState('')
  const fileInputRef = useRef(null)
  const searchInput = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filteredInterCompanyFinances, setFilteredInterCompanyFinances] =
    useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  // Store filter state
  const [companyFilter, setCompanyFilter] = useState([])
  const [dateRangeFilter, setDateRangeFilter] = useState([])
  const checkRights = useCheckRights()

  const showModal = useCallback((user) => {
    setIsModalOpen(user)
  }, [])

  const handleCancel = useCallback(() => {
    setIsModalOpen(false)
    setIsModalUploadMisaOpen(false)
  }, [])

  const handleSearch = useCallback((selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }, [])

  const handleReset = useCallback((clearFilters) => {
    clearFilters()
    setSearchText('')
  }, [])

  const getColumnSearchProps = useCallback(
    (dataIndex) => ({
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
    }),
    [searchText, searchedColumn]
  )

  const handleFetchInterCompanyFinances = async () => {
    try {
      const { data } = await app.get('/api/get-inter-company-finances')
      setInterCompanyFinances(data.data)
      setInterCompanyFinanceState(data.data)
      setFilteredInterCompanyFinances(data.data)
      applyFilters(companyFilter, dateRangeFilter)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleExportExcel = useCallback(() => {
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
          account: i.accountId?.code,
          counterpartCompanyName: i.counterpartCompanyId?.name,
        }
        delete object.__v
        delete object.accountId
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
  }, [interCompanyFinances])

  const handleDeleteRecord = useCallback(
    async (record) => {
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
        setFilteredInterCompanyFinances(newSources)
        if (newSources.length === 0) return
        applyFilters(companyFilter, dateRangeFilter)
      } catch (error) {
        alert(error?.response?.data?.msg || error)
      } finally {
        setLoading(false)
      }
    },
    [
      loading,
      interCompanyFinances,
      setInterCompanyFinances,
      setInterCompanyFinanceState,
      setFilteredInterCompanyFinances,
      companyFilter,
      dateRangeFilter,
    ]
  )

  const handleAddFile = useCallback(
    async (e) => {
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
            let errorText = ''
            const allValueValid = data.every((i) => {
              if (
                !companies.find(
                  (item) =>
                    i.subjectCompanyId && item.taxCode === i.subjectCompanyId
                )
              ) {
                errorText += `Mã số thuế công ty chủ thể ${i.subjectCompanyId} không tồn tại trong hệ thống.\n`
                return false
              }

              if (!i.counterpartCompanyId) {
                errorText += `Điền mã số thuế công ty đối tác hệ thống.\n`
                return false
              }

              if (i.debit === undefined || i.credit === undefined) {
                errorText += `Nợ và Có không được để trống. Vui lòng kiểm tra lại.\n`
                return false
              }

              if (i.debit < 0 || i.credit < 0) {
                errorText += `Nợ và có phải là số dương. Vui lòng kiểm tra lại.\n`
                return false
              }

              if (!i.date) {
                errorText += `Ngày không được để trống. Vui lòng kiểm tra lại.\n`
                return false
              }

              if (!i.account) {
                errorText += `Tài khoản không được để trống. Vui lòng kiểm tra lại.\n`
                return false
              }

              if (i.account.toString().length < 3) {
                errorText += `Tài khoản phải ít nhất 3 ký tự.\n`
                return false
              }

              if (
                !accounts.find(
                  (it) =>
                    it.code.toString() === i.account.toString().substring(0, 3)
                )
              ) {
                errorText += `3 ký tự đầu của tài khoản ${i.account} không có trong hệ thống\n`
                return false
              }

              if (
                ![
                  'payable',
                  'receivable',
                  'investing',
                  'investing_receivable',
                ].find((e) => e === i.type)
              ) {
                errorText += `Loại phải là "Phải trả" hoặc "Phải thu" hoặc "Đã đầu tư" hoặc "Phải thu đầu tư". Vui lòng kiểm tra lại.\n`
                return false
              }

              if (
                ['business', 'finance', 'invest', 'others'].find(
                  (e) => e === i.activityGroup
                ) === undefined
              ) {
                errorText += `Nhóm hoạt động phải là "Hoạt động kinh doanh", "Hoạt động đầu tư", "Hoạt động tài chính" hoặc "Khác". Vui lòng kiểm tra lại.\n`
                return false
              }

              if (i._id && !interCompanyFinances.find((u) => u._id === i._id)) {
                errorText += `Không tìm thấy bản ghi với ID ${i._id}. Vui lòng kiểm tra lại.\n`
                return false
              }

              return true
            })

            if (!allValueValid) return alert(errorText)

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

              const respectiveAccount = accounts.find(
                (it) =>
                  it.code.toString() === account.toString().substring(0, 3)
              )

              const processedData = {
                subjectCompanyId: newSubjectCompanyId._id,
                counterpartCompanyId: newCounterpartCompanyId?._id,
                debit,
                credit,
                type,
                activityGroup,
                date,
                accountId: respectiveAccount._id,
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
              await handleFetchInterCompanyFinances()
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
    },
    [companies, interCompanyFinances, handleFetchInterCompanyFinances]
  )

  const columns = useMemo(
    () => [
      {
        title: 'Ngày',
        dataIndex: 'date',
        key: 'date',
        align: 'center',
        sorter: (a, b) => moment(a.date) - moment(b.date),
        width: 120,
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
        title: 'Loại',
        dataIndex: 'type',
        key: 'type',
        align: 'center',
        fixed: 'right',
        filters: [
          {
            text: 'Phải thu',
            value: 'receivable',
          },
          {
            text: 'Phải trả',
            value: 'payable',
          },
          {
            text: 'Đã đầu tư',
            value: 'investing',
          },
          {
            text: 'Phải thu đầu tư',
            value: 'investing_receivable',
          },
        ],
        onFilter: (value, record) => record.type === value,
        render: (type) => (
          <Tag
            color={
              type === 'receivable'
                ? 'green'
                : type === 'payable'
                ? 'volcano'
                : type === 'investing'
                ? 'gold'
                : ''
            }
          >
            {type === 'receivable'
              ? 'Phải thu'
              : type === 'payable'
              ? 'Phải trả'
              : type === 'investing'
              ? 'Đã đầu tư'
              : 'Phải thu đầu tư'}
          </Tag>
        ),
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
          <Tag
            color={
              state === 'business'
                ? 'blue'
                : state === 'invest'
                ? 'purple'
                : state === 'finance'
                ? 'gold'
                : ''
            }
          >
            {state === 'business'
              ? 'Hoạt động kinh doanh'
              : state === 'invest'
              ? 'Hoạt động đầu tư'
              : state === 'finance'
              ? 'Hoạt động tài chính'
              : 'Khác'}
          </Tag>
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
        width: 250,
        ...getColumnSearchProps('lastUpdatedBy'),
      },
      {
        title: 'Hành động',
        align: 'center',
        key: 'action',
        fixed: 'right',
        hidden:
          (!checkRights('interCompanyFinance', ['write']) &&
            !checkRights('interCompanyFinance', ['canDelete'])) ||
          selectedRowKeys.length > 0,
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
    ],
    [searchedColumn, searchText, selectedRowKeys, checkRights]
  )

  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã chọn?')) return
    setIsProcessing(true)
    const list = [...selectedRowKeys].map((i) => {
      return app.delete(`/api/delete-inter-company-finance/${i}`)
    })
    try {
      await Promise.all(list)
      const newSources = [...interCompanyFinances].filter(
        (i) => !selectedRowKeys.includes(i._id)
      )

      const filteredNewSources = filteredInterCompanyFinances.filter(
        (i) => !selectedRowKeys.includes(i._id)
      )
      setInterCompanyFinances(newSources)
      setInterCompanyFinanceState(newSources)
      setFilteredInterCompanyFinances(filteredNewSources)
      setSelectedRowKeys([])
      if (newSources.length === 0) return
      applyFilters(companyFilter, dateRangeFilter)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setIsProcessing(false)
    }
  }, [
    selectedRowKeys,
    interCompanyFinances,
    filteredInterCompanyFinances,
    setInterCompanyFinances,
    setInterCompanyFinanceState,
    setFilteredInterCompanyFinances,
    companyFilter,
    dateRangeFilter,
  ])

  // Combined filter logic
  const applyFilters = useCallback(
    (companies, dateRange) => {
      let filtered = currentInterCompanyFinances
      if (companies) {
        if (companies.length === 1) {
          filtered = filtered.filter(
            (i) =>
              companies.includes(i.subjectCompanyId?._id) ||
              companies.includes(i.counterpartCompanyId?._id)
          )
        } else if (companies.length > 1) {
          filtered = filtered.filter(
            (i) =>
              companies.includes(i.subjectCompanyId?._id) &&
              companies.includes(i.counterpartCompanyId?._id)
          )
        }
      }
      if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const [start, end] = dateRange
        filtered = filtered.filter((item) => {
          const dueDateFormat = dayjs(item.date)
          return dueDateFormat.isBetween(
            dayjs(start, 'DD/MM/YYYY'),
            dayjs(end, 'DD/MM/YYYY'),
            'day',
            '[]'
          )
        })
      }
      setFilteredInterCompanyFinances(filtered)
    },
    [interCompanyFinances]
  )

  const handleChangeCompanyFilter = useCallback(
    (value) => {
      setCompanyFilter(value)
      applyFilters(value, dateRangeFilter)
    },
    [applyFilters, dateRangeFilter]
  )

  const handleDateRangeFilter = useCallback(
    (dates) => {
      setDateRangeFilter(dates)
      applyFilters(companyFilter, dates)
    },
    [applyFilters, companyFilter]
  )

  const rowSelection = useMemo(
    () => ({
      onChange: (mySelectedRows) => {
        setSelectedRowKeys(mySelectedRows)
      },
    }),
    []
  )

  useEffect(() => {
    if (currentInterCompanyFinances.length > 0) {
      setInterCompanyFinances(currentInterCompanyFinances)
      setFilteredInterCompanyFinances(currentInterCompanyFinances)
      applyFilters(companyFilter, dateRangeFilter)
    }
    // eslint-disable-next-line
  }, [currentInterCompanyFinances])

  return (
    <>
      <Tabs
        defaultActiveKey="1"
        items={[FaExchangeAlt, FaClipboardCheck, FaChartArea].map((Icon, i) => {
          const id = String(i + 1)
          return {
            key: id,
            disabled: id === '3' && auth.role === 'basic',
            label: `${
              id === '1'
                ? 'Hệ thống công nợ'
                : id === '2'
                ? 'Đối chiếu công nợ bị lệch'
                : 'Biểu đồ trực quan'
            }`,
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
                      <Button
                        color="primary"
                        disabled={isProcessing}
                        onClick={() => setIsModalUploadMisaOpen(true)}
                        style={{ marginBottom: 16 }}
                        icon={<FaUpload />}
                      >
                        Upload bằng mẫu MISA
                      </Button>
                    )}
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
                    {selectedRowKeys.length > 0 && (
                      <Button
                        type="primary"
                        danger
                        disabled={isProcessing}
                        onClick={handleBulkDelete}
                        style={{ marginBottom: 16 }}
                        icon={<FaTrash />}
                      >
                        Xóa
                      </Button>
                    )}
                  </Space.Compact>
                  <div>
                    <Space
                      style={{
                        marginBottom: 16,
                        display: 'flex',
                        width: '100%',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginRight: 10,
                          fontWeight: 500,
                        }}
                      >
                        <IoFilterSharp />
                        <span>Bộ lọc</span>
                      </span>
                      <RangePicker onChange={handleDateRangeFilter} />
                      <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        style={{ minWidth: '300px' }}
                        onChange={handleChangeCompanyFilter}
                        value={companyFilter}
                        placeholder="Hãy chọn công ty để lọc"
                        options={companies.map((i) => {
                          return {
                            label: i.shortname,
                            value: i._id,
                          }
                        })}
                      />
                    </Space>
                  </div>
                  <Table
                    columns={columns}
                    rowSelection={rowSelection}
                    dataSource={
                      checkRights('interCompanyFinance', ['read'])
                        ? [...filteredInterCompanyFinances]
                            .filter((i) =>
                              auth.companyIds.includes(i.subjectCompanyId?._id)
                            )
                            .map((i) => {
                              return {
                                ...i,
                                balance: i.debit - i.credit,
                                account: i.accountId?.code,
                                company: i.subjectCompanyId?.name,
                                counterpartCompany:
                                  i.counterpartCompanyId?.name,
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
                  {isModalUploadMisaOpen && (
                    <UploadMisaDebtModal
                      handleFetchInterCompanyFinances={
                        handleFetchInterCompanyFinances
                      }
                      handleCancel={handleCancel}
                      isModalUploadMisaOpen={isModalUploadMisaOpen}
                    />
                  )}
                </>
              ) : id === '2' ? (
                <InterCompanyFinanceList />
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
