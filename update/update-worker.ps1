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

    # GitHub's source archive normally has one directory around the project,
    # but an attached release ZIP may put the project files at the archive
    # root. Resolve the directory by the required entry instead of assuming
    # that the first child is the project.
    $source = $extract
    if (-not (Test-Path -LiteralPath (Join-Path $source "RVL.ahk"))) {
        $candidates = @(Get-ChildItem -LiteralPath $extract -Force -Directory | Where-Object {
            Test-Path -LiteralPath (Join-Path $_.FullName "RVL.ahk")
        })
        if ($candidates.Count -eq 1) {
            $source = $candidates[0].FullName
        }
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

    # User data is never part of an application update. GitHub source
    # archives may contain the repository's data folder, but it must not be
    # copied over the local folder with the user's presets and settings.
    if (-not (Test-Path -LiteralPath $Target -PathType Container)) {
        throw "Папка установки не найдена"
    }

    $protectedRootNames = @("data", ".git", "package.zip", "RVL.lnk")
    $sourceFiles = @(Get-ChildItem -LiteralPath $source -Force -Recurse -File | Where-Object {
        $relative = $_.FullName.Substring($source.Length).TrimStart('\')
        $firstPart = $relative.Split('\')[0]
        $protectedRootNames -notcontains $firstPart
    })
    if ($sourceFiles.Count -eq 0) {
        throw "В архиве нет файлов приложения"
    }

    # Copy every file synchronously and verify its hash. Copy-Item on a whole
    # directory can return before Shell/OneDrive has finished materializing a
    # nested tree; that was the reason only the version appeared to change.
    $fileIndex = 0
    foreach ($file in $sourceFiles) {
        $fileIndex++
        $relative = $file.FullName.Substring($source.Length).TrimStart('\')
        $destination = Join-Path $Target $relative
        $destinationDir = Split-Path -Parent $destination
        if (-not (Test-Path -LiteralPath $destinationDir -PathType Container)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
        }

        $progress = [int][Math]::Min(99, [Math]::Floor($fileIndex * 100 / $sourceFiles.Count))
        Write-WorkerStatus "installing" $progress ("Устанавливаем {0}" -f $relative)
        Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
        if (-not (Test-Path -LiteralPath $destination -PathType Leaf)) {
            throw ("Не удалось установить файл: {0}" -f $relative)
        }

        $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
        $destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
        if ($sourceHash -ne $destinationHash) {
            throw ("Проверка файла не пройдена: {0}" -f $relative)
        }
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
