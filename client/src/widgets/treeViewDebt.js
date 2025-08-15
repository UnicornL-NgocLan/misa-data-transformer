import { useState, useMemo } from 'react'
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
  const [selectedDate, setSelectedDate] = useState(null)
  const [expectedNumber, setExpectedNumber] = useState(0)
  const [collapsedNodes, setCollapsedNodes] = useState({})
  const { companies } = useZustand()

  const handleSelectCompany = (value) => setSelectedCompany(value)
  const handleSelectDate = (date) => setSelectedDate(date)

  // Memoized processed data
  const processedData = useMemo(() => {
    if (!selectedDate) return []

    const startDay = dayjs(selectedDate, 'DD/MM/YYYY')
    const dateCache = new Map()
    const map = new Map()

    for (let i = 0; i < raw.length; i++) {
      const item = raw[i]
      const dateKey =
        dateCache.get(item.date) ||
        dayjs(item.date).add(7, 'hour').format('YYYY-MM-DD')
      dateCache.set(item.date, dateKey)

      const key = `${item.subjectCompanyId?._id || ''}_${
        item.counterpartCompanyId?._id || ''
      }_${item.type}_${item.activityGroup}_${dateKey}`

      if (map.has(key)) {
        map.get(key).balance += item.debit - item.credit
      } else {
        map.set(key, {
          date: item.date,
          subject: item.subjectCompanyId,
          partner: item.counterpartCompanyId,
          type: item.type,
          activityGroup: item.activityGroup,
          balance: item.debit - item.credit,
        })
      }
    }

    return Array.from(map.values()).map((item) => ({
      date: item.date,
      subject: item.subject?.shortname || item.subject?.name,
      partner: item.partner?.shortname || item.partner?.name,
      type: item.type,
      activityGroup: item.activityGroup,
      balance: Math.abs(item.balance),
    }))
  }, [raw, selectedDate])

  // Memoized netDebts
  const netDebts = useMemo(() => {
    if (!processedData.length) return []
    const investMap = new Map()

    // Index invest-payable
    for (let i = 0; i < processedData.length; i++) {
      const row = processedData[i]
      if (row.activityGroup === 'invest' && row.type === 'payable') {
        investMap.set(`${row.partner}_${row.subject}`, row.balance)
      }
    }

    // Update receivable
    for (let i = 0; i < processedData.length; i++) {
      const row = processedData[i]
      if (row.activityGroup === 'invest' && row.type === 'receivable') {
        const key = `${row.subject}_${row.partner}`
        if (investMap.has(key)) {
          row.balance = investMap.get(key)
        }
      }
    }

    return handleNetOffByGroup(processedData)
  }, [processedData])

  // Memoized debt tree
  const debtTree = useMemo(() => {
    if (!netDebts.length || !selectedCompany) return []

    const startCompany = companies.find((c) => c._id === selectedCompany)
    if (!startCompany) return []

    // Build Map for fast lookup
    const lenderMap = new Map()
    const debtInfoMap = new Map()
    for (let d of netDebts) {
      if (!lenderMap.has(d.lender)) lenderMap.set(d.lender, [])
      lenderMap.get(d.lender).push(d.borrower)

      const key = `${d.borrower}|${d.lender}`
      if (!debtInfoMap.has(key))
        debtInfoMap.set(key, { totalAmount: 0, activityGroups: {} })
      const debtData = debtInfoMap.get(key)
      debtData.totalAmount += d.amount
      debtData.activityGroups[d.activityGroup] =
        (debtData.activityGroups[d.activityGroup] || 0) + d.amount
    }

    const buildNode = (company, level = 1, parent = null, path = []) => {
      const nodeKey = `${parent || 'ROOT'}->${company}`
      const node = {
        key: nodeKey,
        name: company,
        cssClass: `level${level}`,
        collapsed: collapsedNodes[nodeKey] || false,
      }

      if (parent) {
        const key = `${company}|${parent}`
        if (debtInfoMap.has(key)) {
          const { totalAmount, activityGroups } = debtInfoMap.get(key)
          node.totalAmount = totalAmount
          node.activityGroups = activityGroups
        }
      }

      if (path.includes(company)) {
        node.note = 'Circular reference – stopped here'
        return node
      }

      const children = [...new Set(lenderMap.get(company) || [])]
      node.hasChildren = children.length > 0
      if (!node.collapsed && children.length) {
        node.childs = children.map((c) =>
          buildNode(c, level + 1, company, [...path, company])
        )
      }

      return node
    }

    return [buildNode(startCompany.shortname)]
  }, [netDebts, selectedCompany, collapsedNodes, companies])

  const collapseAll = () => {
    const allKeys = {}
    const traverse = (nodes) => {
      nodes.forEach((n) => {
        allKeys[n.key] = true
        if (n.childs) traverse(n.childs)
      })
    }
    traverse(debtTree)
    setCollapsedNodes(allKeys)
  }

  const expandAll = () => setCollapsedNodes({})

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
            <IoFilterSharp /> <span>Bộ lọc</span>
          </span>
          <Select
            allowClear
            style={{ width: 200 }}
            onChange={handleSelectCompany}
            options={companies.map((c) => ({
              label: c.shortname,
              value: c._id,
            }))}
            placeholder="Hãy chọn công ty"
          />
          <DatePicker
            onChange={handleSelectDate}
            placeholder="Chọn ngày"
            style={{ width: 200 }}
          />
        </Space>
        <Space>
          <GiSettingsKnobs />
          <InputNumber
            style={{ width: 220 }}
            placeholder="Nhập số tiền muốn huy động"
            min={0}
            onChange={(v) => setExpectedNumber(v)}
            formatter={(v) =>
              v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
            }
            parser={(v) => (v ? parseFloat(v.toString().replace(/,/g, '')) : 0)}
          />
          <Button onClick={collapseAll}>Thu tất cả</Button>
          <Button onClick={expandAll}>Mở tất cả</Button>
        </Space>
      </Space>

      <div className="hierarchy-viewer">
        <ReactHiererchyChart
          nodes={debtTree}
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
                    {node.totalAmount > 0 && (
                      <span>
                        Tổng nợ:{' '}
                        {node.totalAmount.toLocaleString('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        })}
                      </span>
                    )}
                    {node.activityGroups &&
                      Object.keys(node.activityGroups).length > 0 && (
                        <ul style={{ margin: 0, paddingRight: 20 }}>
                          {Object.entries(node.activityGroups).map(
                            ([group, amount]) => (
                              <li key={group} style={{ textAlign: 'left' }}>
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
                      {node.collapsed ? '➕' : '➖'}
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
