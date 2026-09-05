param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Target,
    [Parameter(Mandatory = $true)][string]$RestartPath,
    [string]$RestartArgs = "",
    [string]$StatusPath = "",
    [int]$WaitPid = 0
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Set-UpdateStatus([string]$value) {
    if ($StatusPath) {
        try { Set-Content -LiteralPath $StatusPath -Value $value -Encoding UTF8 } catch { }
    }
}

$work = $null
$form = $null

try {
    if ($Url -notmatch '^https://(github\.com|codeload\.github\.com|api\.github\.com)/') {
        throw "Недопустимый источник обновления"
    }

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "RVL — Обновление"
    $form.ClientSize = New-Object System.Drawing.Size(460, 286)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "None"
    $form.ShowInTaskbar = $true
    $form.TopMost = $true
    $form.BackColor = [System.Drawing.Color]::FromArgb(8, 9, 14)

    $card = New-Object System.Windows.Forms.Panel
    $card.Location = New-Object System.Drawing.Point(1, 1)
    $card.Size = New-Object System.Drawing.Size(458, 284)
    $card.BackColor = [System.Drawing.Color]::FromArgb(18, 20, 28)
    $form.Controls.Add($card)

    $accent = New-Object System.Windows.Forms.Panel
    $accent.Location = New-Object System.Drawing.Point(0, 0)
    $accent.Size = New-Object System.Drawing.Size(458, 3)
    $accent.BackColor = [System.Drawing.Color]::FromArgb(170, 181, 255)
    $card.Controls.Add($accent)

    $brand = New-Object System.Windows.Forms.Label
    $brand.AutoSize = $true
    $brand.Text = "RVL"
    $brand.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $brand.ForeColor = [System.Drawing.Color]::FromArgb(240, 241, 248)
    $brand.Location = New-Object System.Drawing.Point(22, 20)
    $card.Controls.Add($brand)

    $badge = New-Object System.Windows.Forms.Label
    $badge.AutoSize = $false
    $badge.Size = New-Object System.Drawing.Size(112, 25)
    $badge.Text = "ЗАГРУЗКА"
    $badge.TextAlign = "MiddleCenter"
    $badge.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
    $badge.ForeColor = [System.Drawing.Color]::FromArgb(170, 181, 255)
    $badge.BackColor = [System.Drawing.Color]::FromArgb(34, 37, 54)
    $badge.Location = New-Object System.Drawing.Point(324, 16)
    $card.Controls.Add($badge)

    $title = New-Object System.Windows.Forms.Label
    $title.AutoSize = $true
    $title.Text = "Установка обновления"
    $title.Font = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $title.ForeColor = [System.Drawing.Color]::FromArgb(240, 241, 248)
    $title.Location = New-Object System.Drawing.Point(22, 63)
    $card.Controls.Add($title)

    $detail = New-Object System.Windows.Forms.Label
    $detail.AutoSize = $false
    $detail.Size = New-Object System.Drawing.Size(410, 25)
    $detail.Text = "Подключаемся к GitHub…"
    $detail.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $detail.ForeColor = [System.Drawing.Color]::FromArgb(145, 153, 177)
    $detail.Location = New-Object System.Drawing.Point(22, 105)
    $card.Controls.Add($detail)

    $percent = New-Object System.Windows.Forms.Label
    $percent.AutoSize = $false
    $percent.Size = New-Object System.Drawing.Size(72, 28)
    $percent.Text = "0%"
    $percent.TextAlign = "MiddleRight"
    $percent.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $percent.ForeColor = [System.Drawing.Color]::FromArgb(170, 181, 255)
    $percent.Location = New-Object System.Drawing.Point(362, 98)
    $card.Controls.Add($percent)

    $track = New-Object System.Windows.Forms.Panel
    $track.Location = New-Object System.Drawing.Point(22, 139)
    $track.Size = New-Object System.Drawing.Size(410, 9)
    $track.BackColor = [System.Drawing.Color]::FromArgb(43, 46, 61)
    $card.Controls.Add($track)

    $fill = New-Object System.Windows.Forms.Panel
    $fill.Location = New-Object System.Drawing.Point(22, 139)
    $fill.Size = New-Object System.Drawing.Size(2, 9)
    $fill.BackColor = [System.Drawing.Color]::FromArgb(170, 181, 255)
    $card.Controls.Add($fill)

    $stage = New-Object System.Windows.Forms.Label
    $stage.AutoSize = $false
    $stage.Size = New-Object System.Drawing.Size(410, 25)
    $stage.Text = "01  Скачать        02  Установить        03  Перезапустить"
    $stage.Font = New-Object System.Drawing.Font("Segoe UI", 8)
    $stage.ForeColor = [System.Drawing.Color]::FromArgb(114, 122, 148)
    $stage.Location = New-Object System.Drawing.Point(22, 177)
    $card.Controls.Add($stage)

    $hint = New-Object System.Windows.Forms.Label
    $hint.AutoSize = $false
    $hint.Size = New-Object System.Drawing.Size(410, 34)
    $hint.Text = "Не закрывайте окно — RVL перезапустится автоматически."
    $hint.Font = New-Object System.Drawing.Font("Segoe UI", 8)
    $hint.ForeColor = [System.Drawing.Color]::FromArgb(114, 122, 148)
    $hint.Location = New-Object System.Drawing.Point(22, 218)
    $card.Controls.Add($hint)

    $form.Show()
    [System.Windows.Forms.Application]::DoEvents()

    $work = Join-Path ([IO.Path]::GetTempPath()) ("RVL-update-" + [guid]::NewGuid().ToString("N"))
    $archive = Join-Path $work "package.zip"
    $extract = Join-Path $work "extract"
    New-Item -ItemType Directory -Path $work -Force | Out-Null
    Set-UpdateStatus "downloading"

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
            $value = [int][Math]::Min(100, [Math]::Floor($downloaded * 100 / $total))
            $percent.Text = "{0}%" -f $value
            $fill.Width = [int][Math]::Max(2, [Math]::Round(410 * $value / 100))
            $detail.Text = "Скачиваем файлы обновления…"
            [System.Windows.Forms.Application]::DoEvents()
        }
    }
    $output.Close()
    $inputStream.Close()
    $response.Close()

    $detail.Text = "Распаковываем и устанавливаем обновление…"
    $badge.Text = "УСТАНОВКА"
    $stage.Text = "01  Скачать        02  Устанавливаем        03  Перезапустить"
    $percent.Text = "100%"
    $fill.Width = 410
    [System.Windows.Forms.Application]::DoEvents()
    Expand-Archive -LiteralPath $archive -DestinationPath $extract -Force

    if ($WaitPid -gt 0) {
        $detail.Text = "Ожидаем закрытия RVL…"
        [System.Windows.Forms.Application]::DoEvents()
        while (Get-Process -Id $WaitPid -ErrorAction SilentlyContinue) {
            Start-Sleep -Milliseconds 120
        }
    }

    $source = $extract
    $children = @(Get-ChildItem -LiteralPath $extract -Force)
    if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
        $source = $children[0].FullName
    }

    $skip = @("data", ".git", "package.zip")
    Get-ChildItem -LiteralPath $source -Force |
        Where-Object { $skip -notcontains $_.Name } |
        ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Target $_.Name) -Recurse -Force
        }

    $detail.Text = "Готово. Перезапускаем RVL…"
    $badge.Text = "ГОТОВО"
    $badge.ForeColor = [System.Drawing.Color]::FromArgb(126, 231, 166)
    $stage.Text = "01  Скачать        02  Установлено        03  Перезапускаем"
    Set-UpdateStatus "done"
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 700

    $form.Close()
    if ($RestartArgs) {
        Start-Process -FilePath $RestartPath -ArgumentList @('"' + $RestartArgs + '"')
    } else {
        Start-Process -FilePath $RestartPath
    }
} catch {
    $message = $_.Exception.Message
    Set-UpdateStatus ("error|" + $message)
    if ($form) {
        $title.Text = "Не удалось обновить RVL"
        $detail.Text = $message
        $detail.ForeColor = [System.Drawing.Color]::FromArgb(255, 160, 160)
        $badge.Text = "ОШИБКА"
        $badge.ForeColor = [System.Drawing.Color]::FromArgb(255, 160, 160)
        $badge.BackColor = [System.Drawing.Color]::FromArgb(72, 31, 42)
        $accent.BackColor = [System.Drawing.Color]::FromArgb(234, 89, 103)
        $fill.BackColor = [System.Drawing.Color]::FromArgb(234, 89, 103)
        $fill.Width = 410
        $stage.Text = "Проверьте подключение и повторите попытку"
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Seconds 7
        $form.Close()
    }
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
