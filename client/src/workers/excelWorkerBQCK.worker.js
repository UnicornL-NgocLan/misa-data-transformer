/* eslint-disable no-restricted-globals */
import * as XLSX from 'xlsx'

self.onmessage = function (e) {
  const fileBuffer = e.data

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

    const sheet1 = workbook.Sheets[workbook.SheetNames[0]]
    const sheet2 = workbook.Sheets[workbook.SheetNames[1]]

    const tonDauKy = XLSX.utils.sheet_to_json(sheet1, { defval: '' })
    const giaoDich = XLSX.utils.sheet_to_json(sheet2, { defval: '' })

    self.postMessage({ success: true, data: { tonDauKy, giaoDich } })
  } catch (err) {
    self.postMessage({ success: false, error: err.message })
  }
}
