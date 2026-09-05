param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Target,
    [Parameter(Mandatory = $true)][string]$RestartPath,
    [string]$RestartArgs = "",
    [string]$StatusPath = ""
)

$ErrorActionPreference = "Stop"

function Set-UpdateStatus([string]$value) {
    if ($StatusPath) {
        try { Set-Content -LiteralPath $StatusPath -Value $value -Encoding UTF8 } catch { }
    }
}

try {
    if ($Url -notmatch '^https://(github\.com|codeload\.github\.com|api\.github\.com)/') {
        throw "Недопустимый источник обновления"
    }

    $work = Join-Path ([IO.Path]::GetTempPath()) ("RVL-update-" + [guid]::NewGuid().ToString("N"))
    $archive = Join-Path $work "package.zip"
    $extract = Join-Path $work "extract"
    New-Item -ItemType Directory -Path $work -Force | Out-Null
    Set-UpdateStatus "downloading"

    $headers = @{ 'User-Agent' = 'RVL-Updater'; 'Accept' = 'application/octet-stream' }
    Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers $headers -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath $extract -Force

    $source = $extract
    $children = @(Get-ChildItem -LiteralPath $extract -Force)
    if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
        $source = $children[0].FullName
    }

    # User data is intentionally excluded: presets, themes and settings survive updates.
    $skip = @("data", ".git", "package.zip")
    Get-ChildItem -LiteralPath $source -Force | Where-Object { $skip -notcontains $_.Name } | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Target $_.Name) -Recurse -Force
    }

    Set-UpdateStatus "done"
    if ($RestartArgs) {
        # The source-mode restart argument is a single script path and may contain spaces.
        Start-Process -FilePath $RestartPath -ArgumentList @('"' + $RestartArgs + '"')
    } else {
        Start-Process -FilePath $RestartPath
    }
} catch {
    Set-UpdateStatus ("error|" + $_.Exception.Message)
    if ($RestartArgs) {
        Start-Process -FilePath $RestartPath -ArgumentList @('"' + $RestartArgs + '"')
    } else {
        Start-Process -FilePath $RestartPath
    }
} finally {
    if ($work -and (Test-Path -LiteralPath $work)) {
        Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
    }
}
