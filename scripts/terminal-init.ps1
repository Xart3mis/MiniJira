# Loaded in Cursor/VS Code terminals for this workspace.
# Makes bare `npm` call npm.cmd (avoids npm.ps1 execution policy errors).
$nodeDir = 'C:\Program Files\nodejs'
if (Test-Path $nodeDir) {
    $env:Path = "$nodeDir;$env:Path"
    function global:npm {
        & "$nodeDir\npm.cmd" @args
    }
}
