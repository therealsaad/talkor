import { csvCell, csvRow, reportCsvHeader } from '../../src/services/report-csv.service'

describe('spreadsheet-safe, stable reporting', () => {
  test.each(['=HYPERLINK("bad")', '+SUM(1,1)', '-2+3', '@SUM(A:A)', ' \t=1+1'])(
    'escapes a potentially dangerous CSV formula: %s', (value) => {
      expect(csvCell(value)).toBe(`"'${value.replace(/"/g, '""')}"`)
    },
  )
  test('quotes commas, CR/LF and quotes consistently', () => {
    expect(csvRow(['A,"B"\r\nC', 1])).toBe('"A,""B""\r\nC","1"\r\n')
  })
  test('renders a UTF-8 BOM and report column names', () => {
    expect(reportCsvHeader()).toMatch(/^\uFEFF"Student ID","Student"/)
  })
})
