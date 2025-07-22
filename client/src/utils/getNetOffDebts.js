const processData = (raw) => {
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

function netDebts(rows) {
  // Bước 1: gộp giao dịch cùng chiều
  const forward = new Map()
  for (const { lender, borrower, amount } of rows) {
    if (lender === borrower) continue // bỏ qua tự vay‑mượn chính mình
    const key = `${lender}|${borrower}`
    forward.set(key, (forward.get(key) ?? 0) + amount)
  }

  // Bước 2 + 3: cấn trừ hai chiều
  const results = []
  const visited = new Set()

  for (const [key, amtAB] of forward.entries()) {
    if (visited.has(key)) continue // đã xử lý cặp này
    const [A, B] = key.split('|')
    const keyBA = `${B}|${A}`
    const amtBA = forward.get(keyBA) ?? 0

    const net = amtAB - amtBA // dương: A còn thu, âm: A còn trả
    visited.add(key)
    visited.add(keyBA)

    if (net > 0) {
      results.push({ lender: A, borrower: B, amount: net })
    } else if (net < 0) {
      results.push({ lender: B, borrower: A, amount: -net })
    }
    // net == 0 ⇒ cấn hết, không đưa vào kết quả
  }

  return results
}

export function calculateTotalDebts(debts) {
  const data = processData(debts)
  const map = new Map()

  for (const { borrower, lender, amount } of data) {
    const key = `${borrower}->${lender}`
    map.set(key, (map.get(key) || 0) + amount)
  }

  // Chuyển về mảng kết quả
  const result = []
  for (const [key, totalAmount] of map.entries()) {
    const [borrower, lender] = key.split('->')
    result.push({ lender: lender, borrower: borrower, totalAmount })
  }

  return result
}

export const handleNetOffByGroup = (raw) => {
  const dataProcessed = processData(raw)
  return netDebtsByGroup(dataProcessed)
}

export const handleNetOff = (raw) => {
  const dataProcessed = processData(raw)
  return netDebts(dataProcessed)
}

export const getPreProcessedData = (raw) => processData(raw)
