import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Tag, Tooltip, DatePicker } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import PaymentPlanCreateModal from '../../widgets/createPaymentPlanModal'
import { Input, Typography } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import moment from 'moment'
import { MdEdit } from 'react-icons/md'
import { validExcelFile } from '../../globalVariables'
import { MdDelete } from 'react-icons/md'
import { FaFileExport } from 'react-icons/fa'
import * as FileSaver from 'file-saver'
import { FaUpload } from 'react-icons/fa'
import _ from 'lodash'
import { FaCheck } from 'react-icons/fa'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import useCheckRights from '../../utils/checkRights'
import { add7Hours } from '../../utils/plus7Hours'
const { RangePicker } = DatePicker
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)

const PaymentPlan = () => {
  const [paymentPlans, setPaymentPlans] = useState([])
  const {
    paymentPlans: currentPaymentPlans,
    setPaymentPlanState,
    companies,
    moneyFlowReasons,
  } = useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)
  const [loading, setLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)
  const [filteredData, setFilteredData] = useState([])
  const [isFilteredDate, setIsFilteredDate] = useState(false)
  const checkRights = useCheckRights()

  const { Text } = Typography

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

  const handleFetchPaymentPlans = async () => {
    try {
      const { data } = await app.get('/api/get-payment-plans')
      setPaymentPlans(data.data)
      setPaymentPlanState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-payment-plan/${record._id}`)
      const newSources = [...paymentPlans].filter((i) => i._id !== record._id)
      setPaymentPlans(newSources)
      setPaymentPlanState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckDone = async (record) => {
    try {
      if (loading) return
      setLoading(true)
      await app.patch(`/api/update-payment-plan/${record._id}`, {
        state: 'done',
      })
      const newSources = [...paymentPlans].map((i) =>
        i._id === record._id ? { ...i, state: 'done' } : i
      )
      setPaymentPlans(newSources)
      setPaymentPlanState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    setIsProcessing(true)
    const worker = new Worker(
      new URL('../../workers/exportToExcelFile.worker.js', import.meta.url)
    )
    worker.postMessage({
      data: paymentPlans.map((i) => {
        const newDueDate = add7Hours(i.dueDate)
        const newCreatedAt = add7Hours(i.createdAt)
        const newUpdatedAt = add7Hours(i.updatedAt)

        let object = {
          ...i,
          companyId: i.companyId?.name,
          dueDate: newDueDate,
          createdAt: newCreatedAt,
          updatedAt: newUpdatedAt,
          moneyFlowGroupId: i.moneyFlowGroupId?.name,
          dateExported: add7Hours(moment(Date.now()).toISOString()),
        }
        delete object.__v
        return object
      }),
      fileName: 'Dữ liệu kế hoạch thanh toán',
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
              companies.find((item) => item.name === i.companyId) &&
              ['in_country', 'out_country', 'delivery', 'other'].find(
                (o) => o === i.type
              ) &&
              ['return', 'not_return', 'holding'].find(
                (e) => e === i.documentState
              ) &&
              ['vnd', 'usd', 'cny', 'thb'].find((e) => e === i.currency) &&
              (i._id ? paymentPlans.find((u) => u._id === i._id) : true)
          )

          if (!allValueValid) {
            fileInputRef.current.value = ''
            setIsProcessing(false)
            worker.terminate()
            return alert(
              'Kiểm tra lại công ty, loại, id và đơn vị tiền tệ xem có tồn tại trong hệ thống không?'
            )
          }

          const myMapList = data.map((i) => {
            const {
              subject,
              content,
              amount,
              dueDate,
              companyId,
              document,
              currency,
              exchangeRate,
              conversedValue,
              total,
              state,
              note,
              type,
              documentState,
              moneyFlowGroupId,
            } = i
            const newCompanyId = companies.find(
              (item) => item.name === companyId
            )

            const newMoneyFlowGroupId = moneyFlowGroupId
              ? moneyFlowReasons.find(
                  (i) => i.name === moneyFlowGroupId && i.type === 'payable'
                )
              : null

            let myDueDate = undefined
            if (_.isDate(dueDate)) {
              myDueDate = dueDate
            } else if (_.isNumber(dueDate)) {
              const utc_days = Math.floor(dueDate - 25569) // Excel epoch is Jan 1, 1900
              const utc_value = utc_days * 86400 // seconds in a day
              myDueDate = utc_value
            } else {
              myDueDate = dueDate
            }

            if (
              !subject?.trim() ||
              !amount ||
              !myDueDate ||
              !content?.trim() ||
              !companyId ||
              !state ||
              !documentState
            ) {
              fileInputRef.current.value = ''
              setIsProcessing(false)
              worker.terminate()
              return alert('Đảm bảo dữ liệu phải đầy đủ')
            }

            const processedData = {
              subject,
              content,
              amount,
              dueDate: new Date(myDueDate),
              companyId: newCompanyId._id,
              document,
              currency,
              exchangeRate,
              total,
              conversedValue,
              note,
              type,
              state,
              documentState,
              moneyFlowGroupId: newMoneyFlowGroupId?._id || null,
            }

            return i._id
              ? app.patch(`/api/update-payment-plan/${i._id}`, processedData)
              : app.post('/api/create-payment-plan', processedData)
          })

          await Promise.all(myMapList)
          await handleFetchPaymentPlans()
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

  const handleDateFilter = (dates) => {
    if (!dates || dates.length === 0) {
      setFilteredData(paymentPlans)
      setIsFilteredDate(false)
    } else {
      const [start, end] = dates
      const filtered = paymentPlans.filter((item) => {
        const startDay = dayjs(start, 'DD/MM/YYYY')
        const endDay = dayjs(end, 'DD/MM/YYYY')
        const dueDateFormat = dayjs(item.dueDate)
        return dueDateFormat.isBetween(startDay, endDay, 'day', '[]')
      })
      setFilteredData(filtered)
      setIsFilteredDate(true)
    }
  }

  const getFilteredPaymentPlans = () =>
    isFilteredDate ? filteredData : paymentPlans

  const columns = [
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
      width: 200,
      fixed: 'left',
      ...getColumnSearchProps('company'),
    },
    {
      title: 'Đối tượng',
      dataIndex: 'subject',
      key: 'subject',
      width: 150,
      ...getColumnSearchProps('subject'),
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      width: 150,
      ...getColumnSearchProps('content'),
    },
    {
      title: 'Mục đích dự chi',
      dataIndex: 'moneyFlowReason',
      key: 'moneyFlowReason',
      width: 130,
      ...getColumnSearchProps('moneyFlowReason'),
    },
    {
      title: 'Chứng từ gốc',
      dataIndex: 'document',
      key: 'document',
      width: 130,
      ...getColumnSearchProps('document'),
    },
    {
      title: 'Ngày',
      dataIndex: 'dueDate',
      key: 'dueDate',
      align: 'right',
      sorter: (a, b) => {
        return dayjs(a.dueDate, 'DD/MM/YYYY') - dayjs(b.dueDate, 'DD/MM/YYYY')
      },
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <RangePicker onChange={handleDateFilter} />
        </div>
      ),
      onFilter: () => {},
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      sorter: (a, b) => a.total - b.total,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Tiền tệ',
      dataIndex: 'currency',
      key: 'currency',
      align: 'center',
      fixed: 'right',
      filters: [
        {
          text: 'VND',
          value: 'vnd',
        },
        {
          text: 'USD',
          value: 'usd',
        },
        {
          text: 'THB',
          value: 'thb',
        },
        {
          text: 'CNY',
          value: 'cny',
        },
      ],
      onFilter: (value, record) => record.currency === value,
      render: (state) => <span>{state.toUpperCase()}</span>,
    },
    {
      title: 'Tỷ giá',
      dataIndex: 'exchangeRate',
      key: 'exchangeRate',
      align: 'right',
      ...getColumnSearchProps('exchangeRate'),
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Giá trị quy đổi',
      dataIndex: 'conversedValue',
      key: 'conversedValue',
      align: 'right',
      sorter: (a, b) => a.conversedValue - b.conversedValue,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ...getColumnSearchProps('note'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      filters: [
        {
          text: 'Trong nước',
          value: 'in_country',
        },
        {
          text: 'Ngoài nươc',
          value: 'out_country',
        },
        {
          text: 'Vận chuyển',
          value: 'delivery',
        },
        {
          text: 'Khác',
          value: 'other',
        },
      ],
      onFilter: (value, record) => record.type === value,
      render: (state) => (
        <Tag
          color={
            state === 'in_country'
              ? 'green'
              : state === 'out_country'
              ? 'red'
              : state === 'delivery'
              ? 'pink'
              : ''
          }
        >
          {state === 'in_country'
            ? 'Trong nước'
            : state === 'out_country'
            ? 'Ngoài nước'
            : state === 'delivery'
            ? 'Vận chuyển'
            : state === 'other'
            ? 'Khác'
            : ''}
        </Tag>
      ),
    },
    {
      title: 'Link chứng từ kèm theo',
      dataIndex: 'documentLink',
      key: 'documentLink',
      width: 200,
      render: (value) => (
        <a href={value} target="_blank">
          {value}
        </a>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'right',
      sorter: (a, b) => {
        return (
          dayjs(a.createdAt, 'DD/MM/YYYY') - dayjs(b.createdAt, 'DD/MM/YYYY')
        )
      },
    },
    {
      title: 'Ngày cập nhật gần nhất',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      align: 'right',
      sorter: (a, b) => {
        return (
          dayjs(a.updatedAt, 'DD/MM/YYYY') - dayjs(b.updatedAt, 'DD/MM/YYYY')
        )
      },
    },
    {
      title: 'Tr. thái thanh toán',
      dataIndex: 'state',
      key: 'state',
      align: 'center',
      filters: [
        {
          text: 'Chưa xong',
          value: 'ongoing',
        },
        {
          text: 'Hoàn thành',
          value: 'done',
        },
      ],
      onFilter: (value, record) => record.state === value,
      defaultFilteredValue: ['ongoing'],
      render: (state) => (
        <Tag color={state === 'done' ? 'green' : ''}>
          {state === 'done' ? 'Hoàn thành' : 'Chưa xong'}
        </Tag>
      ),
    },
    {
      title: 'Tr. thái hồ sơ',
      dataIndex: 'documentState',
      key: 'documentState',
      align: 'center',
      filters: [
        { value: 'holding', text: 'Đang giữ' },
        { value: 'return', text: 'Đã trả' },
        { value: 'not_return', text: 'Chưa trả' },
      ],
      onFilter: (value, record) => record.documentState === value,
      render: (state) => (
        <Tag
          color={
            state === 'return'
              ? 'green'
              : state === 'holding'
              ? 'red'
              : state === 'not_return'
              ? 'blue'
              : ''
          }
        >
          {state === 'holding'
            ? 'Đang giữ'
            : state === 'return'
            ? 'Đã trả'
            : state === 'not_return'
            ? 'Chưa trả'
            : 'Không xác định'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      hidden:
        !checkRights('paymentPlan', ['write']) &&
        !checkRights('paymentPlan', ['canDelete']),
      width: 100,
      fixed: 'right',
      render: (_) => (
        <Space size="small">
          {checkRights('paymentPlan', ['write']) && (
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
          {_.state !== 'done' && checkRights('paymentPlan', ['write']) && (
            <Tooltip title="Đánh dấu hoàn tất">
              <Button
                color="green"
                variant="outlined"
                size="small"
                icon={<FaCheck />}
                onClick={() => handleCheckDone(_)}
              ></Button>
            </Tooltip>
          )}
          {checkRights('paymentPlan', ['canDelete']) && (
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
    if (currentPaymentPlans.length > 0) setPaymentPlans(currentPaymentPlans)
  }, [])

  return (
    <>
      <Space.Compact>
        {checkRights('paymentPlan', ['create']) && (
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
        {!checkRights('paymentPlan', ['write']) &&
        !checkRights('paymentPlan', ['create']) ? (
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
          checkRights('paymentPlan', ['read'])
            ? getFilteredPaymentPlans().map((i) => {
                return {
                  ...i,
                  company: i?.companyId?.name,
                  moneyFlowReason: i?.moneyFlowGroupId?.name,
                  dueDate: moment(i?.dueDate).format('DD/MM/YYYY'),
                  updatedAt: moment(i?.updatedAt).format('DD/MM/YYYY HH:mm:ss'),
                  createdAt: moment(i?.createdAt).format('DD/MM/YYYY HH:mm:ss'),
                }
              })
            : []
        }
        bordered
        size="small"
        rowKey={(record) => record._id}
        scroll={{ x: 'max-content' }}
        pagination={{
          pageSize: 80,
          simple: true,
          size: 'small',
          position: ['bottomRight'],
          showTotal: (total, range) => (
            <span>
              {range[0]}-{range[1]} / {total}
            </span>
          ),
        }}
        summary={(pageData) => {
          let totalConversedValue = 0
          let totalPayable = 0
          let totalAmount = 0

          pageData.forEach(({ conversedValue, total, amount }) => {
            totalConversedValue += conversedValue
            totalPayable += total
            totalAmount += amount
          })

          return (
            <>
              <Table.Summary.Row style={{ background: '#FAFAFA' }}>
                <Table.Summary.Cell>
                  <Text style={{ fontWeight: 600 }}>Tổng cộng</Text>
                </Table.Summary.Cell>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Table.Summary.Cell key={i}></Table.Summary.Cell>
                ))}
                <Table.Summary.Cell align="end">
                  <Text style={{ fontWeight: 600 }}>
                    {pageData.length > 0 &&
                    pageData.every((i) => i.currency === pageData[0].currency)
                      ? Intl.NumberFormat().format(totalPayable)
                      : ''}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="end">
                  <Text style={{ fontWeight: 600 }}>
                    {pageData.length > 0 &&
                    pageData.every((i) => i.currency === pageData[0].currency)
                      ? Intl.NumberFormat().format(totalAmount)
                      : ''}
                  </Text>
                </Table.Summary.Cell>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Table.Summary.Cell key={i}></Table.Summary.Cell>
                ))}
                <Table.Summary.Cell align="end">
                  <Text style={{ fontWeight: 600 }}>
                    {Intl.NumberFormat().format(totalConversedValue)}
                  </Text>
                </Table.Summary.Cell>
                {Array.from({ length: 7 }).map((_, i) => (
                  <Table.Summary.Cell key={i}></Table.Summary.Cell>
                ))}
              </Table.Summary.Row>
            </>
          )
        }}
      />
      {isModalOpen && (
        <PaymentPlanCreateModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleFetchPaymentPlans={handleFetchPaymentPlans}
        />
      )}
    </>
  )
}
export default PaymentPlan
