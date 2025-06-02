import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Tooltip } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import { Input } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import { MdEdit } from 'react-icons/md'
import { MdDelete } from 'react-icons/md'
import AccessGroupCreateModal from '../../widgets/createAccessGroupModal'

const Setting = () => {
  const [accessGroups, setAccessGroups] = useState([])
  const {
    accessGroups: currrentAccessGroups,
    setAccessGroupState,
    setRightsState,
  } = useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)
  const [loading, setLoading] = useState(false)

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

  const handleFetchAccessGroups = async () => {
    try {
      const { data } = await app.get('/api/get-access-groups')
      const { data: rightList } = await app.get('/api/get-rights')
      setAccessGroups(data.data)
      setAccessGroupState(data.data)
      setRightsState(rightList.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-access-group/${record._id}`)
      const newSources = [...accessGroups].filter((i) => i._id !== record._id)
      setAccessGroups(newSources)
      setAccessGroupState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      width: 100,
      fixed: 'right',
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
          <Tooltip title="Xóa">
            <Button
              color="danger"
              size="small"
              variant="filled"
              icon={<MdDelete />}
              onClick={() => handleDeleteRecord(_)}
            ></Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  useEffect(() => {
    if (currrentAccessGroups.length > 0) setAccessGroups(currrentAccessGroups)
  }, [])

  return (
    <>
      <Space.Compact>
        <Button
          color="primary"
          onClick={() => showModal(true)}
          variant="filled"
          style={{ marginBottom: 16 }}
          icon={<FiPlus />}
        >
          Tạo
        </Button>
      </Space.Compact>
      <Table
        columns={columns}
        dataSource={accessGroups.map((i) => {
          return {
            ...i,
          }
        })}
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
      />
      {isModalOpen && (
        <AccessGroupCreateModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleFetchAccessGroups={handleFetchAccessGroups}
        />
      )}
    </>
  )
}
export default Setting
