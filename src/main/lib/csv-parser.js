function parseCsv(csvText) {
  const rows = []
  let row = []
  let value = ''
  let insideQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"' && insideQuotes && nextChar === '"') {
      value += '"'
      i++
    } else if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      row.push(value)
      value = ''
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++

      row.push(value)
      value = ''

      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row)
      }

      row = []
    } else {
      value += char
    }
  }

  if (value || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  return rows
}

function csvToObjects(csvText) {
  const rows = parseCsv(csvText)
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())

  return rows.slice(1).map((row) => {
    const item = {}

    headers.forEach((header, index) => {
      item[header] = row[index] ? row[index].trim() : ''
    })

    return item
  })
}

export { parseCsv, csvToObjects }
