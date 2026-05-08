; ============================================================
;  RobloxLauncher.ahk  v1.0
;  AHK v1.1+
; ============================================================
#SingleInstance, Force
#NoEnv
SetWorkingDir, %A_ScriptDir%

; ── Paths ───────────────────────────────────────────────────
global CFG     := A_ScriptDir "\data\config.ini"
global PRESETS := A_ScriptDir "\data\presets.json"
global LOG     := A_ScriptDir "\data\history.log"
global TMP_HTML := A_Temp "\RobloxLauncher_ui.html"

; ── Update config ────────────────────────────────────────────
global GITHUB_TOKEN  := "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"
global GITHUB_REPO   := "mozrze/RVL"
global LOCAL_VERSION := "1.0"
global UPDATE_FILES  := "ui/index.html|ui/style.css|ui/app.js"

; ── State ───────────────────────────────────────────────────
global WB
global hMainWnd := 0
global HotkeyKey    := ""
global HotkeyActive := false
global isReady      := false
global g_prevHotkey := ""

; ── DOM bridge ──────────────────────────────────────────────
global g_place        := ""
global g_link         := ""
global g_hkKey        := ""
global g_hkEn         := 0
global g_presets_json := ""

; ── Build combined HTML ─────────────────────────────────────
; ── Ensure data folder exists ────────────────────────────────
IfNotExist, %A_ScriptDir%\data
    FileCreateDir, %A_ScriptDir%\data

; ── Build combined HTML ──────────────────────────────────────
FileRead, uiCSS,  %A_ScriptDir%\ui\style.css
FileRead, uiJS,   %A_ScriptDir%\ui\app.js
FileRead, uiHTML, %A_ScriptDir%\ui\index.html

