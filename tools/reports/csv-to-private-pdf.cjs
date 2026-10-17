#!/usr/bin/env node
'use strict'
/**
 * Offline HTML->PDF renderer for the backend's PRIVATE school CSV snapshots.
 * Requires an explicitly supplied Chrome/Chromium binary; no npm dependencies,
 * no external requests, and no student information is printed to stdout.
 * This does NOT email reports to parents or upload private PDF data anywhere.
 */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { pathToFileURL } = require('node:url')

function arg(name) {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : undefined
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

/** RFC4180ish parser: quotes, escaped quotes, CRLF and BOM. No formula evaluation. */
function parseCsv(source) {
  const text = source.replace(/^\uFEFF/, '')
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else {
      if (c === '"' && field === '') quoted = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
      else field += c
    }
  }
  if (quoted) throw new Error('Unterminated quoted CSV field')
  if (field !== '' || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row) }
  return rows
}

function createHtml(records, period) {
  if (records.length < 1) throw new Error('CSV report has no header row')
  const header = records[0]
  if (header.length > 20) throw new Error('CSV report has too many columns')
  const data = records.slice(1)
  if (data.length > 20000) throw new Error('CSV report exceeds 20,000 rows: export smaller school batches')
  const clean = (text) => escapeHtml(String(text).replace(/^\t?'/, '')) // CSV formula prefix is not executable in HTML.
  const tableHead = header.map((cell) => `<th scope="col">${clean(cell)}</th>`).join('')
  const tableRows = data.map((row) => `<tr>${header.map((_, i) => `<td>${clean(row[i] || '')}</td>`).join('')}</tr>`).join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <title>Private Talkora ${clean(period)} School Report</title>
  <style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,'Noto Sans',sans-serif;color:#122134;font-size:9pt}
  h1{font-size:20pt;margin:0 0 5mm;color:#124b7a}p{color:#4a6075}table{border-collapse:collapse;width:100%;table-layout:fixed;word-wrap:break-word}
  thead{display:table-header-group}th,td{padding:5pt 4pt;border:1px solid #ccd4dc;vertical-align:top}th{background:#e7f0f6;color:#102b42;text-align:left}
  tr{page-break-inside:avoid}tbody tr:nth-child(even){background:#f8fafc}footer{margin-top:7mm;color:#64748b;font-size:8pt}</style></head><body>
  <h1>Talkora · ${clean(period)} School Progress</h1><p>Private education record · Authorized school staff only · ${data.length} student records</p>
  <table aria-label="Student progress export"><thead><tr>${tableHead}</tr></thead><tbody>${tableRows}</tbody></table>
  <footer>Source: authorized Talkora report snapshot. Not intended for public distribution. Share individual results with parents only through approved school procedures.</footer>
  </body></html>`
}

function render({ input, output, browser, period, allowNoSandbox = false }) {
  if (!input || !output || !browser || !['daily', 'weekly', 'monthly'].includes(period)) {
    throw new Error('Required: --input ABSOLUTE.csv --output ABSOLUTE.pdf --browser CHROME_EXE --period daily|weekly|monthly')
  }
  if (![input, output].every(path.isAbsolute) || !path.isAbsolute(browser)) throw new Error('All file paths must be absolute')
  if (!/\.csv$/i.test(input) || !/\.pdf$/i.test(output)) throw new Error('Use .csv input and .pdf output')
  if (path.resolve(input) === path.resolve(output)) throw new Error('Input and output must be different files')
  const allowedDir = process.env.TALKORA_PRIVATE_REPORT_DIR
  if (!allowedDir || !path.isAbsolute(allowedDir) ||
      !path.resolve(input).startsWith(path.resolve(allowedDir) + path.sep) ||
      !path.resolve(output).startsWith(path.resolve(allowedDir) + path.sep)) {
    throw new Error('Input and output must be inside TALKORA_PRIVATE_REPORT_DIR')
  }
  const stat = fs.statSync(input)
  if (stat.size > 12 * 1024 * 1024) throw new Error('Report CSV exceeds 12MB: split the export')
  if (fs.existsSync(output)) throw new Error('Refusing to overwrite an existing PDF')
  const data = fs.readFileSync(input, 'utf8')
  const html = createHtml(parseCsv(data), period)
  const tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'talkora-private-report-'))
  const tempHtml = path.join(tempdir, 'report.html')
  try {
    fs.writeFileSync(tempHtml, html, { mode: 0o600, flag: 'wx' })
    const args = [
      '--headless=new', '--disable-gpu', '--disable-extensions', '--disable-background-networking',
      '--no-first-run', '--no-default-browser-check', '--disable-sync', '--no-pdf-header-footer',
      `--print-to-pdf=${output}`,
      ...(allowNoSandbox ? ['--no-sandbox'] : []),
      pathToFileURL(tempHtml).href,
    ]
    const result = spawnSync(browser, args, { encoding: 'utf8', timeout: 90000, maxBuffer: 1024 * 1024 })
    if (result.error || result.status !== 0 || !fs.existsSync(output)) {
      throw new Error(`Private PDF generation failed: ${result.error?.message || `Chromium exited ${result.status}`}`)
    }
    const pdf = fs.readFileSync(output)
    if (pdf.length < 100 || pdf.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('Browser did not produce a valid PDF header')
    fs.chmodSync(output, 0o600)
    console.log('Private school PDF generated successfully. Filename and child data omitted from logs.')
  } catch (error) {
    try { if (fs.existsSync(output)) fs.unlinkSync(output) } catch { /* private cleanup best effort */ }
    throw error
  } finally { fs.rmSync(tempdir, { recursive: true, force: true }) }
}

if (require.main === module) {
  try {
    render({ input: arg('input'), output: arg('output'), browser: arg('browser'), period: arg('period'),
      allowNoSandbox: process.argv.includes('--allow-no-sandbox') })
  } catch (error) {
    console.error(`Private report render failed: ${error.message}`)
    process.exitCode = 1
  }
}
module.exports = { parseCsv, escapeHtml, createHtml, render }
