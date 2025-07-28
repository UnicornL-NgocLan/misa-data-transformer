import { useEffect, useState } from 'react'
import { useZustand } from '../zustand'
import { DatePicker, Select, Space, Button } from 'antd'
import { ReactHiererchyChart } from 'react-hierarchy-chart'
import './treeView.css'
import { handleNetOffByGroup } from '../utils/getNetOffDebts'
import dayjs from 'dayjs'

const nodes = [
  {
    key: '122',
    name: 'Caleb Matthews',
    cssClass: 'level1',
    childs: [
      {
        key: '132',
        name: 'Antonia Sancho',
        cssClass: 'level2',
      },
      {
        key: '123',
        name: 'Thoms Hilty',
        cssClass: 'level2',
        childs: [
          {
            key: '124',
            name: 'Eyal Matthews',
            cssClass: 'level3',
          },
          {
            key: '125',
            name: 'Adam Mark',
            cssClass: 'level3',
          },
        ],
      },
      {
        key: '162',
        name: 'Barry Roy',
        cssClass: 'level2',
        childs: [
          {
            key: '127',
            name: 'Ligia Opera',
            cssClass: 'level3',
          },
          {
            key: '128',
            name: 'Moran Perry',
            cssClass: 'level3',
          },
        ],
      },
    ],
  },
]

const TreeViewDebt = ({ raw }) => {
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const { companies } = useZustand()

  const handleSelectCompany = (value) => {
    setSelectedCompany(value)
  }

  const handleSelectDate = (date) => {
    setSelectedDate(date)
  }

  function buildDebtTree(data, rootCompany) {
    function buildNode(company, level, parentCompany = null, path = []) {
      const node = {
        key: `${company}_${Math.random().toString(36).substr(2, 9)}`,
        name: company,
        cssClass: `level${level}`,
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

      // Nếu đã thấy trong nhánh hiện tại, chỉ tạo node, KHÔNG thêm con
      if (path.includes(company)) {
        node.note = 'Circular reference – stopped here'
        return node
      }

      const childrenDebtors = data
        .filter((d) => d.lender === company)
        .map((d) => d.borrower)

      const uniqueChildren = [...new Set(childrenDebtors)]

      const children = uniqueChildren
        .map((child) =>
          buildNode(child, level + 1, company, [...path, company])
        )
        .filter((child) => child !== null)

      if (children.length > 0) {
        node.childs = children
      }

      return node
    }

    const tree = buildNode(rootCompany, 1)
    return tree ? [tree] : []
  }

  const handleGenerateChart = () => {
    if (!selectedCompany) {
      return alert('Vui lòng chọn công ty để xem biểu đồ')
    }
    if (!selectedDate) {
      return alert('Vui lòng chọn ngày để lọc dữ liệu')
    }
    const filtered = raw.filter((item) => {
      const startDay = dayjs(selectedDate, 'DD/MM/YYYY')
      const endDay = dayjs(selectedDate, 'DD/MM/YYYY')
      const dueDateFormat = dayjs(item.date)
      return dueDateFormat.isBetween(startDay, endDay, 'day', '[]')
    })

    // Để xử lý trường hợp đầu tư
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
    if (!startCompany) {
      return alert('Công ty không hợp lệ')
    }
    const debtTree = buildDebtTree(netDebts, startCompany.shortname)
    setFilteredData(debtTree)
  }

  return (
    <div className="App">
      <Space>
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
      <div className="hierarchy-viewer">
        <ReactHiererchyChart
          nodes={filteredData}
          direction="horizontal"
          randerNode={(node) => {
            return (
              <div className="node-template">
                <strong>
                  {node.name} {node.note && '🚫'}
                </strong>
                {node.totalAmount ? (
                  <span>
                    Tổng nợ:{' '}
                    {node.totalAmount.toLocaleString('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    })}
                  </span>
                ) : null}
                {node.activityGroups ? (
                  <div>
                    <ul style={{ margin: 0, paddingRight: 20 }}>
                      {Object.entries(node.activityGroups).map(
                        ([group, amount], index) => (
                          <li
                            key={index}
                            style={{ margin: 0, textAlign: 'left' }}
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
                  </div>
                ) : null}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}

export default TreeViewDebt
