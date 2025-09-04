import { useState, useEffect, useRef, useCallback } from 'react'
import { Table, Tag, Button, Space } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import { Input } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import { MdEdit, MdDelete } from 'react-icons/md'
import { Tooltip } from 'antd'
import useCheckRights from '../../utils/checkRights'
import AccountCreateModal from '../../widgets/createAccountModal'

const Account = () => {
  const [accounts, setAccounts] = useState([])
  const { accounts: currentAccounts, setAccountState } = useZustand()
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

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-account/${record._id}`)
      const newSources = [...accounts].filter((i) => i._id !== record._id)
      setAccounts(newSources)
      setAccountState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
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

  const handleFetchAccounts = async () => {
    try {
      const { data } = await app.get('/api/get-accounts')
      setAccounts(data.data)
      setAccountState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const columns = [
    {
      title: 'Tên tài khoản',
      dataIndex: 'code',
      key: 'code',
      ...getColumnSearchProps('code'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      align: 'center',
      key: 'type',
      width: 150,
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
      title: 'Hành động',
      align: 'center',
      key: 'action',
      width: 150,
      hidden:
        !checkRights('account', ['write']) &&
        !checkRights('account', ['canDelete']),
      render: (_) => (
        <Space size="middle">
          {checkRights('account', ['write']) && (
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
          {checkRights('account', ['canDelete']) && (
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
    if (currentAccounts.length > 0) setAccounts(currentAccounts)
  }, [])
  return (
    <>
      {checkRights('account', ['create']) && (
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
        dataSource={checkRights('account', ['read']) ? accounts : []}
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
        <AccountCreateModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleFetchAccounts={handleFetchAccounts}
        />
      )}
    </>
  )
}
export default Account
