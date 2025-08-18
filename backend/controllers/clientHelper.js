const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')
const jwt = require('jsonwebtoken')

dayjs.extend(isBetween)
const clientHelperCtrl = {
  processTreeViewDebtData: (req, res) => {
    try {
      const { data } = req.body
      const processed = handlePreProcessData(data)

      let processedData = [...processed]
      let investedData = processed.filter(
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
      res.status(200).json({ data: netDebts })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },

  getMetabaseLinkChartelCaptialProportion: async (req, res) => {
    try {
      const METABASE_SITE_URL = process.env.METABASE_SITE_URL
      const METABASE_SECRET_KEY =
        process.env.METABASE_SECRET_KEY_CHARTEL_CAPITAL_PROPORTION

      console.log(METABASE_SECRET_KEY)
      const payload = {
        resource: { question: 99 },
        params: {},
        exp: Math.round(Date.now() / 1000) + 60 * 60 * 24 * 30 * 12 * 100, // 10 minute expiration
      }
      const token = jwt.sign(payload, METABASE_SECRET_KEY)

      const iframeUrl =
        METABASE_SITE_URL +
        '/embed/question/' +
        token +
        '#bordered=false&titled=false'
      res.status(200).json({ link: iframeUrl })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
}

function handlePreProcessData(raw) {
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

function processData(raw) {
  const convertedtoPayableList = raw.map(
    ({ subject, partner, balance, type, activityGroup }) =>
      type === 'payable'
        ? {
            borrower: subject,
            lender: partner,
            amount: balance,
            activityGroup,
          }
        : {
            borrower: partner,
            lender: subject,
            amount: balance,
            activityGroup,
          }
  )

  const filteredDuplicatedList = []
  for (let i = 0; i < convertedtoPayableList.length; i++) {
    const { borrower, lender, amount, activityGroup } =
      convertedtoPayableList[i]
    if (
      filteredDuplicatedList.find(
        (item) =>
          item.borrower === borrower &&
          item.lender === lender &&
          item.amount === amount &&
          item.activityGroup === activityGroup
      )
    )
      continue
    filteredDuplicatedList.push(convertedtoPayableList[i])
  }

  return filteredDuplicatedList
}

function netDebtsByGroup(rows) {
  // "A|B|group"
  const forward = new Map()

  // 1) Cộng dồn từng chiều theo nhóm
  for (const { lender, borrower, amount, activityGroup } of rows) {
    if (lender === borrower) continue
    const key = `${lender}|${borrower}|${activityGroup}`
    forward.set(key, (forward.get(key) ?? 0) + amount)
  }

  // 2) Cấn trừ hai chiều cho từng nhóm
  const results = []
  const visited = new Set()

  for (const [keyAB, amtAB] of forward.entries()) {
    if (visited.has(keyAB)) continue

    const [A, B, group] = keyAB.split('|')
    const keyBA = `${B}|${A}|${group}`
    const amtBA = forward.get(keyBA) ?? 0

    const net = amtAB - amtBA
    visited.add(keyAB)
    visited.add(keyBA)

    if (net > 0) {
      results.push({
        lender: A,
        borrower: B,
        activityGroup: group,
        amount: net,
      })
    } else if (net < 0) {
      results.push({
        lender: B,
        borrower: A,
        activityGroup: group,
        amount: -net,
      })
    }
    // net == 0 ⇒ đã cấn hết
  }

  return results
}

function handleNetOffByGroup(raw) {
  const dataProcessed = processData(raw)
  return netDebtsByGroup(dataProcessed)
}

module.exports = clientHelperCtrl
