import { useState, useCallback, useMemo } from 'react'
import { Table, DatePicker, Select, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { useZustand } from '../zustand'
import { IoFilterSharp } from 'react-icons/io5'

const InterCompanyFinanceDiffList = () => {
  const { interCompanyFinances, companies, auth } = useZustand()
  const [companyFilter, setCompanyFilter] = useState([])
  const [dateRangeFilter, setDateRangeFilter] = useState(undefined)
  const [filteredDiffDebts, setFilteredDiffDebts] = useState([])

  // Memoized processed data and discrepancies
  const diffDebts = (inputData) => {
    // Process data
    let processedRawData = []
    inputData.forEach((item) => {
      const alreadyProcessedItem = processedRawData.find((i) => {
        const dateCreated = dayjs(item.date).add(7, 'hour').format('YYYY-MM-DD')
        const dateInput = dayjs(i.date).add(7, 'hour').format('YYYY-MM-DD')
        return (
          i.subjectCompanyId._id === item.subjectCompanyId._id &&
          i.counterpartCompanyId._id === item.counterpartCompanyId._id &&
          i.type === item.type &&
          i.activityGroup === item.activityGroup &&
          dateCreated === dateInput
        )
      })
      if (alreadyProcessedItem) {
        processedRawData = processedRawData.map((i) => {
          if (i._id === alreadyProcessedItem._id) {
            return {
              ...i,
              balance: i.balance + (item.debit - item.credit),
            }
          }
          return i
        })
      } else {
        processedRawData.push({
          ...item,
          balance: item.debit - item.credit,
        })
      }
    })
    const processed = processedRawData.map((item) => {
      return {
        date: item.date,
        subject:
          item.subjectCompanyId?.shortname || item.subjectCompanyId?.name,
        partner:
          item.counterpartCompanyId?.shortname ||
          item.counterpartCompanyId?.name,
        balance: Math.abs(item.balance),
        type: item.type,
        activityGroup: item.activityGroup,
      }
    })

    // Find discrepancies
    const discrepancies = []
    const used = new Set()
    processed.forEach((entry) => {
      const { subject, partner, balance, type, activityGroup } = entry
      const counterpartKey = `${partner}|${subject}|${activityGroup}|${
        type === 'payable' ? 'receivable' : 'payable'
      }`
      const currentKey = `${subject}|${partner}|${activityGroup}|${type}`
      if (used.has(currentKey) || used.has(counterpartKey)) return
      const counterpart = processed.find(
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
        })
      } else if (balance !== counterpart.balance) {
        if (activityGroup === 'invest') {
          // Lấy công ty nhận tiền đầu tư
          const companyInvested = companies.find((company) =>
            type === 'receivable'
              ? company.shortname === subject
              : company.shortname === partner
          )

          if (!companyInvested) {
            discrepancies.push({
              subjectA: subject,
              subjectB: partner,
              activityGroup,
              balanceA: balance,
              balanceB: counterpart.balance,
              delta: Math.abs(balance - counterpart.balance),
              note: 'Không tìm thấy công ty nhận tiền đầu tư',
            })
          } else {
            if (
              companyInvested.chartelCapital !==
              Math.abs(balance + counterpart.balance)
            ) {
              discrepancies.push({
                subjectA: subject,
                subjectB: partner,
                activityGroup,
                balanceA: balance,
                balanceB: counterpart.balance,
                delta:
                  companyInvested.chartelCapital -
                  Math.abs(balance + counterpart.balance),
                note: `Công ty ${
                  companyInvested.shortname
                } có vốn điều lệ không khớp với số tiền đầu tư ghi nhận. Vốn điều lệ: ${Intl.NumberFormat().format(
                  companyInvested.chartelCapital
                )}, Số tiền đầu tư ghi nhận: ${Intl.NumberFormat().format(
                  Math.abs(balance + counterpart.balance)
                )}`,
              })
            }
          }
        } else {
          discrepancies.push({
            subjectA: subject,
            subjectB: partner,
            activityGroup,
            balanceA: balance,
            balanceB: counterpart.balance,
            delta: Math.abs(balance - counterpart.balance),
          })
        }
      }
      used.add(currentKey)
      used.add(counterpartKey)
    })
    return discrepancies
  }

  // Combined filter logic
  const applyFilters = useCallback(
    (companies, date) => {
      let filtered = interCompanyFinances.filter(
        (item) =>
          auth.companyIds.includes(item.subjectCompanyId._id) ||
          auth.companyIds.includes(item.counterpartCompanyId._id)
      )
      if (date) {
        filtered = filtered.filter((item) => {
          const dueDateFormat = dayjs(item.date)
          return dueDateFormat.isBetween(
            dayjs(date, 'DD/MM/YYYY'),
            dayjs(date, 'DD/MM/YYYY'),
            'day',
            '[]'
          )
        })
      } else {
        filtered = []
      }

      let diffData = diffDebts(filtered)

      if (companies) {
        const companyShortnames = companies
          .map((id) => companiesList.find((c) => c._id === id)?.shortname)
          .filter(Boolean)

        if (companyShortnames.length === 1) {
          diffData = diffData.filter(
            (i) =>
              companyShortnames.includes(i.subjectA) ||
              companyShortnames.includes(i.subjectB)
          )
        } else if (companyShortnames.length > 1) {
          diffData = diffData.filter(
            (i) =>
              companyShortnames.includes(i.subjectA) &&
              companyShortnames.includes(i.subjectB)
          )
        }
      }

      setFilteredDiffDebts(diffData)
    },
    [diffDebts]
  )

  // Memoize companies for filter
  const companiesList = useMemo(() => companies, [companies])

  const handleChangeCompanyFilter = useCallback(
    (value) => {
      setCompanyFilter(value)
      applyFilters(value, dateRangeFilter)
    },
    [applyFilters, dateRangeFilter]
  )

  const handleDateFilter = useCallback(
    (date) => {
      setDateRangeFilter(date)
      applyFilters(companyFilter, date)
    },
    [applyFilters, companyFilter]
  )

  const diffNotingColumns = useMemo(
    () => [
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
          <Tag
            color={
              state === 'business'
                ? 'blue'
                : state === 'invest'
                ? 'purple'
                : state === 'finance'
                ? 'gold'
                : ''
            }
          >
            {state === 'business'
              ? 'Hoạt động kinh doanh'
              : state === 'invest'
              ? 'Hoạt động đầu tư'
              : state === 'finance'
              ? 'Hoạt động tài chính'
              : 'Khác'}
          </Tag>
        ),
      },
      {
        title: 'Công ty A',
        dataIndex: 'subjectA',
        key: 'subjectA',
        sorter: (a, b) => a.subjectA - b.subjectA,
      },
      {
        title: 'Công ty A ghi nhận (VNĐ)',
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
        title: 'Công ty B ghi nhận (VNĐ)',
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
        title: 'Ghi chú',
        dataIndex: 'note',
        key: 'note',
      },
    ],
    []
  )

  return (
    <>
      <div>
        <Space
          style={{
            marginBottom: 16,
            display: 'flex',
            width: '100%',
          }}
        >
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
          <DatePicker
            onChange={handleDateFilter}
            placeholder="Chọn ngày để lọc"
            style={{ width: 200 }}
          />
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ minWidth: '300px' }}
            onChange={handleChangeCompanyFilter}
            value={companyFilter}
            placeholder="Hãy chọn công ty để lọc"
            options={companies.map((i) => {
              return {
                label: i.shortname,
                value: i._id,
              }
            })}
          />
        </Space>
      </div>
      <Table columns={diffNotingColumns} dataSource={filteredDiffDebts} />
    </>
  )
}

export default InterCompanyFinanceDiffList
