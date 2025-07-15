import { useEffect, useState, useMemo } from 'react'
import { Heatmap } from '@mui/x-charts-pro/Heatmap'

const HeatMapMatrix = ({ raw }) => {
  const [debts, setDebts] = useState([])
  const [companies, setCompanies] = useState([])
  const [hovered, setHovered] = useState(null) // 👉 thêm để bắt hover

  function mergeDebts(list) {
    return Object.values(
      list.reduce((acc, { subject, partner, balance }) => {
        const sign = balance >= 0 ? 1 : -1
        const key = `${subject}|${partner}|${sign}`
        acc[key] = acc[key]
          ? { ...acc[key], balance: acc[key].balance + balance }
          : { subject, partner, balance }
        return acc
      }, {})
    )
  }

  useEffect(() => {
    setDebts(
      mergeDebts(raw).map(({ subject, partner, balance }) =>
        balance > 0
          ? { from: partner, to: subject, amount: balance }
          : { from: subject, to: partner, amount: -balance }
      )
    )
    setCompanies(
      Array.from(new Set(raw.flatMap((r) => [r.subject, r.partner]))).sort()
    )
  }, [raw])

  const dataMatrix = useMemo(() => {
    return debts
      .map((i) => [
        companies.indexOf(i.from),
        companies.indexOf(i.to),
        i.amount,
      ])
      .filter(([x, y]) => x !== -1 && y !== -1)
  }, [debts, companies])

  return (
    <div>
      <Heatmap
        xAxis={[{ data: companies }]}
        yAxis={[{ data: companies }]}
        series={[
          {
            data: dataMatrix,
            valueFormatter: (value) => {
              if (value) {
                const fromCompany = companies[value[0]]
                const toCompany = companies[value[1]]
                return `${toCompany} nợ ${fromCompany} ${Intl.NumberFormat().format(
                  value[2]
                )} đ`
              }
              return ''
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
    ...other
  } = props
  const { value, dataIndex } = ownerState

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

  const fill = isHovered
    ? '#ff7043' // cam đậm
    : isMirror
    ? '#ffd54f' // vàng
    : value === 0
    ? '#e0e0e0'
    : value > 0
    ? '#cceeefff'
    : '#2e7d32'

  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        pointerEvents="all"
      />
      <rect
        {...other}
        x={x + 4}
        y={y + 4}
        width={width - 8}
        height={height - 8}
        fill={fill}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
        fontSize={12}
        fontWeight="600"
      >
        {Intl.NumberFormat().format(value)} đ
      </text>
    </>
  )
}
