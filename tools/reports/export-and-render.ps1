# Optional Windows Task Scheduler target: private school CSV + PDF generation.
# Requires backend env (MongoDB) and a local Chrome installation. No email/upload.
param(
  [Parameter(Mandatory=$true)][ValidateSet('daily','weekly','monthly')][string]$Period,
  [Parameter(Mandatory=$true)][string]$SchoolId,
  [Parameter(Mandatory=$true)][string]$ChromePath
)
$ErrorActionPreference = 'Stop'
if ($env:TALKORA_PRIVATE_REPORT_EXPORT -ne 'enabled') { throw 'Set TALKORA_PRIVATE_REPORT_EXPORT=enabled in the private scheduled-job environment' }
if (-not $env:TALKORA_PRIVATE_REPORT_DIR) { throw 'Configure TALKORA_PRIVATE_REPORT_DIR as a private absolute directory' }
if (-not (Test-Path -LiteralPath $ChromePath)) { throw 'ChromePath not found' }
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location (Join-Path $root 'backend')
try {
  $resultLines = @(pnpm reports:export -- --period $Period --school $SchoolId)
  if ($LASTEXITCODE -ne 0) { throw 'School report export failed' }
  $record = $resultLines | Where-Object { $_ -match '^\{"status":"exported"' } | Select-Object -Last 1
  if (-not $record) { throw 'Report job did not emit a successful export result' }
  $summary = $record | ConvertFrom-Json
  if ($summary.status -ne 'exported' -or $summary.schoolId -ne $SchoolId) { throw 'Unexpected private report export result' }
  $inputCsv = Join-Path $env:TALKORA_PRIVATE_REPORT_DIR $summary.filename
  $outputPdf = [IO.Path]::ChangeExtension($inputCsv, '.pdf')
  node (Join-Path $root 'tools\reports\csv-to-private-pdf.cjs') --input $inputCsv --output $outputPdf --browser $ChromePath --period $Period
  if ($LASTEXITCODE -ne 0) { throw 'Private PDF rendering failed' }
  Write-Host 'School report PDF saved to restricted private report directory.'
} finally { Pop-Location }
