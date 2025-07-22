import { useEffect, useState } from 'react'
import { Heatmap } from '@mui/x-charts-pro/Heatmap'
import Tooltip from '@mui/material/Tooltip'
import { handleNetOff, handleNetOffByGroup } from './getNetOffDebts'

const HeatMapMatrix = ({ raw }) => {
  const [debts, setDebts] = useState([])
  const [companies, setCompanies] = useState([])
  const [myNetDebts, setNetDebts] = useState([])
  const [myNetDebtsByGroup, setNetDebtsByGroup] = useState([])
  const [hovered, setHovered] = useState(null) // 👉 thêm để bắt hover

  useEffect(() => {
    const companyList = Array.from(
      new Set(raw.flatMap((r) => [r.subject, r.partner]))
    ).sort()

    setNetDebtsByGroup(handleNetOffByGroup(raw))
    setNetDebts(handleNetOff(raw))

    let myFillerList = []
    for (let i = 0; i < companyList.length; i++) {
      for (let j = 0; j < companyList.length; j++) {
        if (companyList[i] === companyList[j]) continue
        myFillerList.push({
          from: companyList[i],
          to: companyList[j],
          amount: 1,
        })
      }
    }

    setDebts(myFillerList)
    setCompanies(companyList)
  }, [raw])

  return (
    <div>
      <Heatmap
        xAxis={[{ data: companies }]}
        yAxis={[{ data: companies }]}
        series={[
          {
            data: debts
              .map((i) => {
                return myNetDebtsByGroup.find(
                  (item) => item.lender === i.to && item.borrower === i.from
                )
                  ? [
                      companies.indexOf(i.from),
                      companies.indexOf(i.to),
                      i.amount,
                    ]
                  : [-1, -1, 0]
              })
              .filter(([x, y]) => x !== -1 && y !== -1),
            valueFormatter: (value) => {
              if (!value) return ''

              const fromCompany = companies[value[0]]
              const toCompany = companies[value[1]]

              // Get all matching debts from borrower to lender
              const cellDebts = myNetDebtsByGroup.filter(
                (d) => d.lender === toCompany && d.borrower === fromCompany
              )

              if (!cellDebts.length) return ''

              const total = cellDebts.reduce((sum, d) => sum + d.amount, 0)

              return `${fromCompany} nợ ${toCompany} tổng cộng: ${Intl.NumberFormat().format(
                total
              )} đ`
            },
          },
        ]}
        height={500}
        highlightedItem={hovered}
        onHighlightChange={(_, item) => {
          setHovered(_)
        }} // 👈 bắt sự kiện hover
        slots={{
          cell: (props) => (
            <CustomCell
              {...props}
              hovered={hovered}
              companies={companies}
              debts={debts}
              mynetdebts={myNetDebts}
              mynetdebtsbyGroup={myNetDebtsByGroup}
            />
          ),
        }}
      />
    </div>
  )
}

export default HeatMapMatrix