if (ErrorLevel) {
    MsgBox, 16, Roblox Launcher, UI files missing!`nПапка 'ui' должна содержать style.css, app.js и index.html
    ExitApp
}

; Fix image paths to absolute so they work from %TEMP%
imgDir := "file:///" . StrReplace(A_ScriptDir "\images\", "\", "/")
uiCSS := StrReplace(uiCSS, "images/icon_on.png",  imgDir . "icon_on.png")
uiCSS := StrReplace(uiCSS, "images/icon_off.png", imgDir . "icon_off.png")

styleTag  := "<style>`n" . uiCSS  . "`n</style>"
scriptTag := "<script>`n" . uiJS . "`n</script>"

uiHTML := StrReplace(uiHTML, "<link rel=""stylesheet"" href=""style.css"">", styleTag)
uiHTML := StrReplace(uiHTML, "<script src=""app.js""></script>", scriptTag)

FileDelete, %TMP_HTML%
FileAppend, %uiHTML%, %TMP_HTML%, UTF-8

; ── GUI ─────────────────────────────────────────────────────
Gui, +LastFound +ToolWindow -Caption -Border +HWNDhMainWnd
Gui, Margin, 0, 0
Gui, Color, 0F0F13
Gui, Add, ActiveX, x0 y0 w420 h510 vWB, Shell.Explorer

WB.silent := true
WB.navigate("file:///" . StrReplace(TMP_HTML, "\", "/"))

Loop, 100 {
    Sleep, 50
    state := 0
    try state := WB.readyState
    if (state = 4)
        break
}

; Kill any system frame / shadow rectangle
OnMessage(0x83, "WM_NCCALCSIZE")

Gui, Show, w420 h510, Roblox Launcher

; Apply rounded region AFTER window is shown
hRgn := DllCall("CreateRoundRectRgn", "Int", 0, "Int", 0, "Int", 420, "Int", 510, "Int", 44, "Int", 44, "Ptr")
DllCall("SetWindowRgn", "Ptr", hMainWnd, "Ptr", hRgn, "Int", 1)

; ── Tray ────────────────────────────────────────────────────
Menu, Tray, NoStandard
Menu, Tray, Add, Show Window,    ShowWindow
Menu, Tray, Add, Launch Roblox,  RunFromTray
Menu, Tray, Add
Menu, Tray, Add, Exit,           ExitApp
Menu, Tray, Default, Show Window
Menu, Tray, Click,  1
Menu, Tray, Tip,    Roblox Launcher

; ── Context paste hotkey (only inside launcher window) ──────
Hotkey, IfWinActive, Roblox Launcher
Hotkey, $^v, AHKPaste
Hotkey, IfWinActive

SetTimer, ProcessCommands, 50
Return

; ============================================================
;  Kill system frame rectangle (WM_NCCALCSIZE)
; ============================================================
WM_NCCALCSIZE(wParam, lParam, msg, hwnd) {
    global hMainWnd
    if (hwnd = hMainWnd) {
        return 0  ; entire window is client area → no border
    }
}

; ============================================================
ProcessCommands:
    Critical
    try {
        cmd := WB.document.title
        if (!InStr(cmd, "CMD:")) {
            return
        }

        WB.document.title := "ready"

        if (cmd = "CMD:ready") {
            Gosub, OnJsReady
        } else if (cmd = "CMD:launch") {
            Gosub, OnLaunch
        } else if (cmd = "CMD:save_close") {
            Gosub, OnSaveClose
        } else if (cmd = "CMD:minimize") {
            Gosub, OnMinimize
        } else if (cmd = "CMD:close") {
            Gosub, ExitApp
        } else if (cmd = "CMD:drag_start") {
            Gosub, OnDragStart
        } else if (cmd = "CMD:save_preset") {
            Gosub, OnSavePreset
        } else if (cmd = "CMD:del_preset") {
            Gosub, OnDelPreset
        } else if (cmd = "CMD:hotkey_update") {
            Gosub, OnHotkeyUpdate
        } else if (cmd = "CMD:capture_start") {
            Gosub, OnCaptureStart
        } else if (cmd = "CMD:update") {
            Gosub, OnUpdate
        }
    }
Return

; ============================================================
OnJsReady:
    isReady := true
    Gosub, InjectConfig
Return

OnLaunch:
    Gosub, ReadDom
    Gosub, SaveConfig
    LaunchRoblox(g_place, g_link)
Return

OnSaveClose:
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WritePresets
    FileDelete, %TMP_HTML%
    ExitApp
Return

OnMinimize:
    Gosub, ReadDom
    Gosub, SaveConfig
    Gui, Hide
Return

OnSavePreset:
    Gosub, ReadDom
    Gosub, WritePresets
Return

OnDelPreset:
    Gosub, ReadDom
    Gosub, WritePresets
Return

OnHotkeyUpdate:
    Gosub, ReadDom
    if (g_hkKey = "")
        g_hkKey := "F4"
    UpdateHotkey(g_hkKey, g_hkEn)
Return

; ============================================================
ReadDom:
    try {
        g_place        := WB.document.getElementById("inp-place").value
        g_link         := WB.document.getElementById("inp-link").value
        g_hkKey        := WB.document.getElementById("inp-key").value
        g_hkEn         := WB.document.getElementById("chk-enabled").checked ? 1 : 0
        g_presets_json := WB.document.getElementById("__presets_out").value
    } catch e {
        g_place := "" , g_link := "" , g_hkKey := "F4" , g_hkEn := 1
    }
Return

InjectConfig:
    IniRead, pid,  %CFG%, Settings, PlaceId,       133410800847665
    IniRead, lc,   %CFG%, Settings, LinkCode,       63587187475624144843883901936517
    IniRead, hk,   %CFG%, Settings, HotkeyKey,      F4
    IniRead, hken, %CFG%, Settings, HotkeyEnabled,  1

    pjson := "[]"
    if (FileExist(PRESETS)) {
        FileRead, pjson, %PRESETS%
        pjson := Trim(pjson)
        if (pjson = "")
            pjson := "[]"
    }

    try {
        WB.document.getElementById("__cfg_place").value   := pid
        WB.document.getElementById("__cfg_link").value    := lc
        WB.document.getElementById("__cfg_hotkey").value  := hk
        WB.document.getElementById("__cfg_enabled").value := hken
        WB.document.getElementById("__cfg_presets").value := pjson
        WB.document.parentWindow.execScript("initApp()")
    }

    if (hk = "")
        hk := "F4"
    UpdateHotkey(hk, hken)
Return

; ============================================================
SaveConfig:
    IniWrite, %g_place%, %CFG%, Settings, PlaceId
    IniWrite, %g_link%,  %CFG%, Settings, LinkCode
    IniWrite, %g_hkKey%, %CFG%, Settings, HotkeyKey
    IniWrite, %g_hkEn%,  %CFG%, Settings, HotkeyEnabled
Return

; ============================================================
;  AUTO-UPDATE
; ============================================================
RunUpdateCheck:
    CheckUpdate()
Return

CheckUpdate() {
    global GITHUB_TOKEN, GITHUB_REPO, LOCAL_VERSION, WB
    try {
        http := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        url  := "https://api.github.com/repos/" . GITHUB_REPO . "/contents/version.json"
        http.Open("GET", url, false)
        http.SetRequestHeader("Authorization", "token " . GITHUB_TOKEN)
        http.SetRequestHeader("Accept", "application/vnd.github.v3.raw")
        http.SetRequestHeader("User-Agent", "RobloxLauncher/1.0")
        http.Send()
        if (http.Status != 200)
            return
        body := http.ResponseText
        RegExMatch(body, """version""\s*:\s*""([^""]+)""", vm)
        RegExMatch(body, """changelog""\s*:\s*""([^""]+)""", cm)
        remoteVer := vm1
        changelog  := cm1
        if (remoteVer = "" || remoteVer = LOCAL_VERSION)
            return
        safe := StrReplace(changelog, "'", "\'")
        try WB.document.parentWindow.execScript("showUpdateBar('" . remoteVer . "','" . safe . "')")
    }
}

OnUpdate:
    SetTimer, ProcessCommands, Off
    failed := false
    Loop, Parse, UPDATE_FILES, |
    {
        remotePath := A_LoopField
        localPath  := A_ScriptDir . "\" . StrReplace(remotePath, "/", "\")
        if (!GithubDownload(remotePath, localPath)) {
            failed := true
        }
    }
    SetTimer, ProcessCommands, On
    if (failed) {
        MsgBox, 16, Roblox Launcher, Не удалось скачать обновление.`nПроверь интернет.
        return
    }
    MsgBox, 64, Roblox Launcher, Обновление установлено! Перезапуск...
    Reload
