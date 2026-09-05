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
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class RVLUpdaterWindow {
    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateRoundRectRgn(int left, int top, int right, int bottom, int width, int height);

    [DllImport("user32.dll")]
    public static extern int SetWindowRgn(IntPtr handle, IntPtr region, bool redraw);
}
"@

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
    $form.ClientSize = New-Object System.Drawing.Size(540, 350)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "None"
    $form.ShowInTaskbar = $true
    $form.TopMost = $true
    $form.BackColor = [System.Drawing.Color]::FromArgb(7, 9, 17)

    $form.Add_Paint({
        param($sender, $event)
        $rect = New-Object System.Drawing.Rectangle(0, 0, $sender.Width, $sender.Height)
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $rect,
            [System.Drawing.Color]::FromArgb(20, 20, 20),
            [System.Drawing.Color]::FromArgb(7, 9, 17),
            135
        )
        $event.Graphics.FillRectangle($brush, $rect)
        $brush.Dispose()
    })

    $card = New-Object System.Windows.Forms.Panel
    $card.Location = New-Object System.Drawing.Point(1, 1)
    $card.Size = New-Object System.Drawing.Size(538, 348)
    $card.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)
    $form.Controls.Add($card)

    $accent = New-Object System.Windows.Forms.Panel
    $accent.Location = New-Object System.Drawing.Point(0, 0)
    $accent.Size = New-Object System.Drawing.Size(538, 3)
    $accent.BackColor = [System.Drawing.Color]::FromArgb(232, 232, 232)
    $card.Controls.Add($accent)

    $icon = New-Object System.Windows.Forms.Label
    $icon.AutoSize = $false
    $icon.Size = New-Object System.Drawing.Size(42, 42)
    $icon.Text = [char]0x2193
    $icon.TextAlign = "MiddleCenter"
    $icon.Font = New-Object System.Drawing.Font("Segoe UI Symbol", 20, [System.Drawing.FontStyle]::Bold)
    $icon.ForeColor = [System.Drawing.Color]::FromArgb(232, 232, 232)
    $icon.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
    $icon.Location = New-Object System.Drawing.Point(28, 23)
    $card.Controls.Add($icon)

    $brand = New-Object System.Windows.Forms.Label
    $brand.AutoSize = $true
    $brand.Text = "RVL"
    $brand.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $brand.ForeColor = [System.Drawing.Color]::FromArgb(240, 241, 248)
    $brand.Location = New-Object System.Drawing.Point(84, 25)
    $card.Controls.Add($brand)

    $badge = New-Object System.Windows.Forms.Label
    $badge.AutoSize = $false
    $badge.Size = New-Object System.Drawing.Size(126, 28)
    $badge.Text = "ЗАГРУЗКА"
    $badge.TextAlign = "MiddleCenter"
    $badge.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
    $badge.ForeColor = [System.Drawing.Color]::FromArgb(232, 232, 232)
    $badge.BackColor = [System.Drawing.Color]::FromArgb(27, 27, 27)
    $badge.Location = New-Object System.Drawing.Point(382, 20)
    $card.Controls.Add($badge)

    $title = New-Object System.Windows.Forms.Label
    $title.AutoSize = $true
    $title.Text = "Установка обновления"
    $title.Font = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $title.ForeColor = [System.Drawing.Color]::FromArgb(240, 241, 248)
    $title.Location = New-Object System.Drawing.Point(28, 93)
    $card.Controls.Add($title)

    $detail = New-Object System.Windows.Forms.Label
    $detail.AutoSize = $false
    $detail.Size = New-Object System.Drawing.Size(430, 25)
    $detail.Text = "Подключаемся к GitHub…"
    $detail.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $detail.ForeColor = [System.Drawing.Color]::FromArgb(145, 153, 177)
    $detail.Location = New-Object System.Drawing.Point(28, 140)
    $card.Controls.Add($detail)

    $percent = New-Object System.Windows.Forms.Label
    $percent.AutoSize = $false
    $percent.Size = New-Object System.Drawing.Size(72, 28)
    $percent.Text = "0%"
    $percent.TextAlign = "MiddleRight"
    $percent.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $percent.ForeColor = [System.Drawing.Color]::FromArgb(232, 232, 232)
    $percent.Location = New-Object System.Drawing.Point(430, 133)
    $card.Controls.Add($percent)

    $track = New-Object System.Windows.Forms.Panel
    $track.Location = New-Object System.Drawing.Point(28, 178)
    $track.Size = New-Object System.Drawing.Size(482, 10)
    $track.BackColor = [System.Drawing.Color]::FromArgb(43, 43, 43)
    $card.Controls.Add($track)

    $fill = New-Object System.Windows.Forms.Panel
    $fill.Location = New-Object System.Drawing.Point(28, 178)
    $fill.Size = New-Object System.Drawing.Size(2, 10)
    $fill.BackColor = [System.Drawing.Color]::FromArgb(232, 232, 232)
    $card.Controls.Add($fill)

    $stage = New-Object System.Windows.Forms.Label
    $stage.AutoSize = $false
    $stage.Size = New-Object System.Drawing.Size(482, 25)
    $stage.Text = "01  СКАЧАТЬ                 02  УСТАНОВИТЬ                 03  ПЕРЕЗАПУСК"
    $stage.Font = New-Object System.Drawing.Font("Segoe UI", 8)
    $stage.ForeColor = [System.Drawing.Color]::FromArgb(130, 130, 130)
    $stage.Location = New-Object System.Drawing.Point(28, 214)
    $card.Controls.Add($stage)

    $hint = New-Object System.Windows.Forms.Label
    $hint.AutoSize = $false
    $hint.Size = New-Object System.Drawing.Size(482, 34)
    $hint.Text = "Не закрывайте окно — RVL перезапустится автоматически."
    $hint.Font = New-Object System.Drawing.Font("Segoe UI", 8)
    $hint.ForeColor = [System.Drawing.Color]::FromArgb(130, 130, 130)
    $hint.Location = New-Object System.Drawing.Point(28, 270)
    $card.Controls.Add($hint)

    $form.Show()
    $region = [RVLUpdaterWindow]::CreateRoundRectRgn(0, 0, $form.Width + 1, $form.Height + 1, 26, 26)
    [RVLUpdaterWindow]::SetWindowRgn($form.Handle, $region, $true) | Out-Null
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
            $fill.Width = [int][Math]::Max(2, [Math]::Round(482 * $value / 100))
            $detail.Text = "Скачиваем файлы обновления…"
            [System.Windows.Forms.Application]::DoEvents()
        }
    }
    $output.Close()
    $inputStream.Close()
    $response.Close()

    $detail.Text = "Распаковываем и устанавливаем обновление…"
    $badge.Text = "УСТАНОВКА"
    $stage.Text = "01  СКАЧАТЬ                 02  УСТАНОВИТЬ                 03  ПЕРЕЗАПУСК"
    $percent.Text = "100%"
    $fill.Width = 482
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

    # Never install repository data from the update archive. The local data
    # folder contains user presets, settings, groups and launch history.
    $protectedRootNames = @("data", ".git", "package.zip")
    $updateItems = @(Get-ChildItem -LiteralPath $source -Force)
    foreach ($item in $updateItems) {
        if ($protectedRootNames -contains $item.Name) { continue }
        Copy-Item -LiteralPath $item.FullName -Destination (Join-Path $Target $item.Name) -Recurse -Force
    }

    $detail.Text = "Готово. Перезапускаем RVL…"
    $badge.Text = "ГОТОВО"
    $badge.ForeColor = [System.Drawing.Color]::FromArgb(126, 231, 166)
    $stage.Text = "01  СКАЧАНО                 02  УСТАНОВЛЕНО                 03  ПЕРЕЗАПУСК"
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
        $fill.Width = 482
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
