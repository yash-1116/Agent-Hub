param(
  [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker Desktop is required. Install it and run this script again."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker Engine is not running. Start Docker Desktop, wait until it says Running, then run this script again."
}

if (-not (Test-Path $EnvFile)) {
  throw "Missing $EnvFile. Copy .env.production.example to .env and set every value."
}
$EnvFile = (Resolve-Path $EnvFile).Path

$requiredSettings = @(
  "FRONTEND_URL",
  "NEXT_PUBLIC_BACKEND_URL",
  "AVM_NETWORK",
  "USDC_ASA_ID",
  "AVM_ADDRESS",
  "FACILITATOR_URL",
  "JWT_SECRET"
)
$settings = @{}
Get-Content $EnvFile | Where-Object { $_ -match "^\s*([^#][^=]*)=(.*)$" } | ForEach-Object {
  $settings[$matches[1].Trim()] = $matches[2].Trim()
}
foreach ($setting in $requiredSettings) {
  $value = $settings[$setting]
  if ([string]::IsNullOrWhiteSpace($value) -or $value -match "your-|replace-with|example") {
    throw "$setting is missing or still contains a placeholder in $EnvFile."
  }
}

Push-Location $PSScriptRoot
try {
  docker compose --env-file $EnvFile -f compose.yml config | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Docker Compose configuration is invalid." }
  docker compose --env-file $EnvFile -f compose.yml build
  if ($LASTEXITCODE -ne 0) { throw "Docker image build failed." }
  docker compose --env-file $EnvFile -f compose.yml up -d
  if ($LASTEXITCODE -ne 0) { throw "Docker Compose could not start AgentHub." }
  Write-Host "AgentHub is running at http://localhost:3000"
  Write-Host "Backend health: http://localhost:5000/api/health"
  Write-Host "Agent health: http://localhost:5000/api/health/agents"
} finally {
  Pop-Location
}
