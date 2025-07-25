import { useState, useEffect, useRef } from 'react'
import { Space, Table, Tag } from 'antd'
import { Button, Input } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import { useZustand } from '../../zustand'
import UpdateRoleModal from '../../widgets/updateRoleModal'
import { sysmtemUserRole } from '../../globalVariables'
import CreateUserModal from '../../widgets/createUserModal'
import { FiPlus } from 'react-icons/fi'
import useCheckRights from '../../utils/checkRights'
import { MdEdit } from 'react-icons/md'
import { Tooltip } from 'antd'

const User = () => {
  const { auth } = useZustand()
  const [users, setUsers] = useState([])
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)
  const { users: currentUsers, setUserState } = useZustand()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalCreateUserOpen, setIsModalCreateUserOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const checkRights = useCheckRights()

  const handleSetActiveUser = async (user, activeState) => {
    try {
      if (loading) return
      if (!activeState) {
        let confirm = false
        confirm = window.confirm(
          'Tài khoản bị vô hiệu sẽ không thể đăng nhập và thao tác bất kỳ dữ liệu nào! Bạn có muốn tiếp tục?'
        )
        if (!confirm) return
      }

      setLoading(true)
      await app.patch(`/api/update-user/${user._id}`, {
        active: activeState,
      })
      await handleFetchUsers()
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const showModal = (user) => {
    setIsModalOpen(user)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handleUpdateRole = async (role, userId, companyIds) => {
    try {
      if (loading) return
      setLoading(true)
      await app.patch(`/api/update-user/${userId}`, { role, companyIds })
      await handleFetchUsers()
      handleCancel()
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

  const columns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      width: 300,
      ...getColumnSearchProps('username'),
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Đang hoạt động',
      dataIndex: 'active',
      align: 'center',
      key: 'active',
      width: 150,
      filters: [
        {
          text: 'Khả dụng',
          value: true,
        },
        {
          text: 'Bị vô hiệu',
          value: false,
        },
      ],
      onFilter: (value, record) => record.active === value,
      render: (active) => (
        <Tag color={active ? 'green' : 'volcano'}>
          {active ? 'Khả dụng' : 'Bị vô hiệu'}
        </Tag>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      align: 'center',
      key: 'role',
      width: 150,
      ...getColumnSearchProps('role'),
      render: (role) => (
        <Tag
          color={
            role === sysmtemUserRole.admin
              ? 'green'
              : role === sysmtemUserRole.manager
              ? 'blue'
              : ''
          }
        >
          {role === 'basic'
            ? 'Cơ bản'
            : role === sysmtemUserRole.manager
            ? 'Quản lý'
            : 'Quản trị viên'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      width: 150,
      hidden: !checkRights('user', ['write']),
      key: 'action',
      render: (_) => (
        <Space size="middle">
          <Tooltip title="Chỉnh quyền">
            <Button
              color="default"
              variant="outlined"
              size="small"
              icon={<MdEdit />}
              onClick={() => showModal(_)}
            ></Button>
          </Tooltip>
          {_.active ? (
            <Button
              color="danger"
              variant="filled"
              size="small"
              onClick={() => handleSetActiveUser(_, false)}
            >
              Vô hiệu
            </Button>
          ) : (
            <Button
              color="primary"
              variant="filled"
              size="small"
              onClick={() => handleSetActiveUser(_, true)}
            >
              Kích hoạt
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleFetchUsers = async () => {
    try {
      const {
        data: { data },
      } = await app.get(`/api/get-users`)
      setUserState(data)
      setUsers(data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  useEffect(() => {
    if (currentUsers.length > 0) return setUsers(currentUsers)
    handleFetchUsers()
  }, [])
  return (
    <>
      {checkRights('user', ['create']) && (
        <Button
          color="primary"
          onClick={() => setIsModalCreateUserOpen(true)}
          variant="filled"
          style={{ marginBottom: 16 }}
          icon={<FiPlus />}
        >
          Tạo
        </Button>
      )}
      <Table
        columns={columns}
        dataSource={checkRights('user', ['read']) ? users : []}
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
      {isModalOpen && checkRights('user', ['write']) && (
        <UpdateRoleModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleUpdateRole={handleUpdateRole}
          loading={loading}
        />
      )}
      {isModalCreateUserOpen && checkRights('user', ['create']) && (
        <CreateUserModal
          handleCancel={() => setIsModalCreateUserOpen(false)}
          isModalOpen={isModalCreateUserOpen}
          loading={loading}
          handleFetchUsers={handleFetchUsers}
        />
      )}
    </>
  )
}
export default User