Return

GithubDownload(remotePath, localPath) {
    global GITHUB_TOKEN, GITHUB_REPO
    try {
        http := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        url  := "https://api.github.com/repos/" . GITHUB_REPO . "/contents/" . remotePath
        http.Open("GET", url, false)
        http.SetRequestHeader("Authorization", "token " . GITHUB_TOKEN)
        http.SetRequestHeader("Accept", "application/vnd.github.v3.raw")
        http.SetRequestHeader("User-Agent", "RobloxLauncher/1.0")
        http.Send()
        if (http.Status != 200) {
            return false
        }
        FileDelete, %localPath%
        f := FileOpen(localPath, "w", "UTF-8")
        f.Write(http.ResponseText)
        f.Close()
        return true
    }
    return false
}

WritePresets:
    if (g_presets_json = "")
        return
    try {
        f := FileOpen(PRESETS, "w", "UTF-8")
        f.Write(g_presets_json)
        f.Close()
    }
Return

; ============================================================
;  NATIVE DRAG
; ============================================================
OnDragStart:
    if (!hMainWnd)
        return
    DllCall("ReleaseCapture")
    DllCall("SendMessage", "Ptr", hMainWnd, "UInt", 0xA1, "Ptr", 2, "Ptr", 0)
Return

; ============================================================
;  KEY CAPTURE
; ============================================================
OnCaptureStart:
    global g_prevHotkey, HotkeyActive
    savedKey := g_prevHotkey

    if (savedKey != "") {
        try Hotkey, %savedKey%, Off
    }

    SetTimer, ProcessCommands, Off
    TrayTip, Roblox Launcher, Press any key... (Esc to cancel), 10, 1

    Input, key, L1 T10, {F1}{F2}{F3}{F4}{F5}{F6}{F7}{F8}{F9}{F10}{F11}{F12}{Left}{Up}{Right}{Down}{Insert}{Delete}{Home}{End}{PgUp}{PgDn}{Tab}{Enter}{Space}{Backspace}

    TrayTip

    keyName := ""
    cancelled := false

    if (ErrorLevel = "Timeout") {
        cancelled := true
    } else if (ErrorLevel = "NewInput") {
        cancelled := true
    } else if (InStr(ErrorLevel, "EndKey:") = 1) {
        StringReplace, keyName, ErrorLevel, EndKey:,, All
    } else if (ErrorLevel = "Max") {
        if (key != "") {
            keyName := key
            StringUpper, keyName, keyName
        }
    }

    if (cancelled || keyName = "") {
        if (savedKey != "") {
            try Hotkey, %savedKey%, HotkeyFire, On
            g_prevHotkey := savedKey
        }
        try {
            WB.document.parentWindow.execScript("stopCaptureExternal(null)")
        }
    } else {
        try {
            WB.document.getElementById("inp-key").value := keyName
            WB.document.getElementById("chk-enabled").checked := true
            WB.document.getElementById("toggle-track").className := "toggle-track on"
        }
        Gosub, ReadDom
        Gosub, SaveConfig
        UpdateHotkey(keyName, 1)
        try {
            WB.document.parentWindow.execScript("stopCaptureExternal('" . keyName . "')")
        }
    }

    SetTimer, ProcessCommands, On
