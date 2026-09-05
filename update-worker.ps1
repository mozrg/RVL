param(
    [string]$Url = "",
    [string]$Target = "",
    [string]$RestartPath = "",
    [string]$RestartArgs = "",
    [string]$StatusPath = "",
    [int]$WaitPid = 0,
    [string]$ConfigPath = ""
)

$ErrorActionPreference = "Stop"
$work = $null

if ($ConfigPath -and (Test-Path -LiteralPath $ConfigPath)) {
    $config = @{}
    Get-Content -LiteralPath $ConfigPath -Encoding UTF8 | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') { $config[$matches[1]] = $matches[2] }
    }
    if ($config.ContainsKey("Url")) { $Url = $config["Url"] }
    if ($config.ContainsKey("Target")) { $Target = $config["Target"] }
    if ($config.ContainsKey("RestartPath")) { $RestartPath = $config["RestartPath"] }
    if ($config.ContainsKey("RestartArgs")) { $RestartArgs = $config["RestartArgs"] }
    if ($config.ContainsKey("StatusPath")) { $StatusPath = $config["StatusPath"] }
    if ($config.ContainsKey("WaitPid")) { $WaitPid = [int]$config["WaitPid"] }
}

function Write-WorkerStatus([string]$state, [int]$progress, [string]$message) {
    if (-not $StatusPath) { return }
    $safeMessage = ($message -replace "\|", "/") -replace "[\r\n]", " "
    $line = "{0}|{1}|{2}" -f $state, $progress, $safeMessage
    try {
        # No BOM: the AHK v1 bridge can read the first state immediately.
        $utf8 = [System.Text.UTF8Encoding]::new($false)
        [System.IO.File]::WriteAllText($StatusPath, $line, $utf8)
    } catch {
        # Windows PowerShell 5.1 fallback if the UTF-8 constructor is absent.
        try { Set-Content -LiteralPath $StatusPath -Value $line -Encoding UTF8 } catch { }
    }
}

try {
    Write-WorkerStatus "starting" 0 "Запускаем фоновый загрузчик..."
    if ($Url -notmatch '^https://(github\.com|codeload\.github\.com|api\.github\.com)/') {
        throw "Недопустимый источник обновления"
    }

    $work = Join-Path ([IO.Path]::GetTempPath()) ("RVL-update-" + [guid]::NewGuid().ToString("N"))
    $archive = Join-Path $work "package.zip"
    $extract = Join-Path $work "extract"
    New-Item -ItemType Directory -Path $work -Force | Out-Null
    Write-WorkerStatus "downloading" 0 "Подключаемся к GitHub..."

    [System.Net.ServicePointManager]::SecurityProtocol = 3072
    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.UserAgent = "RVL-Updater"
    $request.AllowAutoRedirect = $true
    $request.Timeout = 30000
    $response = $request.GetResponse()
    $total = $response.ContentLength
    $inputStream = $response.GetResponseStream()
    $output = [System.IO.File]::Create($archive)
    $buffer = New-Object byte[] 65536
    $downloaded = [int64]0
    $count = 0

    while (($count = $inputStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
        $output.Write($buffer, 0, $count)
        $downloaded += $count
        if ($total -gt 0) {
            $progress = [int][Math]::Min(100, [Math]::Floor($downloaded * 100 / $total))
            $downloadedMb = [Math]::Round($downloaded / 1MB, 1)
            $totalMb = [Math]::Round($total / 1MB, 1)
            Write-WorkerStatus "downloading" $progress ("{0} МБ из {1} МБ" -f $downloadedMb, $totalMb)
        }
    }
    $output.Close()
    $inputStream.Close()
    $response.Close()

    Write-WorkerStatus "downloading" 100 "Распаковываем файлы обновления..."
    New-Item -ItemType Directory -Path $extract -Force | Out-Null
    Expand-Archive -LiteralPath $archive -DestinationPath $extract -Force

    $source = $extract
    $children = @(Get-ChildItem -LiteralPath $extract -Force)
    if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
        $source = $children[0].FullName
    }
    if (-not (Test-Path -LiteralPath (Join-Path $source "RVL.ahk"))) {
        throw "Архив обновления имеет неверный формат"
    }

    # RVL must close before its own files can be replaced. The main window
    # displays the ready state, then exits; this worker performs the copy.
    Write-WorkerStatus "ready" 100 "Файлы скачаны. Перезапускаем RVL..."
    if ($WaitPid -gt 0) {
        while (Get-Process -Id $WaitPid -ErrorAction SilentlyContinue) {
            Start-Sleep -Milliseconds 120
        }
    }

    $skip = @("data", ".git", "package.zip")
    Get-ChildItem -LiteralPath $source -Force |
        Where-Object { $skip -notcontains $_.Name } |
        ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Target $_.Name) -Recurse -Force
        }

    Write-WorkerStatus "done" 100 "Обновление установлено"
    Start-Sleep -Milliseconds 250
    if ($RestartArgs) {
        Start-Process -FilePath $RestartPath -ArgumentList @('"' + $RestartArgs + '"')
    } else {
        Start-Process -FilePath $RestartPath
    }
} catch {
    Write-WorkerStatus "error" 0 $_.Exception.Message
} finally {
    if ($work -and (Test-Path -LiteralPath $work)) {
        Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
    }
    if ($ConfigPath -and (Test-Path -LiteralPath $ConfigPath)) {
        Remove-Item -LiteralPath $ConfigPath -Force -ErrorAction SilentlyContinue
    }
    $selfPath = $MyInvocation.MyCommand.Path
    # Only temporary worker copies may delete themselves. Never remove the
    # repository's update-worker.ps1 when the script is run directly.
    if ($selfPath -and ([IO.Path]::GetFileName($selfPath) -like "RVL_update_worker_*.ps1") -and (Test-Path -LiteralPath $selfPath)) {
        Remove-Item -LiteralPath $selfPath -Force -ErrorAction SilentlyContinue
    }
}
