# RVL game icon fetch worker.
# Resolves place avatar for the detail panel:
#   place id (method 1) or share code (method 2) -> universeId -> icon PNG.
# Runs hidden and writes a completion marker so the AHK host can poll cheaply.
param(
    [string]$Key = "",
    [string]$OutPath = "",
    [string]$DonePath = ""
)
$ErrorActionPreference = 'Stop'
function Finish([string]$ok) {
    try { Set-Content -LiteralPath $DonePath -Value $ok -Encoding Ascii } catch { }
    exit
}
try {
    if ($Key -eq '' -or $OutPath -eq '' -or $DonePath -eq '') { Finish '0' }
    $pidKey = ''
    if ($Key -match '^\d+$') {
        $pidKey = $Key
    } else {
        $code = $Key -replace '^[^:]*:', ''
        $amp = $code.IndexOf('&')
        if ($amp -ge 0) { $code = $code.Substring(0, $amp) }
        $code = $code -replace '[^a-zA-Z0-9]', ''
        if ($code -eq '') { Finish '0' }
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add('User-Agent', 'RVL-Updater')
        $page = $wc.DownloadString('https://www.roblox.com/share?code=' + $code + '&type=Server')
        $m = [regex]::Match($page, 'place_id"\s+content="(\d+)"')
        $pidKey = $m.Groups[1].Value
    }
    if ($pidKey -eq '') { Finish '0' }
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add('User-Agent', 'RVL-Updater')
    $u1 = $wc.DownloadString('https://apis.roblox.com/universes/v1/places/' + $pidKey + '/universe')
    $uni = [regex]::Match($u1, '"universeId"\s*:\s*([0-9]+)').Groups[1].Value
    if ($uni -eq '') { Finish '0' }
    $u2 = $wc.DownloadString('https://thumbnails.roblox.com/v1/games/icons?universeIds=' + $uni + '&size=150x150&format=Png')
    $iurl = [regex]::Match($u2, '"imageUrl"\s*:\s*"([^"]+)"').Groups[1].Value.Replace('\/', '/')
    if ($iurl -eq '') { Finish '0' }
    $wc.DownloadFile($iurl, $OutPath)
    if (Test-Path -LiteralPath $OutPath) { Finish '1' } else { Finish '0' }
} catch {
    Finish '0'
}
