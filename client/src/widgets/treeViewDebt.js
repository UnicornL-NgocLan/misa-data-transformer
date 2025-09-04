import { useState, useCallback } from 'react'
import { useZustand } from '../zustand'
import { DatePicker, Select, Space, Button, Tooltip, InputNumber } from 'antd'
import dayjs from 'dayjs'
import { GiSettingsKnobs } from 'react-icons/gi'
import { IoFilterSharp } from 'react-icons/io5'
import { handleNetOffByGroup } from '../utils/getNetOffDebts'
import { ReactHiererchyChart } from 'react-hierarchy-chart'
import './treeView.css'

const TreeViewDebt = ({ raw }) => {
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [expectedNumber, setExpectedNumber] = useState(0)
  const [collapsedNodes, setCollapsedNodes] = useState({})
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(false)
  const { companies } = useZustand()

  const handleSelectCompany = (value) => setSelectedCompany(value)
  const handleSelectDate = (date) => setSelectedDate(date)

  const MAX_NODE_LEVEL = 5

  // --------------------- Process raw data ---------------------
  const processData = (raw) => {
    const processedMap = new Map()
    const dateCache = new Map()

    for (let i = 0; i < raw.length; i++) {
      const item = raw[i]
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

    dateCache.clear()
    const finalResult = Array.from(processedMap.values()).map((item) => ({
      date: item.date,
      subject: item.subjectCompanyId?.shortname || item.subjectCompanyId?.name,
      partner:
        item.counterpartCompanyId?.shortname || item.counterpartCompanyId?.name,
      balance: Math.abs(item.balance),
      type: item.type,
      activityGroup: item.activityGroup,
    }))
    return finalResult
  }
  // --------------------- Build tree ---------------------
  const buildDebtTree = useCallback(
    (data, rootCompany, collapsedNodesParam) => {
      const lenderMap = new Map()
      const debtInfoMap = new Map()

      for (let d of data) {
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

      const traverse = (company, level = 1, parent = null, path = []) => {
        if (level > MAX_NODE_LEVEL) return null // Dừng ở level 4

        const nodeKey = `${parent || 'ROOT'}->${company}`
        const node = {
          key: nodeKey,
          name: company,
          level,
          cssClass: `level${level}`,
          collapsed: collapsedNodesParam[nodeKey] || false,
          hasHiddenChildren: false,
        }

        if (parent) {
          const key = `${company}|${parent}`
          if (debtInfoMap.has(key)) {
            const { totalAmount, activityGroups } = debtInfoMap.get(key)
            node.totalAmount = totalAmount
            node.activityGroups = activityGroups
          } else {
            node.totalAmount = 0
            node.activityGroups = {}
          }
        }

        if (path.includes(company)) {
          node.note = 'Circular reference – stopped here'
          return node
        }

        const children = [...new Set(lenderMap.get(company) || [])]
        node.hasChildren = children.length > 0

        if (level === MAX_NODE_LEVEL && node.hasChildren) {
          node.hasHiddenChildren = true
          return node
        }

        if (!node.collapsed && children.length > 0) {
          node.childs = children
            .map((child) =>
              traverse(child, level + 1, company, [...path, company])
            )
            .filter(Boolean) // loại bỏ null do vượt level 4
        }

        return node
      }

      return [traverse(rootCompany)]
    },
    []
  )

  // --------------------- Generate Chart ---------------------
  const handleGenerateChart = useCallback(
    (collapsed = collapsedNodes) => {
      if (!selectedCompany) return alert('Vui lòng chọn công ty')
      if (!selectedDate) return alert('Vui lòng chọn ngày')
      setLoading(true)

      const startDay = dayjs(selectedDate, 'DD/MM/YYYY')
      const endDay = startDay

      const filtered = raw.filter((r) =>
        dayjs(r.date).isBetween(startDay, endDay, 'day', '[]')
      )

      const removedInvestingData = filtered.filter(
        (item) => item.type !== 'investing'
      )
      let processedData = processData(removedInvestingData)
      // Index invest-payable
      const investPayableMap = new Map()
      for (let row of processedData) {
        if (row.activityGroup === 'invest' && row.type === 'investing')
          investPayableMap.set(`${row.partner}_${row.subject}`, row.balance)
      }
      for (let row of processedData) {
        if (
          row.activityGroup === 'invest' &&
          row.type === 'investing_receivable'
        ) {
          const key = `${row.subject}_${row.partner}`
          if (investPayableMap.has(key)) row.balance = investPayableMap.get(key)
        }
      }

      const netDebts = handleNetOffByGroup(processedData)
      const startCompanyObj = companies.find((c) => c._id === selectedCompany)
      if (!startCompanyObj) return

      const tree = buildDebtTree(netDebts, startCompanyObj.shortname, collapsed)
      setFilteredData(tree)
      setLoading(false)
    },
    [
      selectedCompany,
      selectedDate,
      raw,
      processData,
      companies,
      buildDebtTree,
      collapsedNodes,
    ]
  )

  const toggleNode = useCallback(
    (key) => {
      const nextCollapsed = { ...collapsedNodes, [key]: !collapsedNodes[key] }
      setCollapsedNodes(nextCollapsed)
      handleGenerateChart(nextCollapsed)
    },
    [collapsedNodes, handleGenerateChart]
  )

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
    handleGenerateChart(allKeys)
  }

  const expandAll = () => {
    setCollapsedNodes({})
    handleGenerateChart({})
  }

  // --------------------- Render Node ---------------------
  const renderNode = (node) => {
    const toggle = (e) => {
      e.stopPropagation()
      toggleNode(node.key)
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
            {node.totalAmount >= expectedNumber && '✅'}{' '}
            {node.hasHiddenChildren && '❌'}
          </strong>
          {node.hasChildren && (
            <Button size="small" type="text" onClick={toggle}>
              {node.collapsed ? '➕' : '➖'}
            </Button>
          )}
        </div>
      </Tooltip>
    )
  }

  return (
    <div className="App">
      <Space direction="vertical">
        <Space>
          <IoFilterSharp />
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
            placeholder="Chọn ngày để lọc"
            style={{ width: 200 }}
          />
          <Button onClick={() => handleGenerateChart()} loading={loading}>
            Xem biểu đồ
          </Button>
        </Space>
        <Space>
          <GiSettingsKnobs />
          <InputNumber
            placeholder="Nhập số tiền muốn huy động"
            style={{ width: 220 }}
            value={expectedNumber}
            onChange={setExpectedNumber}
          />
          <Button onClick={collapseAll}>Thu tất cả</Button>
          <Button onClick={expandAll}>Mở tất cả</Button>
        </Space>
      </Space>

      <div className="hierarchy-viewer">
        <ReactHiererchyChart
          nodes={filteredData}
          direction="horizontal"
          randerNode={renderNode}
        />
      </div>
    </div>
  )
}

export default TreeViewDebt