function CustomCell(props) {
  const {
    x,
    y,
    width,
    height,
    ownerState,
    hovered,
    companies,
    debts,
    mynetdebts,
    mynetdebtsbyGroup,
    ...other
  } = props
  const { dataIndex } = ownerState
  const [cellRespectiveDebts, setCellRespectiveDebts] = useState([])

  const checkIfCellIsMirror = () => {
    const currentHoveredCell = debts[hovered?.dataIndex]
    const mirrorHoveredCell = debts[dataIndex]
    if (currentHoveredCell && mirrorHoveredCell) {
      if (
        currentHoveredCell.from === mirrorHoveredCell.to &&
        currentHoveredCell.to === mirrorHoveredCell.from
      )
        return true
    }
    return false
  }

  const isHovered = hovered && hovered?.dataIndex === dataIndex

  const isMirror = checkIfCellIsMirror()

  const getColorForActivityType = (type) => {
    switch (type) {
      case 'business':
        return '#cceeefff'
      case 'invest':
        return '#ffd54f'
      case 'finance':
        return '#e792b0ff'
      case 'others':
        return '#ff7043'
      default:
        return ''
    }
  }

  useEffect(() => {
    const myDebtCell = debts
      .map((i) => {
        return mynetdebtsbyGroup.find(
          (item) => item.lender === i.to && item.borrower === i.from
        )
          ? [companies.indexOf(i.from), companies.indexOf(i.to), i.amount]
          : [-1, -1, 0]
      })
      .filter(([x, y]) => x !== -1 && y !== -1)[dataIndex]
    const fromCompany = companies[myDebtCell[0]]
    const toCompany = companies[myDebtCell[1]]
    const cellRespectiveDebts = mynetdebtsbyGroup.filter(
      (i) => i.lender === toCompany && i.borrower === fromCompany
    )
    setCellRespectiveDebts(cellRespectiveDebts)
  }, [])

  return (
    <Tooltip
      title={
        <div style={{ whiteSpace: 'pre-line' }}>
          {cellRespectiveDebts.map((d, i) => (
            <div key={i} style={{ fontSize: 16 }}>
              {d.activityGroup === 'business'
                ? 'Hoạt động kinh doanh'
                : d.activityGroup === 'invest'
                ? 'Hoạt động đầu tư'
                : d.activityGroup === 'finance'
                ? 'Hoạt động tài chính'
                : 'Khác'}
              : {Intl.NumberFormat().format(d.amount)} đ
            </div>
          ))}
        </div>
      }
      arrow
      placement="top"
    >
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          pointerEvents="all"
        />
        {cellRespectiveDebts.length === 1 ? (
          <rect
            {...other}
            stroke={isHovered || isMirror ? 'black' : 'none'}
            strokeWidth={3}
            x={x + 4}
            y={y + 4}
            width={width - 8}
            height={height - 8}
            fill={getColorForActivityType(
              cellRespectiveDebts[0]?.activityGroup
            )}
          />
        ) : cellRespectiveDebts.length === 2 ? (
          <>
            <rect
              {...other}
              x={x + 4}
              y={y + 4}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              width={width / 2}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[0]?.activityGroup
              )}
            />
            <rect
              {...other}
              x={x + width / 2}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              y={y + 4}
              width={width / 2}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[1]?.activityGroup
              )}
            />
          </>
        ) : cellRespectiveDebts.length === 4 ? (
          <>
            <rect
              {...other}
              x={x + 4}
              y={y + 4}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              width={width / 4}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[0]?.activityGroup
              )}
            />
            <rect
              {...other}
              x={x + (width * 3) / 4}
              y={y + 4}
              width={width / 4}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[1]?.activityGroup
              )}
            />
            <rect
              {...other}
              x={x + (width * 2) / 4}
              y={y + 4}
              width={width / 4}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[2]?.activityGroup
              )}
            />
            <rect
              {...other}
              x={x + (width * 1) / 4}
              y={y + 4}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              width={width / 4}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[3]?.activityGroup
              )}
            />
          </>
        ) : (
          <>
            <rect
              {...other}
              x={x + 4}
              y={y + 4}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              width={width / 3}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[0]?.activityGroup
              )}
            />
            <rect
              {...other}
              x={x + (width * 2) / 3}
              y={y + 4}
              width={width / 3}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[1]?.activityGroup
              )}
            />
            <rect
              {...other}
              x={x + (width * 1) / 3}
              y={y + 4}
              width={width / 3}
              stroke={isHovered || isMirror ? 'black' : 'none'}
              strokeWidth={3}
              height={height - 8}
              fill={getColorForActivityType(
                cellRespectiveDebts[2]?.activityGroup
              )}
            />
          </>
        )}
        {cellRespectiveDebts.length === 1 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            pointerEvents="none"
            fontSize={12}
            fontWeight="600"
          >
            {Intl.NumberFormat().format(cellRespectiveDebts[0].amount)} đ
          </text>
        )}
      </g>
    </Tooltip>
  )
}
