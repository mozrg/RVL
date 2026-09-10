param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release'
)

$project = Join-Path $PSScriptRoot 'RVL.csproj'
$buildDir = Join-Path $PSScriptRoot "bin\$Configuration\net8.0-windows"
$releaseDir = Join-Path $PSScriptRoot 'release'

dotnet build $project -c $Configuration --nologo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Test-Path $releaseDir) { Remove-Item -LiteralPath $releaseDir -Recurse -Force }
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
foreach ($name in @('RVL.exe', 'RVL.dll', 'RVL.deps.json', 'RVL.runtimeconfig.json', 'Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll')) {
    Copy-Item (Join-Path $buildDir $name) $releaseDir -Force
}
New-Item -ItemType Directory -Path (Join-Path $releaseDir 'runtimes\win-x64\native') -Force | Out-Null
Copy-Item (Join-Path $buildDir 'runtimes\win-x64\native\WebView2Loader.dll') (Join-Path $releaseDir 'runtimes\win-x64\native') -Force
$repoRoot = Split-Path $PSScriptRoot
foreach ($folder in @('ui', 'images', 'update')) {
    $sourceDir = Join-Path $repoRoot $folder
    $targetDir = Join-Path $releaseDir $folder
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Copy-Item (Join-Path $sourceDir '*') $targetDir -Recurse -Force
}

$bytes = (Get-ChildItem $releaseDir -Recurse -File | Measure-Object Length -Sum).Sum
Write-Host "RVL release: $releaseDir"
Write-Host ("Размер: {0:N2} МБ" -f ($bytes / 1MB))
