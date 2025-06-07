import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Tag, Tooltip, DatePicker } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import { Input, Typography } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import moment from 'moment'
import { MdEdit } from 'react-icons/md'
import { MdDelete } from 'react-icons/md'
import _ from 'lodash'
import { FaCheck } from 'react-icons/fa'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import useCheckRights from '../../utils/checkRights'
import LoanContractCreateModal from '../../widgets/createLoanContractModal'
import { Avatar, List } from 'antd'
import payImg from '../../images/pay.png'
import { FaFileExport } from 'react-icons/fa'
import * as FileSaver from 'file-saver'
import { add7Hours } from '../../utils/plus7Hours'

const { RangePicker } = DatePicker
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)

const LoanContract = () => {
  const [loanContracts, setLoanContracts] = useState([])
  const {
    loanContracts: currentLoanContracts,
    setLoanContractState,
    indentures,
  } = useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)
  const [loading, setLoading] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const [isFilteredDate, setIsFilteredDate] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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

  const handleFetchLoanContracts = async () => {
    try {
      const { data } = await app.get('/api/get-loan-contracts')
      setLoanContracts(data.data)
      setLoanContractState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-loan-contract/${record._id}`)
      const newSources = [...loanContracts].filter((i) => i._id !== record._id)
      setLoanContracts(newSources)
      setLoanContractState(newSources)
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
      await app.patch(`/api/update-loan-contract/${record._id}`, {
        state: 'done',
      })
      const newSources = [...loanContracts].map((i) =>
        i._id === record._id ? { ...i, state: 'done' } : i
      )
      setLoanContracts(newSources)
      setLoanContractState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = (dates) => {
    if (!dates || dates.length === 0) {
      setFilteredData(loanContracts)
      setIsFilteredDate(false)
    } else {
      const [start, end] = dates
      const filtered = loanContracts.filter((item) => {
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
    isFilteredDate ? filteredData : loanContracts

  const handleExportExcel = () => {
    setIsProcessing(true)
    const worker = new Worker(
      new URL('../../workers/exportToExcelFile.worker.js', import.meta.url)
    )
    worker.postMessage({
      data: loanContracts.map((i) => {
        const newDate = add7Hours(i.date)
        const newDueDate = add7Hours(i.dueDate)
        let object = {
          ...i,
          companyId: i.companyId?.name,
          bankId: i.bankId?.name,
          date: newDate,
          dueDate: newDueDate,
          createdAt: add7Hours(i.createdAt),
          updatedAt: add7Hours(i.updatedAt),
        }
        delete object.__v
        return object
      }),
      fileName: 'Dữ liệu hợp đồng vay',
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

  const columns = [
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
      width: 250,
      fixed: 'left',
      ...getColumnSearchProps('company'),
    },
    {
      title: 'Tên hợp đồng',
      dataIndex: 'name',
      key: 'name',
      width: 130,
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Ngân hàng',
      dataIndex: 'bank',
      key: 'bank',
      width: 200,
      ...getColumnSearchProps('bank'),
    },
    {
      title: 'Ngày hợp đồng',
      dataIndex: 'date',
      key: 'date',
      align: 'right',
      width: 150,
      sorter: (a, b) => {
        return dayjs(a.date, 'DD/MM/YYYY') - dayjs(b.date, 'DD/MM/YYYY')
      },
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      align: 'right',
      width: 150,
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
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      width: 130,
      sorter: (a, b) => a.value - b.value,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Tiền tệ',
      dataIndex: 'currency',
      key: 'currency',
      align: 'center',
      width: 100,
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
      width: 100,
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
      width: 150,
      sorter: (a, b) => a.conversedValue - b.conversedValue,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Giá trị vay khả dụng',
      dataIndex: 'remainingValue',
      key: 'remainingValue',
      align: 'right',
      width: 180,
      sorter: (a, b) => a.remainingValue - b.remainingValue,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'state',
      key: 'state',
      align: 'center',
      width: 110,
      filters: [
        {
          text: 'Đang mở',
          value: 'ongoing',
        },
        {
          text: 'Đóng',
          value: 'done',
        },
      ],
      onFilter: (value, record) => record.state === value,
      defaultFilteredValue: ['ongoing'],
      render: (state) => (
        <Tag color={state === 'done' ? 'green' : ''}>
          {state === 'done' ? 'Đóng' : 'Đang mở'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      hidden:
        !checkRights('loanContract', ['write']) &&
        !checkRights('loanContract', ['canDelete']),
      width: 100,
      fixed: 'right',
      render: (_) => (
        <Space size="small">
          {checkRights('loanContract', ['write']) && (
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
          {_.state !== 'done' && checkRights('loanContract', ['write']) && (
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
          {checkRights('loanContract', ['canDelete']) && (
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
    if (currentLoanContracts.length > 0) setLoanContracts(currentLoanContracts)
  }, [])

  return (
    <>
      <Space.Compact>
        {checkRights('loanContract', ['create']) && (
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
      </Space.Compact>
      <Table
        columns={columns}
        expandable={{
          expandedRowRender: (record) => (
            <List
              itemLayout="horizontal"
              dataSource={record.respectiveIndentures}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={payImg} />}
                    title={<span>{item.number}</span>}
                    description={`Giá trị khế ước: ${item.amount
                      .toString()
                      .replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ','
                      )} ${item?.currency?.toUpperCase()} | Ngày đến hạn: ${moment(
                      item.dueDate
                    ).format('DD/MM/YYYY')} | Lãi suất: ${item.interestRate}%`}
                  />
                </List.Item>
              )}
            />
          ),
          rowExpandable: (record) => record.respectiveIndentures.length > 0,
        }}
        dataSource={
          checkRights('loanContract', ['read'])
            ? getFilteredPaymentPlans().map((i) => {
                let remainingValue = i.value
                let respectiveIndentures = indentures.filter(
                  (item) =>
                    item.loanContractId?._id?.toString() === i._id.toString()
                )

                for (const indenture of respectiveIndentures) {
                  remainingValue -= indenture.amount
                }
                return {
                  ...i,
                  bank: i?.bankId?.name,
                  company: i?.companyId?.name,
                  dueDate: moment(i?.dueDate).format('DD/MM/YYYY'),
                  date: moment(i?.date).format('DD/MM/YYYY'),
                  remainingValue,
                  respectiveIndentures,
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
          let totalValue = 0
          let remainingAvailable = 0

          pageData.forEach(({ conversedValue, value, remainingValue }) => {
            totalConversedValue += conversedValue
            totalValue += value
            remainingAvailable += remainingValue
          })

          return (
            <>
              <Table.Summary.Row style={{ background: '#FAFAFA' }}>
                {Array.from({ length: 1 }).map((_, i) => (
                  <Table.Summary.Cell key={i}></Table.Summary.Cell>
                ))}
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
                      ? Intl.NumberFormat().format(totalValue)
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
                <Table.Summary.Cell align="end">
                  <Text style={{ fontWeight: 600 }}>
                    {Intl.NumberFormat().format(remainingAvailable)}
                  </Text>
                </Table.Summary.Cell>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Table.Summary.Cell key={i}></Table.Summary.Cell>
                ))}
              </Table.Summary.Row>
            </>
          )
        }}
      />
      {isModalOpen && (
        <LoanContractCreateModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleFetchLoanContracts={handleFetchLoanContracts}
        />
      )}
    </>
  )
}
export default LoanContract
