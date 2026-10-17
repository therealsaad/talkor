# Run from anywhere in PowerShell; no S3 upload is performed.
# First make sure your OLD talkora-ai-service is running on localhost:8001.
param(
  [string]$TtsUrl = 'http://127.0.0.1:8001/v1/tts',
  [string]$Only = '',
  [switch]$Force
)
$ErrorActionPreference = 'Stop'
$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Manifest = Join-Path $PSScriptRoot 'kg-level1-lines.json'
$Output = Join-Path $BackendRoot 'kg-level1-mp3'
Push-Location $BackendRoot
try {
  Write-Host 'Exporting the exact 15 lines used by Talkora V2...'
  $raw = & npm run --silent kg:audio:script
  if ($LASTEXITCODE -ne 0) { throw 'Could not export KG audio lines. Run npm install / pnpm install in backend first.' }
  # Set-Content avoids Windows PowerShell redirection's UTF-16 output.
  $raw | Set-Content -Path $Manifest -Encoding UTF8
  $argsForPython = @('scripts/generate_kg_level1_audio.py', '--lines', $Manifest, '--out', $Output, '--tts-url', $TtsUrl)
  if ($Only) { $argsForPython += @('--only', $Only) }
  if ($Force) { $argsForPython += '--force' }
  & python @argsForPython
  if ($LASTEXITCODE -ne 0) { throw 'Audio generation failed. See error above.' }
  Write-Host ''
  Write-Host 'Audio ready in:' $Output
  Write-Host 'After listening and approving all 15 clips:'
  Write-Host 'npm run kg:audio:upload -- --dir='"$Output"' --dry-run'
  Write-Host 'npm run kg:audio:upload -- --dir='"$Output"' --apply'
} finally {
  Pop-Location
}
