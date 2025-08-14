/* eslint-disable no-restricted-globals */
import dayjs from 'dayjs'

const processData = (raw) => {
  let processedRawData = []
  raw.forEach((item) => {
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
      subject: item.subjectCompanyId?.shortname || item.subjectCompanyId?.name,
      partner:
        item.counterpartCompanyId?.shortname || item.counterpartCompanyId?.name,
      balance: Math.abs(item.balance),
      type: item.type,
      activityGroup: item.activityGroup,
    }
  })
  return processed
}

self.onmessage = function (e) {
  const { data } = e.data
  let processedRawData = []
  data.forEach((item) => {
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
      subject: item.subjectCompanyId?.shortname || item.subjectCompanyId?.name,
      partner:
        item.counterpartCompanyId?.shortname || item.counterpartCompanyId?.name,
      balance: Math.abs(item.balance),
      type: item.type,
      activityGroup: item.activityGroup,
    }
  })

  self.postMessage({ data: processed })
}
