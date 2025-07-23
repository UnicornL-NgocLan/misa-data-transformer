import { useState } from 'react'
import { Tabs } from 'antd'
import { Table } from 'antd'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import {
  handleNetOffByGroup,
  getPreProcessedData,
} from '../utils/getNetOffDebts'
import TreeViewDebt from './treeViewDebt'

const InterCompanyFinanceChart = ({ data }) => {
  const [filteredData2, setFilteredData2] = useState([])
  const processData = (raw) => {
    return raw.map((item) => {
      return {
        date: item.date,
        id: item._id,
        subject:
          item.subjectCompanyId?.shortname || item.subjectCompanyId?.name,
        partner:
          item.counterpartCompanyId?.shortname ||
          item.counterpartCompanyId?.name,
        balance: Math.abs(item.debit - item.credit),
        debit: item.debit,
        credit: item.credit,
        type: item.type,
        activityGroup: item.activityGroup,
      }
    })
  }

  const columns = [
    {
      title: 'Công ty nợ',
      dataIndex: 'borrower',
      key: 'borrower',
      sorter: (a, b) => a.borrower - b.borrower,
    },
    {
      title: 'Công ty chủ nợ',
      dataIndex: 'lender',
      key: 'lender',
      sorter: (a, b) => a.lender - b.lender,
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
        <span>
          {state === 'business'
            ? 'Hoạt động kinh doanh'
            : state === 'invest'
            ? 'Hoạt động đầu tư'
            : state === 'finance'
            ? 'Hoạt động tài chính'
            : 'Khác'}
        </span>
      ),
    },
    {
      title: 'Số dư nợ sau cấn trừ (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Số dư nợ trước cấn trừ (VNĐ)',
      dataIndex: 'originalDebtBalance',
      key: 'originalDebtBalance',
      align: 'right',
      sorter: (a, b) => a.originalDebtBalance - b.originalDebtBalance,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Đã cấn trừ (VNĐ)',
      dataIndex: 'diff',
      key: 'diff',
      align: 'right',
      sorter: (a, b) => a.diff - b.diff,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
  ]

  const handleDateFilter2 = (date) => {
    if (!date || date.length === 0) {
      setFilteredData2([])
    } else {
      const filtered = data.filter((item) => {
        const startDay = dayjs(date, 'DD/MM/YYYY')
        const endDay = dayjs(date, 'DD/MM/YYYY')
        const dueDateFormat = dayjs(item.date)
        return dueDateFormat.isBetween(startDay, endDay, 'day', '[]')
      })
      setFilteredData2(handleNetOffByGroup(processData(filtered)))
    }
  }

  const items = [
    {
      key: '1',
      label: 'Biểu đồ cây công nợ',
      children: (
        <>
          <TreeViewDebt raw={processData(data)} />
        </>
      ),
    },
    {
      key: '2',
      label: 'Số cấn trừ chi tiết công nợ',
      children: (
        <>
          <DatePicker
            onChange={handleDateFilter2}
            placeholder="Chọn ngày để lọc"
            style={{ width: 200, marginBottom: 20 }}
          />
          <Table
            columns={columns}
            dataSource={filteredData2.map((i) => {
              const respectiveData = getPreProcessedData(
                processData(data)
              ).find(
                (item) =>
                  item.borrower === i.borrower &&
                  item.lender === i.lender &&
                  item.activityGroup === i.activityGroup
              )
              return {
                ...i,
                originalDebtBalance: respectiveData?.amount,
                diff: respectiveData?.amount - i?.amount,
              }
            })}
          />
        </>
      ),
    },
  ]

  return <Tabs defaultActiveKey="1" items={items} />
}

export default InterCompanyFinanceChart
