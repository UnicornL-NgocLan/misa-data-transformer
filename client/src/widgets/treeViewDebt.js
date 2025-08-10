import { useState, useEffect } from 'react'
import { useZustand } from '../zustand'
import { DatePicker, Select, Space, Button, Tooltip, InputNumber } from 'antd'
import { ReactHiererchyChart } from 'react-hierarchy-chart'
import './treeView.css'
import { handleNetOffByGroup } from '../utils/getNetOffDebts'
import { GiSettingsKnobs } from 'react-icons/gi'
import dayjs from 'dayjs'
import { IoFilterSharp } from 'react-icons/io5'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

const TreeViewDebt = ({ raw }) => {
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [expectedNumber, setExpectedNumber] = useState(0)
  const [collapsedNodes, setCollapsedNodes] = useState({})
  const { companies } = useZustand()

  const handleSelectCompany = (value) => setSelectedCompany(value)
  const handleSelectDate = (date) => setSelectedDate(date)

  function buildDebtTree(data, rootCompany, collapsedNodes) {
    function buildNode(company, level, parentCompany = null, path = []) {
      const nodeKey = `${parentCompany || 'ROOT'}->${company}`

      const node = {
        key: nodeKey,
        name: company,
        cssClass: `level${level}`,
        collapsed: collapsedNodes[nodeKey] || false,
      }

      if (parentCompany) {
        const debts = data.filter(
          (d) => d.borrower === company && d.lender === parentCompany
        )

        const activityGroups = {}
        let totalAmount = 0
        debts.forEach((d) => {
          totalAmount += d.amount
          activityGroups[d.activityGroup] =
            (activityGroups[d.activityGroup] || 0) + d.amount
        })

        node.totalAmount = totalAmount
        node.activityGroups = activityGroups
      }

      if (path.includes(company)) {
        node.note = 'Circular reference – stopped here'
        return node
      }

      const childrenDebtors = data
        .filter((d) => d.lender === company)
        .map((d) => d.borrower)

      const uniqueChildren = [...new Set(childrenDebtors)]
      node.hasChildren = uniqueChildren.length > 0
      const children = uniqueChildren
        .map((child) =>
          buildNode(child, level + 1, company, [...path, company])
        )
        .filter((child) => child !== null)

      if (!node.collapsed && children.length > 0) {
        node.childs = children
      }

      return node
    }

    const tree = buildNode(rootCompany, 1)
    return tree ? [tree] : []
  }

  const handleGenerateChart = () => {
    if (!selectedCompany) return alert('Vui lòng chọn công ty để xem biểu đồ')
    if (!selectedDate) return alert('Vui lòng chọn ngày để lọc dữ liệu')

    const filtered = raw.filter((item) => {
      const startDay = dayjs(selectedDate, 'DD/MM/YYYY')
      const endDay = dayjs(selectedDate, 'DD/MM/YYYY')
      const dueDateFormat = dayjs(item.date)
      return dueDateFormat.isBetween(startDay, endDay, 'day', '[]')
    })

    let processedData = [...filtered]
    let investedData = filtered.filter(
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

    const netDebts = handleNetOffByGroup(processedData)
    const startCompany = companies.find(
      (company) => company._id === selectedCompany
    )
    if (!startCompany) return alert('Công ty không hợp lệ')

    const debtTree = buildDebtTree(
      netDebts,
      startCompany.shortname,
      collapsedNodes
    )
    setFilteredData(debtTree)
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
          <Button color="primary" variant="solid" onClick={handleGenerateChart}>
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
        <div style={{ height: '80vh', border: '1px solid #ddd' }}>
          <TransformWrapper
            centerOnInit
            minScale={0.1}
            maxScale={2}
            wheel={{ disabled: false }}
            doubleClick={{ disabled: false }}
            panning={{ disabled: false }}
          >
            <>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
              >
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
                                    <li
                                      key={index}
                                      style={{ textAlign: 'left' }}
                                    >
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
                            <Button
                              size="small"
                              type="text"
                              onClick={toggleCollapsed}
                              style={{ marginLeft: 6 }}
                            >
                              {collapsedNodes[node.key] ? '➕' : '➖'}
                            </Button>
                          )}
                        </div>
                      </Tooltip>
                    )
                  }}
                />
              </TransformComponent>
            </>
          </TransformWrapper>
        </div>
      </div>
    </div>
  )
}

export default TreeViewDebt
