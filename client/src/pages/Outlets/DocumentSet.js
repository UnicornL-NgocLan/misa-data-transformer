import { useState, useEffect, useRef } from 'react'
import { Table, Tag, Button, Space } from 'antd'
import { useZustand } from '../../zustand'
import { FiPlus } from 'react-icons/fi'
import DocumentSetCreateModal from '../../widgets/createDocumentSetModal'
import { Input } from 'antd'
import Highlighter from 'react-highlight-words'
import { SearchOutlined } from '@ant-design/icons'
import app from '../../axiosConfig'
import { MdEdit, MdDelete } from 'react-icons/md'
import { Tooltip } from 'antd'
import useCheckRights from '../../utils/checkRights'
import moment from 'moment'

const DocumentSet = () => {
  const [documentSets, setDocumentSets] = useState([])
  const {
    documentSets: currentDocumentSets,
    auth,
    setDocumentSetState,
  } = useZustand()
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

  const handleFetchDocumentSets = async () => {
    try {
      const { data } = await app.get('/api/get-document-sets')
      setDocumentSets(data.data)
      setDocumentSetState(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    }
  }

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa dữ liệu này?')) return
      setLoading(true)
      await app.delete(`/api/delete-document-set/${record._id}`)
      const newSources = [...documentSets].filter((i) => i._id !== record._id)
      setDocumentSets(newSources)
      setDocumentSetState(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
      ...getColumnSearchProps('company'),
    },
    {
      title: 'Tên bộ tài liệu',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ...getColumnSearchProps('description'),
    },
    {
      title: 'Người tạo',
      dataIndex: 'person_creating',
      key: 'person_creating',
      align: 'center',
      ...getColumnSearchProps('person_creating'),
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      sorter: (a, b) => moment(a.createdAt) - moment(b.createdAt),
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_locked',
      key: 'is_locked',
      align: 'center',
      filters: [
        {
          text: 'Mở',
          value: false,
        },
        {
          text: 'Khóa',
          value: true,
        },
      ],
      onFilter: (value, record) => record.is_locked === value,
      render: (text) => (
        <Tag color={text ? 'red' : 'green'}>{text ? 'Khóa' : 'Mở'}</Tag>
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      width: 100,
      hidden:
        !checkRights('document', ['read']) &&
        !checkRights('document', ['write']) &&
        !checkRights('document', ['canDelete']),
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
          {(auth.role === 'admin' ||
            (checkRights('document', ['canDelete']) &&
              _?.created_by?._id === auth?._id)) && (
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
    if (currentDocumentSets.length > 0) setDocumentSets(currentDocumentSets)
  }, [])
  return (
    <>
      {checkRights('document', ['create']) && (
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
          checkRights('document', ['read'])
            ? documentSets
                .filter((i) => auth.companyIds.includes(i.company_id?._id))
                .map((i) => {
                  return {
                    ...i,
                    key: i._id,
                    person_creating: i?.created_by?.name,
                    company: i?.company_id?.name,
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
        <DocumentSetCreateModal
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleFetchDocumentSets={handleFetchDocumentSets}
        />
      )}
    </>
  )
}
export default DocumentSet
