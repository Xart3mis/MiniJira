# Run once if bare `npm` fails with "running scripts is disabled"
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
$nodeDir = 'C:\Program Files\nodejs'
if (Test-Path $nodeDir) {
    if ($env:Path -notlike "*$nodeDir*") {
        $env:Path = "$nodeDir;$env:Path"
    }
    Write-Host "OK: npm should work. Version:"
    & "$nodeDir\npm.cmd" -v
} else {
    Write-Host 'Install Node.js: winget install OpenJS.NodeJS.LTS'
}
