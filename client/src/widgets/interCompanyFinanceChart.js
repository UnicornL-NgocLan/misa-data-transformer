import { useEffect, useState } from 'react'
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
  const [filteredData, setFilteredData] = useState([])
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

  const diffNotingColumns = [
    {
      title: 'Công ty A',
      dataIndex: 'subjectA',
      key: 'subjectA',
      sorter: (a, b) => a.subjectA - b.subjectA,
    },
    {
      title: 'Tài khoản A',
      dataIndex: 'accountA',
      key: 'accountA',
      sorter: (a, b) => a.accountA - b.accountA,
    },
    {
      title: 'Giá trị A (VNĐ)',
      dataIndex: 'balanceA',
      key: 'balanceA',
      align: 'right',
      sorter: (a, b) => a.balanceA - b.balanceA,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Công ty B',
      dataIndex: 'subjectB',
      key: 'subjectB',
      sorter: (a, b) => a.subjectB - b.subjectB,
    },
    {
      title: 'Tài khoản B',
      dataIndex: 'accountB',
      key: 'accountB',
      sorter: (a, b) => a.accountB - b.accountB,
    },
    {
      title: 'Giá trị B (VNĐ)',
      dataIndex: 'balanceB',
      key: 'balanceB',
      align: 'right',
      sorter: (a, b) => a.balanceB - b.balanceB,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
    },
    {
      title: 'Phần chênh lệch (VNĐ)',
      dataIndex: 'delta',
      key: 'delta',
      align: 'right',
      sorter: (a, b) => a.delta - b.delta,
      render: (value) => {
        return <span>{Intl.NumberFormat().format(value)}</span>
      },
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
  ]

  function findDebtDiscrepancies(debts) {
    const discrepancies = []
    const used = new Set()

    debts.forEach((entry) => {
      const { id, subject, partner, balance, type, activityGroup } = entry

      // Tạo khóa tìm kiếm ngược
      const counterpartKey = `${partner}|${subject}|${activityGroup}|${
        type === 'payable' ? 'receivable' : 'payable'
      }`

      // Bỏ qua nếu đã xét cặp này
      const currentKey = `${subject}|${partner}|${activityGroup}|${type}`
      if (used.has(currentKey) || used.has(counterpartKey)) return

      // Tìm counterpart
      const counterpart = debts.find(
        (e) =>
          e.subject === partner &&
          e.partner === subject &&
          e.activityGroup === activityGroup &&
          e.type !== type
      )

      if (!counterpart) {
        discrepancies.push({
          subjectA: subject,
          subjectB: partner,
          activityGroup,
          balanceA: balance,
          balanceB: 0,
          delta: balance,
          idA: id,
          idB: null,
        })
      } else if (balance !== counterpart.balance) {
        discrepancies.push({
          subjectA: subject,
          subjectB: partner,
          activityGroup,
          balanceA: balance,
          balanceB: counterpart.balance,
          delta: Math.abs(balance - counterpart.balance),
          idA: id,
          idB: counterpart.id,
        })
      }

      // Đánh dấu đã xét
      used.add(currentKey)
      used.add(counterpartKey)
    })

    return discrepancies
  }

  const detailDebts = handleNetOffByGroup(processData(data))
  const diffDebts = findDebtDiscrepancies(processData(data))

  const handleDateFilter = (date) => {
    if (!date || date.length === 0) {
      setFilteredData(diffDebts)
    } else {
      const filtered = data.filter((item) => {
        const startDay = dayjs(date, 'DD/MM/YYYY')
        const endDay = dayjs(date, 'DD/MM/YYYY')
        const dueDateFormat = dayjs(item.date)
        return dueDateFormat.isBetween(startDay, endDay, 'day', '[]')
      })
      setFilteredData(findDebtDiscrepancies(processData(filtered)))
    }
  }

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

  useEffect(() => {
    setFilteredData(diffDebts)
  }, [data])

  const items = [
    {
      key: '1',
      label: 'Đối chiếu công nợ bị lệch',
      children: (
        <>
          <DatePicker
            onChange={handleDateFilter}
            placeholder="Chọn ngày để lọc"
            style={{ width: 200, marginBottom: 20 }}
          />
          <Table
            columns={diffNotingColumns}
            dataSource={filteredData.map((i) => {
              return {
                ...i,
                accountA: data.find((item) => item._id === i.idA)?.account,
                accountB: data.find((item) => item._id === i.idB)?.account,
              }
            })}
          />
        </>
      ),
    },
    // {
    //   key: '3',
    //   label: 'Biểu đồ ma trận công nợ',
    //   children: (
    //     <>
    //       <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
    //         {[
    //           { label: 'Hoạt động kinh doanh', color: '#cceeefff' },
    //           { label: 'Hoạt động đầu tư', color: '#ffd54f' },
    //           {
    //             label: 'Hoạt động tài chính',
    //             color: '#e792b0ff',
    //           },
    //           { label: 'Khác', color: '#ff7043' },
    //         ].map((i, idx) => (
    //           <div
    //             key={idx}
    //             style={{ display: 'flex', gap: 5, alignItems: 'center' }}
    //           >
    //             <div
    //               style={{ width: '2rem', height: '1rem', background: i.color }}
    //             ></div>
    //             <div>{i.label}</div>
    //           </div>
    //         ))}
    //       </div>
    //       <HeatmapDebt raw={processData(data)} />
    //     </>
    //   ),
    // },
    {
      key: '4',
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
                originalDebtBalance: respectiveData.amount,
                diff: respectiveData.amount - i.amount,
              }
            })}
          />
        </>
      ),
    },
  ]

  return <Tabs defaultActiveKey="0" items={items} />
}

export default InterCompanyFinanceChart