Return

; ============================================================
;  HOTKEY REGISTRATION
; ============================================================
UpdateHotkey(newKey, enabled) {
    global HotkeyKey, HotkeyActive, g_prevHotkey

    if (g_prevHotkey != "") {
        try Hotkey, %g_prevHotkey%, HotkeyFire, Off
        g_prevHotkey := ""
    }

    HotkeyKey    := newKey
    HotkeyActive := (enabled && newKey != "")

    if (HotkeyActive) {
        try {
            Hotkey, %newKey%, HotkeyFire, On
            g_prevHotkey := newKey
            TrayTip, Roblox Launcher, Hotkey registered: %newKey%, 2, 1
        } catch err {
            HotkeyActive := false
            TrayTip, Roblox Launcher, Failed to register hotkey: %newKey%, 3, 3
        }
    } else {
        TrayTip, Roblox Launcher, Hotkey disabled, 2, 1
    }

    iconFile := HotkeyActive ? A_ScriptDir "\images\icon_on.png" : A_ScriptDir "\images\icon_off.png"
    Menu, Tray, Icon, %iconFile%
}

; ============================================================
;  HOTKEY FIRE
; ============================================================
HotkeyFire:
    if (!HotkeyActive)
        return

    try {
        hk_pid := WB.document.getElementById("inp-place").value
        hk_lc  := WB.document.getElementById("inp-link").value
    } catch e {
        hk_pid := ""
        hk_lc  := ""
    }

    if (hk_pid = "") {
        IniRead, hk_pid, %CFG%, Settings, PlaceId, 133410800847665
    }
    if (hk_lc = "") {
        IniRead, hk_lc, %CFG%, Settings, LinkCode, 63587187475624144843883901936517
    }

    LaunchRoblox(hk_pid, hk_lc)
Return

; ============================================================
LaunchRoblox(pid, lc) {
    global LOG
    url_app     := "roblox://experiences/start?placeId=" pid "&linkCode=" lc
    url_browser := "https://www.roblox.com/games/" pid "/?linkCode=" lc

    RegRead, handler, HKEY_CLASSES_ROOT, roblox\shell\open\command
    if (ErrorLevel || handler = "") {
        Run, %url_browser%
        result := "browser"
    } else {
        Run, %url_app%
        result := ErrorLevel ? "fail" : "ok"
    }

    FormatTime, ts,, yyyy-MM-dd HH:mm:ss
    FileAppend, [%ts%] placeId=%pid% linkCode=%lc% result=%result%`n, %LOG%
}

; ============================================================
;  AHK PASTE
; ============================================================
AHKPaste:
    clipText := Clipboard
    if (clipText = "") {
        return
    }
    try {
        active := WB.document.activeElement
        tag    := active.tagName
        typ    := active.type
        if (tag = "INPUT" && (typ = "text" || typ = "password")) {
            sel := WB.document.selection
            if (sel) {
                range := sel.createRange()
                range.text := clipText
                range.collapse(false)
                range.select()
            } else {
                active.value := active.value . clipText
            }
            return
        }
    } catch e {
    }
    SendInput, ^v
Return

; ============================================================
ShowWindow:
    Gui, Show
Return

RunFromTray:
    IniRead, pid, %CFG%, Settings, PlaceId,  133410800847665
    IniRead, lc, %CFG%, Settings, LinkCode, 63587187475624144843883901936517
    LaunchRoblox(pid, lc)
Return

ExitApp:
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WritePresets
    FileDelete, %TMP_HTML%
    ExitApp
Return

GuiClose:
    Gui, Hide
Return