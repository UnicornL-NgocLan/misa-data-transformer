import { useState, useEffect, useRef } from 'react'
import { Table, Tag, Button, Space } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import BankCreateModal from '../../widgets/createBankModal'
import { Input } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import { MdEdit } from 'react-icons/md'
import { MdDelete } from 'react-icons/md'
import { Tooltip } from 'antd'
import useCheckRights from '../../utils/checkRights'
import MoneyFlowReasonCreateModal from '../../widgets/createMoneyFlowReason'

const MoneyFlowReason = () => {
  const [moneyFlowReasons, setMoneyFlowReasons] = useState([])
  const { moneyFlowReasons: currentMoneyFlowReasons, setMoneyFlowReasonState } =
    useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)
  const [loading, setLoading] = useState(false)
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

  const handleFetchMoneyFlowReason = async () => {
    try {
      const { data } = await app.get('/api/get-money-flow-reasons')
      setMoneyFlowReasons(data.data)
      setMoneyFlowReasonState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-money-flow-reason/${record._id}`)
      const newSources = [...moneyFlowReasons].filter(
        (i) => i._id !== record._id
      )
      setMoneyFlowReasons(newSources)
      setMoneyFlowReasonState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Tên mục đích',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      align: 'center',
      key: 'type',
      width: 150,
      filters: [
        {
          text: 'Thu',
          value: 'receivable',
        },
        {
          text: 'Chi',
          value: 'payable',
        },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <Tag color={type === 'receivable' ? 'green' : 'volcano'}>
          {type === 'receivable' ? 'Thu' : 'Chi'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      width: 150,
      hidden:
        !checkRights('moneyFlowReason', ['write']) &&
        !checkRights('moneyFlowReason', ['canDelete']),
      render: (_) => (
        <Space size="middle">
          {checkRights('moneyFlowReason', ['write']) && (
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
          {checkRights('moneyFlowReason', ['canDelete']) && (
            <Tooltip title="Xóa">
              <Button
                color="danger"
                variant="outlined"
                size="small"
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
    if (currentMoneyFlowReasons.length > 0)
      setMoneyFlowReasons(currentMoneyFlowReasons)
  }, [])
  return (
    <>
      {checkRights('moneyFlowReason', ['create']) && (
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
          checkRights('moneyFlowReason', ['read']) ? moneyFlowReasons : []
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
        <MoneyFlowReasonCreateModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleFetchMoneyFlowReason={handleFetchMoneyFlowReason}
        />
      )}
    </>
  )
}
export default MoneyFlowReason
