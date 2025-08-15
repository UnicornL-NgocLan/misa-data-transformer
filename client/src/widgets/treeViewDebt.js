import { useState, useEffect } from 'react'
import { useZustand } from '../zustand'
import { DatePicker, Select, Space, Button, Tooltip, InputNumber } from 'antd'
import { ReactHiererchyChart } from 'react-hierarchy-chart'
import './treeView.css'
import { GiSettingsKnobs } from 'react-icons/gi'
import dayjs from 'dayjs'
import { IoFilterSharp } from 'react-icons/io5'
import { handleNetOffByGroup } from '../utils/getNetOffDebts'

const TreeViewDebt = ({ raw }) => {
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [expectedNumber, setExpectedNumber] = useState(0)
  const [collapsedNodes, setCollapsedNodes] = useState({})
  const [loading, setLoading] = useState(false)
  const { companies } = useZustand()

  const handleSelectCompany = (value) => setSelectedCompany(value)
  const handleSelectDate = (date) => setSelectedDate(date)

  function buildDebtTree(data, rootCompany, collapsedNodes) {
    // 1. Tiền xử lý: tạo map quan hệ và map khoản nợ
    const lenderMap = new Map() // lender => [borrower,...]
    const debtInfoMap = new Map() // key = borrower|lender => { totalAmount, activityGroups }

    for (let i = 0; i < data.length; i++) {
      const d = data[i]

      // Lưu borrower theo lender
      if (!lenderMap.has(d.lender)) {
        lenderMap.set(d.lender, [])
      }
      lenderMap.get(d.lender).push(d.borrower)

      // Lưu thông tin khoản nợ
      const key = `${d.borrower}|${d.lender}`
      if (!debtInfoMap.has(key)) {
        debtInfoMap.set(key, { totalAmount: 0, activityGroups: {} })
      }
      const debtData = debtInfoMap.get(key)
      debtData.totalAmount += d.amount
      debtData.activityGroups[d.activityGroup] =
        (debtData.activityGroups[d.activityGroup] || 0) + d.amount
    }

    // 2. Hàm đệ quy xây node
    function buildNode(company, level, parentCompany = null, path = []) {
      const nodeKey = `${parentCompany || 'ROOT'}->${company}`
      const node = {
        key: nodeKey,
        name: company,
        cssClass: `level${level}`,
        collapsed: collapsedNodes[nodeKey] || false,
      }

      // Nếu có parent, lấy thông tin nợ đã tính sẵn
      if (parentCompany) {
        const key = `${company}|${parentCompany}`
        if (debtInfoMap.has(key)) {
          const { totalAmount, activityGroups } = debtInfoMap.get(key)
          node.totalAmount = totalAmount
          node.activityGroups = activityGroups
        } else {
          node.totalAmount = 0
          node.activityGroups = {}
        }
      }

      // Chặn vòng lặp
      if (path.includes(company)) {
        node.note = 'Circular reference – stopped here'
        return node
      }

      // Lấy children nhanh từ map
      const childrenDebtors = lenderMap.get(company) || []
      const uniqueChildren = [...new Set(childrenDebtors)]
      node.hasChildren = uniqueChildren.length > 0

      if (!node.collapsed && uniqueChildren.length > 0) {
        node.childs = uniqueChildren.map((child) =>
          buildNode(child, level + 1, company, [...path, company])
        )
      }

      return node
    }

    const tree = buildNode(rootCompany, 1)
    return tree ? [tree] : []
  }

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

  const handleGenerateChart = () => {
    if (!selectedCompany) return alert('Vui lòng chọn công ty để xem biểu đồ')
    if (!selectedDate) return alert('Vui lòng chọn ngày để lọc dữ liệu')
    setLoading(true)

    const startDay = dayjs(selectedDate, 'DD/MM/YYYY')
    const endDay = startDay // vì cùng ngày

    // 1. Lọc nhanh không clone mảng
    const filtered = []
    for (let i = 0; i < raw.length; i++) {
      const dueDate = dayjs(raw[i].date)
      if (dueDate.isBetween(startDay, endDay, 'day', '[]')) {
        filtered.push(raw[i])
      }
    }

    // 2. Xử lý dữ liệu
    const processedData = processData(filtered)

    // 3. Index invest-payable để tránh loop lồng nhau
    const investPayableMap = new Map()
    for (let i = 0; i < processedData.length; i++) {
      const row = processedData[i]
      if (row.activityGroup === 'invest' && row.type === 'payable') {
        investPayableMap.set(`${row.partner}_${row.subject}`, row.balance)
      }
    }

    // 4. Cập nhật balance dựa trên index
    for (let i = 0; i < processedData.length; i++) {
      const row = processedData[i]
      if (row.type === 'receivable' && row.activityGroup === 'invest') {
        const key = `${row.subject}_${row.partner}`
        if (investPayableMap.has(key)) {
          row.balance = investPayableMap.get(key)
        }
      }
    }

    // 5. Net off
    const netDebts = handleNetOffByGroup(processedData)
    // 6. Tìm công ty
    const startCompany = companies.find((c) => c._id === selectedCompany)
    if (!startCompany) return alert('Công ty không hợp lệ')
    console.log(netDebts)
    // 7. Build cây nợ
    const debtTree = buildDebtTree(
      netDebts,
      startCompany.shortname,
      collapsedNodes
    )
    console.log(debtTree)
    setFilteredData(debtTree)

    setLoading(false)
  }

  useEffect(() => {
    if (filteredData.length > 0) {
      handleGenerateChart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsedNodes])

  const collapseAll = () => {
    const allKeys = {}
    const traverse = (nodes) => {
      nodes.forEach((n) => {
        allKeys[n.key] = true
        if (n.childs) traverse(n.childs)
      })
    }
    traverse(filteredData)
    setCollapsedNodes(allKeys)
  }

  const expandAll = () => {
    setCollapsedNodes({})
  }

  return (
    <div className="App">
      <Space direction="vertical">
        <Space>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginRight: 10,
              fontWeight: 500,
            }}
          >
            <IoFilterSharp />
            <span>Bộ lọc</span>
          </span>
          <Select
            allowClear
            style={{ width: 200 }}
            onChange={handleSelectCompany}
            options={companies.map((company) => ({
              label: company.shortname,
              value: company._id,
            }))}
            placeholder="Hãy chọn công ty"
          />
          <DatePicker
            onChange={handleSelectDate}
            placeholder="Chọn ngày để lọc"
            style={{ width: 200 }}
          />
          <Button
            color="primary"
            variant="solid"
            onClick={handleGenerateChart}
            loading={loading}
            disabled={loading}
          >
            Xem biểu đồ
          </Button>
        </Space>
        <Space>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginRight: 10,
              fontWeight: 500,
            }}
          >
            <GiSettingsKnobs />
            <span>Tùy chỉnh</span>
          </span>
          <InputNumber
            inputMode="decimal"
            placeholder="Nhập số tiền muốn huy động"
            style={{ width: 220 }}
            onChange={(value) => {
              setExpectedNumber(value)
            }}
            formatter={(value) =>
              value
                ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') // thousands with comma
                : ''
            }
            parser={(value) =>
              value
                ? parseFloat(value.toString().replace(/,/g, '')) // remove commas
                : 0
            }
            min={0}
          />
          <Button onClick={collapseAll}>Thu tất cả</Button>
          <Button onClick={expandAll}>Mở tất cả</Button>
        </Space>
      </Space>

      <div className="hierarchy-viewer">
        <ReactHiererchyChart
          nodes={filteredData}
          direction="horizontal"
          randerNode={(node) => {
            const toggleCollapsed = (e) => {
              e.stopPropagation()
              setCollapsedNodes((prev) => ({
                ...prev,
                [node.key]: !prev[node.key],
              }))
            }

            return (
              <Tooltip
                open={node.totalAmount ? undefined : false}
                title={
                  <div>
                    {node.totalAmount && (
                      <span>
                        Tổng nợ:{' '}
                        {node.totalAmount.toLocaleString('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        })}
                      </span>
                    )}
                    {node.activityGroups && (
                      <ul style={{ margin: 0, paddingRight: 20 }}>
                        {Object.entries(node.activityGroups).map(
                          ([group, amount], index) => (
                            <li key={index} style={{ textAlign: 'left' }}>
                              {group === 'business'
                                ? 'Kinh doanh'
                                : group === 'invest'
                                ? 'Đầu tư'
                                : group === 'finance'
                                ? 'Tài chính'
                                : 'Khác'}
                              :{' '}
                              {amount.toLocaleString('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              })}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                }
              >
                <div className="node-template">
                  <strong>
                    {node.name} {node.note && '🚫'}{' '}
                    {node.totalAmount >= expectedNumber && '✅'}
                  </strong>
                  {node.hasChildren && (
                    <Button size="small" type="text" onClick={toggleCollapsed}>
                      {collapsedNodes[node.key] ? '➕' : '➖'}
                    </Button>
                  )}
                </div>
              </Tooltip>
            )
          }}
        />
      </div>
    </div>
  )
}

export default TreeViewDebt
