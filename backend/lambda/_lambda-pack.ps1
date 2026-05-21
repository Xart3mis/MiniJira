function Get-NpmCmd {
    $npmCmd = 'C:\Program Files\nodejs\npm.cmd'
    if (Test-Path $npmCmd) { return $npmCmd }

    $onPath = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($onPath) { return $onPath.Source }

    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if ($npm -and $npm.Source -like '*.cmd') { return $npm.Source }
    if ($npm -and $npm.Source -like '*.ps1') {
        $sibling = Join-Path (Split-Path $npm.Source -Parent) 'npm.cmd'
        if (Test-Path $sibling) { return $sibling }
    }

    throw @"
npm not found. Install Node.js LTS, then open a new terminal:
  winget install OpenJS.NodeJS.LTS

If npm fails with 'running scripts is disabled', use npm.cmd (this script does).
"@
}

function Pack-Lambda {
    param(
        [string]$LambdaDir = $PSScriptRoot,
        [string]$FunctionName,
        [string]$EnvHint = ''
    )

    $ErrorActionPreference = 'Stop'
    Set-Location $LambdaDir

    $npm = Get-NpmCmd
    Write-Host "Using npm: $npm"

    if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
    & $npm install --omit=dev

    if (Test-Path function.zip) { Remove-Item -Force function.zip }

    $items = @('index.js', 'package.json', 'node_modules')
    $missing = $items | Where-Object { -not (Test-Path $_) }
    if ($missing) {
        throw "Missing: $($missing -join ', ')"
    }

    Compress-Archive -Path $items -DestinationPath function.zip -Force
    $sizeMb = [math]::Round((Get-Item function.zip).Length / 1MB, 2)
    Write-Host "Created $LambdaDir\function.zip ($sizeMb MB)"
    if ($FunctionName) {
        Write-Host "Upload to Lambda: $FunctionName | Handler: index.handler | Runtime: Node.js 18.x"
    }
    if ($EnvHint) { Write-Host $EnvHint }
}
