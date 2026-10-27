param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Release'
)

& (Join-Path $PSScriptRoot 'app\build.ps1') -Configuration $Configuration
exit $LASTEXITCODE