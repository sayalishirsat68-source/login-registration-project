$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root 'frontend'
$backend = Join-Path $root 'backend'

New-Item -ItemType Directory -Force -Path $frontend, $backend | Out-Null

$frontendFiles = @(
  'about us.html', 'blog.html', 'compaign.html', 'contact us.html', 'donate.html',
  'features.html', 'index.html', 'join us.html', 'login.html', 'media.html',
  'ngo.html', 'projects.html', 'register.html', 'style.css', 'app.js'
)
foreach ($file in $frontendFiles) {
  $source = Join-Path $root $file
  if (Test-Path -LiteralPath $source) { Move-Item -LiteralPath $source -Destination $frontend }
}

$backendItems = @('server.js', 'database.js', 'migrate.js', 'middleware', 'validators', 'migrations', 'scripts', 'data', 'test')
foreach ($item in $backendItems) {
  $source = Join-Path $root $item
  if (Test-Path -LiteralPath $source) { Move-Item -LiteralPath $source -Destination $backend }
}

$serverPath = Join-Path $backend 'server.js'
$server = Get-Content -LiteralPath $serverPath -Raw
$server = $server.Replace("aliases.forEach(([paths, target]) => paths.forEach(route => app.get(route, (req, res) => res.sendFile(path.join(__dirname, target)))));`r`napp.use(express.static(__dirname));", "const frontendDirectory = path.join(__dirname, '..', 'frontend');`r`naliases.forEach(([paths, target]) => paths.forEach(route => app.get(route, (req, res) => res.sendFile(path.join(frontendDirectory, target)))));`r`napp.use(express.static(frontendDirectory));")
Set-Content -LiteralPath $serverPath -Value $server -NoNewline

foreach ($scriptName in @('backup.js', 'restore.js')) {
  $scriptPath = Join-Path $backend "scripts/$scriptName"
  $script = Get-Content -LiteralPath $scriptPath -Raw
  $script = $script.Replace("process.env.DATA_DIR || 'data'", "process.env.DATA_DIR || path.join(__dirname, '..', 'data')")
  Set-Content -LiteralPath $scriptPath -Value $script -NoNewline
}

$packagePath = Join-Path $root 'package.json'
$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
$package.main = 'backend/server.js'
$package.scripts.build = 'node --check backend/server.js && node --check backend/database.js'
$package.scripts.test = 'node backend/test/api.smoke.js'
$package.scripts.'db:migrate' = 'node backend/scripts/migrate.js'
$package.scripts.'db:backup' = 'node backend/scripts/backup.js'
$package.scripts.'db:restore' = 'node backend/scripts/restore.js'
$package | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $packagePath

$vercelPath = Join-Path $root 'vercel.json'
$vercel = Get-Content -LiteralPath $vercelPath -Raw
$vercel = $vercel.Replace('"src": "server.js"', '"src": "backend/server.js"').Replace('"dest": "server.js"', '"dest": "backend/server.js"')
Set-Content -LiteralPath $vercelPath -Value $vercel -NoNewline

Write-Host 'Frontend/backend split complete.'
Write-Host 'Run: npm run build; npm test'
