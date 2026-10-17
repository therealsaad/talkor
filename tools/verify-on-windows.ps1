# Run on a developer machine with Node, pnpm and network access.
# Does not run live cloud tests, mutate MongoDB, or publish a deployment.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
function RunChecked([string]$directory, [string]$step, [string]$command) {
  Push-Location (Join-Path $root $directory)
  try {
    Write-Host "`n=== $directory : $step ===" -ForegroundColor Cyan
    Invoke-Expression $command
    if ($LASTEXITCODE -ne 0) { throw "$step failed (exit $LASTEXITCODE)" }
  } finally { Pop-Location }
}
Write-Host 'Use Node 22 LTS and pnpm 10.18.0. Review env examples; never commit private .env values.'
Write-Host "`n=== 110-level map runtime tests ===" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'test-curriculum-map.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Curriculum map tests failed' }
Write-Host "`n=== Source syntax and local imports ===" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'verify-source.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Source syntax/import checks failed' }
Write-Host "`n=== Private PDF parser tests ===" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'reports\csv-to-private-pdf.test.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Report PDF preparation tests failed' }
RunChecked 'backend' 'Frozen dependencies' 'pnpm install --frozen-lockfile'
RunChecked 'backend' 'TypeScript build' 'pnpm build'
RunChecked 'backend' '110-level map dry run (reads configured test DB; no writes)' 'pnpm curriculum:map:dry-run'
RunChecked 'backend' 'Jest unit/integration tests (test MongoDB required)' 'pnpm test'
RunChecked 'client' 'Frozen dependencies' 'pnpm install --frozen-lockfile'
RunChecked 'client' 'Existing KG+UI Node tests' 'node --test tests/ui/kg-pilot-experience.test.mjs tests/ui/student-enrollment-modal.test.mjs tests/kg-speech-runtime.test.mjs tests/ui/kg-v3-integration.test.mjs'
RunChecked 'client' 'Next.js production build' 'pnpm build'
Write-Host "`nSource builds/tests passed; deployment still requires actual Chrome/Android, audio, S3, MongoDB and lab/kiosk checks." -ForegroundColor Green
