import { useState, useEffect } from 'react'
import { Table, Tag } from 'antd'
import { useZustand } from '../../zustand'
import useCheckRights from '../../utils/checkRights'

const Company = () => {
  const [companies, setCompanies] = useState([])
  const checkRights = useCheckRights()
  const { companies: currentCompanies } = useZustand()
  const columns = [
    {
      title: 'Tên công ty',
      dataIndex: 'name',
      key: 'name',
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
  ]

  useEffect(() => {
    if (currentCompanies.length > 0) setCompanies(currentCompanies)
  }, [])
  return (
    <Table
      columns={columns}
      dataSource={checkRights('company', ['read']) ? companies : []}
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
  )
}
export default Company
