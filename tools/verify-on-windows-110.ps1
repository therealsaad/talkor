# Run from Talkora repository root on Windows with Node22 / pnpm10 installed.
$ErrorActionPreference = 'Stop'
node .\tools\verify-110-levels.cjs
if ($LASTEXITCODE -ne 0) { throw '110-level workspace check failed' }
Push-Location .\client
try {
  pnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) { throw 'Frontend dependencies failed to install' }
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw 'Frontend production build failed' }
} finally { Pop-Location }
Push-Location .\backend
try {
  pnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) { throw 'Backend dependencies failed to install' }
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw 'Backend production build failed' }
} finally { Pop-Location }
Write-Host 'Builds passed. Live API, mic, S3, kiosk and 10K load tests are STILL required.' -ForegroundColor Green
