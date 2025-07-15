import React from 'react'
import HeatmapDebt from '../utils/debtHeatmapMatrix'

const InterCompanyFinanceChart = ({ data }) => {
  const processData = (raw) => {
    return raw.map((item) => {
      return {
        subject:
          item.subjectCompanyId?.shortname || item.subjectCompanyId?.name,
        partner:
          item.counterpartCompanyId?.shortname ||
          item.counterpartCompanyId?.name,
        balance: item.value,
      }
    })
  }

  return (
    <div>
      <HeatmapDebt raw={processData(data)} />
    </div>
  )
}

export default InterCompanyFinanceChart
