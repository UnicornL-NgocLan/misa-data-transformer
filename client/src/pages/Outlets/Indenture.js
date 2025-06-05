import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Tag, Tooltip } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import IndentureCreateModal from '../../widgets/createIndentureModal'
import { Input, Typography } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import moment from 'moment'
import { MdEdit } from 'react-icons/md'
import useCheckRights from '../../utils/checkRights'
import { FaFileExport } from 'react-icons/fa'
import * as FileSaver from 'file-saver'

const Indenture = () => {
  const [indentures, setIndentures] = useState([])
  const { indentures: currentIndentures, setIndentureState } = useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)
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

  const handleFetchIndentures = async () => {
    try {
      const { data } = await app.get('/api/get-indentures')
      setIndentures(data.data)
      setIndentureState(data.data)
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
      data: indentures.map((i) => {
        let object = {
          ...i,
          companyId: i.companyId?.name,
          bankId: i.bankId?.name,
          loanContractId: i.loanContractId?.name,
        }
        delete object.__v
        return object
      }),
      fileName: 'Dữ liệu khế ước',
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
      ...getColumnSearchProps('company'),
    },
    {
      title: 'Ngân hàng',
      dataIndex: 'bank',
      key: 'bank',
      width: 250,
      ...getColumnSearchProps('bank'),
    },
    {
      title: 'Số khế ước',
      dataIndex: 'number',
      key: 'number',
      width: 150,
      fixed: 'left',
      ...getColumnSearchProps('number'),
    },
    {
      title: 'Hợp đồng vay',
      dataIndex: 'loanContract',
      key: 'loanContract',
      width: 150,
      fixed: 'left',
      ...getColumnSearchProps('loanContract'),
    },
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
      title: 'Ngày đến hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      align: 'right',
      width: 130,
      sorter: (a, b) => moment(a.dueDate) - moment(b.dueDate),
      render: (date) => {
        return <span>{moment(date).format('DD/MM/YYYY')}</span>
      },
    },
    {
      title: 'Giá trị',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      width: 130,
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
      render: (state) => <span>{state?.toUpperCase()}</span>,
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
      title: 'Lãi suất',
      dataIndex: 'interestRate',
      key: 'interestRate',
      width: 100,
      sorter: (a, b) => a.interestRate - b.interestRate,
      align: 'right',
    },
    {
      title: 'Giá trị lãi',
      dataIndex: 'interestAmount',
      key: 'interestAmount',
      align: 'right',
      sorter: (a, b) => a.interestAmount - b.interestAmount,
      width: 130,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Còn lại',
      dataIndex: 'residual',
      key: 'residual',
      sorter: (a, b) => a.residual - b.residual,
      align: 'right',
      width: 130,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'state',
      key: 'state',
      width: 100,
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
      render: (state) => (
        <Tag color={state === 'done' ? 'green' : ''}>
          {state === 'done' ? 'Hoàn thành' : 'Chưa xong'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      fixed: 'right',
      hidden: !checkRights('indenture', ['write']),
      width: 100,
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

  useEffect(() => {
    if (currentIndentures.length > 0) setIndentures(currentIndentures)
  }, [])

  return (
    <>
      <Space.Compact>
        {checkRights('indenture', ['create']) && (
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
        dataSource={
          checkRights('indenture', ['read'])
            ? [...indentures].map((i) => {
                return {
                  ...i,
                  bank: i.bankId?.name,
                  company: i.companyId?.name,
                  loanContract: i.loanContractId?.name,
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
        summary={(pageData) => {
          let totalAmount = 0

          pageData.forEach(({ amount }) => {
            totalAmount += amount
          })

          return (
            <>
              <Table.Summary.Row style={{ background: '#FAFAFA' }}>
                <Table.Summary.Cell>
                  <Text style={{ fontWeight: 600 }}>Tổng cộng</Text>
                </Table.Summary.Cell>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Table.Summary.Cell key={i}></Table.Summary.Cell>
                ))}
                <Table.Summary.Cell align="end">
                  <Text style={{ fontWeight: 600 }}>
                    {pageData.length > 0 &&
                    pageData.every((i) => i.currency === pageData[0].currency)
                      ? Intl.NumberFormat().format(totalAmount)
                      : ''}
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
        <IndentureCreateModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleFetchIndentures={handleFetchIndentures}
        />
      )}
    </>
  )
}
export default Indenture
