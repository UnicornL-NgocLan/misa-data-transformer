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
    const processedMap = new Map()
    const dateCache = new Map() // cache format date tránh tạo dayjs nhiều lần

    for (let i = 0; i < raw.length; i++) {
      const item = raw[i]

      // cache ngày
      let dateKey = dateCache.get(item.date)
      if (!dateKey) {
        dateKey = dayjs(item.date).add(7, 'hour').format('YYYY-MM-DD')
        dateCache.set(item.date, dateKey)
      }

      const subjectId = item.subjectCompanyId?._id || ''
      const counterpartId = item.counterpartCompanyId?._id || ''
      const key = `${subjectId}_${counterpartId}_${item.type}_${item.activityGroup}_${dateKey}`

      if (processedMap.has(key)) {
        processedMap.get(key).balance += item.debit - item.credit
      } else {
        // Không spread toàn bộ item, chỉ lấy field cần thiết
        processedMap.set(key, {
          date: item.date,
          subjectCompanyId: item.subjectCompanyId,
          counterpartCompanyId: item.counterpartCompanyId,
          type: item.type,
          activityGroup: item.activityGroup,
          balance: item.debit - item.credit,
        })
      }
    }

    dateCache.clear() // giải phóng cache

    // Trả về dữ liệu gọn nhẹ
    return Array.from(processedMap.values()).map((item) => ({
      date: item.date,
      subject: item.subjectCompanyId?.shortname || item.subjectCompanyId?.name,
      partner:
        item.counterpartCompanyId?.shortname || item.counterpartCompanyId?.name,
      balance: Math.abs(item.balance),
      type: item.type,
      activityGroup: item.activityGroup,
    }))
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
      return
    }

    const startDay = dayjs(date, 'DD/MM/YYYY')
    const endDay = startDay // cùng ngày nên chỉ cần 1 biến

    // 1. Lọc dữ liệu
    const filtered = []
    for (let i = 0; i < data.length; i++) {
      const dueDate = dayjs(data[i].date)
      if (dueDate.isBetween(startDay, endDay, 'day', '[]')) {
        filtered.push(data[i])
      }
    }

    // 2. Xử lý dữ liệu
    const processedData = processData(filtered)

    // 3. Duyệt 1 lần để vừa tìm investedData vừa cập nhật balance
    const investedMap = new Map()
    for (let i = 0; i < processedData.length; i++) {
      const item = processedData[i]
      if (item.activityGroup === 'invest' && item.type === 'payable') {
        investedMap.set(`${item.subject}-${item.partner}`, item.balance)
      }
    }

    for (let i = 0; i < processedData.length; i++) {
      const item = processedData[i]
      if (item.type === 'receivable' && item.activityGroup === 'invest') {
        const key = `${item.partner}-${item.subject}`
        if (investedMap.has(key)) {
          processedData[i] = { ...item, balance: investedMap.get(key) }
        }
      }
    }

    // 4. Net off và set state
    setFilteredData2(handleNetOffByGroup(processedData))
  }

  const items = [
    {
      key: '1',
      label: 'Biểu đồ cây công nợ',
      children: (
        <>
          <TreeViewDebt raw={data} />
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
              const filteredData = processData(data)
              // Để xử lý trường hợp đầu tư
              let processedData = [...filteredData]
              let investedData = filteredData.filter(
                (i) => i.activityGroup === 'invest' && i.type === 'payable'
              )

              investedData.forEach((i) => {
                processedData = processedData.map((item) => {
                  const { activityGroup, partner, subject, type } = item
                  if (
                    type === 'receivable' &&
                    activityGroup === 'invest' &&
                    partner === i.subject &&
                    subject === i.partner
                  ) {
                    return { ...item, balance: i.balance }
                  } else {
                    return item
                  }
                })
              })
              const respectiveData = getPreProcessedData(processedData).find(
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
