# Packages minijira-image-resize for AWS Lambda (Windows).
# Produces function.zip with Linux-compatible native deps for sharp.
param(
    [switch]$LayerOnly
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
Set-Location $Root

. "$PSScriptRoot\..\_lambda-pack.ps1"
$npm = Get-NpmCmd
Write-Host "Using npm: $npm"

if ($LayerOnly) {
    Write-Host 'Layer-only mode: zipping handler + AWS SDK (attach a sharp Lambda layer in AWS).'
    if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
    & $npm install --omit=dev --no-save '@aws-sdk/client-s3@^3.600.0'
} else {
    Write-Host 'Full bundle: installing dependencies for Linux x64 (Lambda Node 18)...'
    if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
    if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
    # Cross-platform flags alone often skip sharp's Linux optional binaries on Windows.
    & $npm install --omit=dev --include=optional --os=linux --cpu=x64
    $linuxSharp = Join-Path $Root 'node_modules\@img\sharp-linux-x64'
    if (-not (Test-Path $linuxSharp)) {
        Write-Host 'Installing Linux sharp binaries explicitly...'
        & $npm install --omit=dev --no-save --force `
            '@img/sharp-linux-x64@0.33.5' `
            '@img/sharp-libvips-linux-x64@1.0.4'
    }
    if (-not (Test-Path $linuxSharp)) {
        throw 'Linux sharp binaries missing. Use: .\package.ps1 -LayerOnly and attach a sharp Lambda layer.'
    }
}

if (Test-Path function.zip) { Remove-Item -Force function.zip }

$items = @('index.js', 'package.json', 'node_modules')
$missing = $items | Where-Object { -not (Test-Path $_) }
if ($missing) {
    throw "Missing required paths: $($missing -join ', ')"
}

Compress-Archive -Path $items -DestinationPath function.zip -Force
$sizeMb = [math]::Round((Get-Item function.zip).Length / 1MB, 2)
Write-Host "Created $Root\function.zip ($sizeMb MB)"
Write-Host 'Upload in AWS Console: Lambda -> minijira-image-resize -> Upload from .zip'
Write-Host 'Handler: index.handler | Runtime: Node.js 18.x | Env: S3_RESIZED_BUCKET'
