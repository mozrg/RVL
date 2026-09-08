; ============================================================
;  RVL.ahk  v1.14
;  AHK v1.1+
; ============================================================
;@Ahk2Exe-SetIcon images\rvl.ico
#SingleInstance, Force
#NoEnv
SetWorkingDir, %A_ScriptDir%

; ── Paths ───────────────────────────────────────────────────
global CFG     := A_ScriptDir "\data\config.ini"
global PRESETS := A_ScriptDir "\data\presets.json"
global THEME_PRESETS := A_ScriptDir "\data\theme_presets.json"
global PRESET_GROUPS := A_ScriptDir "\data\preset_groups.json"
global LOG     := A_ScriptDir "\data\history.log"
global TMP_HTML := A_Temp "\RVL_ui.html"
global TMP_SETTINGS_HTML := A_Temp "\RVL_settings_ui.html"
global RVL_ICON := A_ScriptDir "\images\rvl.ico"
global APP_VERSION := "1.14"
global UPDATE_RELEASES := "https://api.github.com/repos/mozrg/RVL/releases/latest"
global UPDATE_RELEASES_LIST := "https://api.github.com/repos/mozrg/RVL/releases?per_page=1"
global UPDATE_TAGS := "https://api.github.com/repos/mozrg/RVL/tags?per_page=10"
global UPDATE_STATUS_FILE := A_Temp "\RVL_update_status.txt"

; ── Assignable hotkey keys ─────────────────────────────────
; Single list shared by every capture (main, per-preset, show/hide).
; Parsed with Loop, Parse on "," — no entry may contain a comma.
; Excluded on purpose: ";" (breaks the preset-hk map), "," (delimiter),
; the AHK hotkey modifier symbols ! ^ + # $ * ~ < >, and the punctuation
; keys [ ] ' \ ` — the Hotkey command DEADLOCKS on those names in
; AHK v1.1.36 (verified; . / - = register cleanly and are kept).
global HK_CAPTURE_KEYS := "Numpad0,Numpad1,Numpad2,Numpad3,Numpad4,Numpad5,Numpad6,Numpad7,Numpad8,Numpad9"
     . ",NumpadDot,NumpadDiv,NumpadMult,NumpadAdd,NumpadSub,NumpadEnter"
     . ",F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12,F13,F14,F15,F16,F17,F18,F19,F20,F21,F22,F23,F24"
     . ",Left,Up,Right,Down,Insert,Delete,Home,End,PgUp,PgDn"
     . ",Tab,Space,Enter,Backspace"
     . ",AppsKey,PrintScreen,ScrollLock,Pause,CapsLock,NumLock"
     . ",A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z"
     . ",0,1,2,3,4,5,6,7,8,9"
     . ",Volume_Mute,Volume_Down,Volume_Up"
     . ",Media_Next,Media_Prev,Media_Play_Pause,Media_Stop"
     . ",Browser_Back,Browser_Forward,Browser_Refresh,Browser_Search,Browser_Stop,Browser_Favorites"
     . ",Launch_App1,Launch_App2,Launch_Mail,Launch_Media"
     . ",.,/,-,="

; ── State ───────────────────────────────────────────────────
global WB
global SettingsWB
global hMainWnd := 0
global hSettingsWnd := 0
global g_command_source := "main"
global g_settings_ready := false
global SETTINGS_W := 540
global SETTINGS_H := 720
global HotkeyKey    := ""
global HotkeyActive := false
global g_auto_minimize := 0
global isReady      := false
global g_prevHotkey := ""
global g_roblox_running := -1   ; -1 = unknown, 0 = off, 1 = on
global g_roblox_pending := -1  ; debounce buffer for Roblox status (Bug 6)
global g_last_resize_req := ""  ; FIX: track last applied size
global g_tray_fav_data := {}    ; Enhancement D1: tray fav preset data

; ── Preset hotkeys ───────────────────────────────────────────
global g_preset_hotkeys := []
global g_preset_hk_data := {}

; ── Game icon fetch (worker) state ──────────────────────────
global g_thumb_key := ""
global g_thumb_path := ""
global g_thumb_doc := 0
global g_thumb_step := 0
global g_thumb_ticks := 0
global g_thumb_pending_key := ""
global g_thumb_launch_key := ""

; ── DOM bridge ──────────────────────────────────────────────
global g_place        := ""
global g_link         := ""
global g_method       := "1"   ; "1" = Place ID + Link Code,  "2" = Share Code
global g_hkKey        := ""
global g_hkEn         := 0
global g_presets_json := ""
global g_preset_groups_json := ""
global g_theme_mode   := "dark"
global g_theme_bg     := "#0A0A0A"
global g_theme_surface := "#111111"
global g_theme_text   := "#E8E8E8"
global g_theme_accent := "#FFFFFF"
global g_scale        := "1.0"
global g_theme_grad_en    := 0
global g_theme_grad_bg2   := "#0A0A0A"
global g_theme_grad_angle := 135
global g_theme_grad_op    := 100
global g_launch_delay     := 0
global g_tooltips     := 1
global g_ui_hidden    := ""
global g_ui_text      := ""
global g_shKey        := ""
global g_shEn         := 0
global g_mask_inputs  := 1
global g_always_on_top := 0
global g_autostart := "0"
global g_prevShHotkey := ""
global g_windowVisible := true
global g_update_state := "idle"
global g_update_url := ""
global g_update_version := ""
global g_update_notice := ""
global g_update_exit_pending := false
global g_update_started_at := 0
global g_update_worker_pid := 0

; A previous updater writes a one-shot result before restarting the app.
if (FileExist(UPDATE_STATUS_FILE)) {
    FileRead, updateNoticeRaw, %UPDATE_STATUS_FILE%
    updateNoticeRaw := Trim(updateNoticeRaw)
    if (SubStr(updateNoticeRaw, 1, 4) = "done")
        g_update_notice := updateNoticeRaw
    try FileDelete, %UPDATE_STATUS_FILE%
}

; ── Build combined HTML ─────────────────────────────────────
; ── Ensure data folder exists ────────────────────────────────
IfNotExist, %A_ScriptDir%\data
    FileCreateDir, %A_ScriptDir%\data

; ── Build combined HTML ──────────────────────────────────────
FileRead, uiCSS,  *P65001 %A_ScriptDir%\ui\style.css
FileRead, uiJS,   *P65001 %A_ScriptDir%\ui\app.js
FileRead, uiHTML, *P65001 %A_ScriptDir%\ui\index.html

if (ErrorLevel) {
    MsgBox, 16, RVL, UI files missing!`nFolder 'ui' must contain style.css, app.js and index.html
    ExitApp
}
; Fix image paths to absolute so they work from %TEMP%
imgDir := "file:///" . StrReplace(A_ScriptDir "\images\", "\", "/")
uiCSS := StrReplace(uiCSS, "images/rvl.png",       imgDir . "rvl.png")
uiHTML := StrReplace(uiHTML, "src=""images/rvl.png""", "src=""" . imgDir . "rvl.png""")

styleTag  := "<style>`n" . uiCSS  . "`n</style>"
scriptTag := "<script>`n" . uiJS . "`n</script>"

uiHTML := StrReplace(uiHTML, "<link rel=""stylesheet"" href=""style.css"">", styleTag)
uiHTML := StrReplace(uiHTML, "<script src=""app.js""></script>", scriptTag)

FileDelete, %TMP_HTML%
FileAppend, %uiHTML%, %TMP_HTML%, UTF-8
try FileDelete, %TMP_SETTINGS_HTML%
FileAppend, %uiHTML%, %TMP_SETTINGS_HTML%, UTF-8

; ── UI messages (ui\messages.txt, UTF-8) ────────────────────
; The script file may be saved in any encoding (editors and tools tend to
; strip the UTF-8 BOM, which makes AHK v1 misparse Cyrillic literals as
; cp1251 mojibake). Every user-facing string therefore lives in a UTF-8
; data file that is read with the same *P65001 rule as the ui\ sources.
; NEVER inline Russian literals in this script.
g_msgs := {}
msgsFile := A_ScriptDir "\ui\messages.txt"
if (FileExist(msgsFile)) {
    FileRead, msgsRaw, *P65001 %msgsFile%
    Loop, Parse, msgsRaw, `n, `r
    {
        eqPos := InStr(A_LoopField, "=")
        if (eqPos > 1)
            g_msgs[SubStr(A_LoopField, 1, eqPos - 1)] := SubStr(A_LoopField, eqPos + 1)
    }
}

; UiMsg("key", "ASCII fallback") — the fallback keeps the app readable even
; if ui\messages.txt is missing or damaged.
UiMsg(key, fallback) {
    global g_msgs
    v := g_msgs[key]
    return (v != "") ? v : fallback
}

; ── GUI ─────────────────────────────────────────────────────
Gui, +LastFound +ToolWindow -Caption -Border +HWNDhMainWnd
Gui, Margin, 0, 0
; Use lime green as transparency key — corners outside CSS border-radius
; become fully transparent, hiding the sharp window rectangle corners
Gui, Color, 00FF00
WinSet, TransColor, 00FF00
Gui, Add, ActiveX, x0 y0 w420 h610 vWB, Shell.Explorer

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
OnMessage(0x84, "WM_NCHITTEST")

Gui, Show, Center w420 h610, RVL

; Start the splash timer when the native window is actually visible. The
; browser page can finish loading several seconds before Gui, Show, which
; otherwise makes the startup screen disappear almost immediately.
try {
    WB.document.parentWindow.execScript("markStartupVisible()")
}

; Always keep the initial window centered. Older WindowX/WindowY values are
; intentionally ignored so a previously saved off-center position cannot
; override the Center option above.

; Apply rounded region AFTER window is shown.
; Radius is 16px to match the CSS body/html border-radius (16px).
; Mismatch between window region radius and CSS radius caused a visible
; transparent gap in the corners (the GUI background colour leaked
; through between the 44px region clip and the 16px body clip).
global CORNER_RADIUS := 16
hRgn := DllCall("CreateRoundRectRgn", "Int", 0, "Int", 0, "Int", 420, "Int", 610, "Int", CORNER_RADIUS, "Int", CORNER_RADIUS, "Ptr")
DllCall("SetWindowRgn", "Ptr", hMainWnd, "Ptr", hRgn, "Int", 1)

; Keep the native startup window visible long enough for the user to read it.
; This host-level delay is intentional: JavaScript timers start while the
; WebBrowser control is still painting and cannot guarantee visible time.
Sleep, 4000

; ── Tray ────────────────────────────────────────────────────
Menu, Tray, NoStandard
if FileExist(RVL_ICON)
    Menu, Tray, Icon, %RVL_ICON%
Menu, Tray, Add, Show Window,    ShowWindow
Menu, Tray, Add, Launch Roblox,  RunFromTray
Menu, Tray, Add
Menu, Tray, Add, Exit,           ExitApp
Menu, Tray, Default, Show Window
Menu, Tray, Click,  1
Menu, Tray, Tip,    RVL

; ── Editing hotkeys inside launcher window ──────────────────
Hotkey, IfWinActive, RVL
Hotkey, $^v, AHKPaste
Hotkey, $^a, AHKSelectAll
Hotkey, $^z, AHKUndo
Hotkey, $^y, AHKRedo
Hotkey, $^c, AHKCopy
Hotkey, $^x, AHKCut
Hotkey, IfWinActive

SetTimer, ProcessCommands,    50
; Keep update installation independent from the general DOM command queue.
; Some long-running UI actions temporarily pause ProcessCommands.
SetTimer, PollUpdateInstall, 100
; Lightweight command bridge used by the working Mmacro updater pattern.
SetTimer, PollJSCmd, 20
; Read real download progress from the background updater worker.
SetTimer, PollUpdateStatus, 100
SetTimer, UpdateRobloxStatus, 2000
Return


; ============================================================
;  EXPORT THEME PRESETS
; ============================================================
OnExportThemePresets:
    Gosub, ReadDom
    if (g_theme_presets = "" || g_theme_presets = "[]") {
        TrayTip, RVL, No theme presets to export, 2, 2
        return
    }
    FileSelectFile, savePath, S16, %A_ScriptDir%\data\theme_presets.json, Export theme presets — choose file, JSON files (*.json)
    if (savePath = "")
        return
    try {
        f := FileOpen(savePath, "w", "UTF-8")
        f.Write(g_theme_presets)
        f.Close()
        TrayTip, RVL, Theme presets exported successfully, 2, 1
    } catch e {
        TrayTip, RVL, Export failed: %e%, 3, 3
    }
Return

; ============================================================
;  IMPORT THEME PRESETS
; ============================================================
OnImportThemePresets:
    FileSelectFile, loadPath, 3,, Import theme presets — choose file, JSON files (*.json)
    if (loadPath = "")
        return
    FileRead, importData, %loadPath%
    importData := Trim(importData)
    if (importData = "") {
        TrayTip, RVL, File is empty, 2, 2
        return
    }
    try {
        WB.document.getElementById("__import_theme_data").value := importData
        WB.document.parentWindow.execScript("importThemePresetsFromAHK()")
        TrayTip, RVL, Theme presets imported, 2, 1
    } catch e {
        TrayTip, RVL, Import failed, 3, 3
    }
Return
; ============================================================
;  Kill system frame rectangle (WM_NCCALCSIZE)
; ============================================================
WM_NCCALCSIZE(wParam, lParam, msg, hwnd) {
    global hMainWnd, hSettingsWnd
    if (hwnd = hMainWnd || hwnd = hSettingsWnd) {
        return 0  ; entire window is client area → no border
    }
}

; ============================================================
;  WM_NCHITTEST — native drag
;  Reads titlebar height and control-zone width from JS-published
;  hidden inputs so the drag zone stays correct at any scale.
;  Fallbacks (46px / 100px) cover the period before JS reports metrics.
; ============================================================
WM_NCHITTEST(wParam, lParam, msg, hwnd) {
    global hMainWnd, hSettingsWnd, WB
    mouseX := lParam & 0xFFFF
    mouseY := (lParam >> 16) & 0xFFFF
    if (mouseX >= 0x8000)
        mouseX -= 0x10000
    if (mouseY >= 0x8000)
        mouseY -= 0x10000

    if (hwnd = hSettingsWnd) {
        WinGetPos, settingsX, settingsY, , , ahk_id %hSettingsWnd%
        settingsRelY := mouseY - settingsY
        ; The settings header remains draggable even though the native frame
        ; is removed, matching the frameless main RVL window.
        if (settingsRelY >= 0 && settingsRelY <= 52)
            return 2
        return 1
    }

    if (hwnd != hMainWnd)
        return
    WinGetPos, winX, winY, winW, , ahk_id %hMainWnd%
    relY := mouseY - winY
    relX := mouseX - winX

    ; Read dynamic titlebar height from JS (defaults to 46 before JS loads)
    tbH := 46
    try {
        v := WB.document.getElementById("__titlebar_h").value
        if (v != "")
            tbH := v + 0
    }
    ; Read dynamic control-zone width from JS (defaults to 100)
    czW := 100
    try {
        v2 := WB.document.getElementById("__ctrl_zone_w").value
        if (v2 != "")
            czW := v2 + 0
    }
    if (tbH < 20)
        tbH := 46
    if (czW < 40)
        czW := 100

    if (relY >= 0 && relY <= tbH && relX < winW - czW)
        return 2
}

; ============================================================
ProcessCommands:
    Critical
    try {
        ; FIX: read resize request every tick — JS overwrites title too fast
        ; for AHK to catch CMD:resize when it is immediately followed by another command
        req := WB.document.getElementById("__resize_req").value
        if (req != "" && req != g_last_resize_req) {
            g_last_resize_req := req
            parts := StrSplit(req, "x")
            if (parts.MaxIndex() = 2) {
                ResizeWindow(parts[1], parts[2])
            }
        }

        ; Direct one-shot bridge for the settings button.  Keep the queue
        ; fallback below for compatibility, but do not rely on it for the
        ; first click while the WebBrowser control is changing focus.
        openSettingsReq := "0"
        try openSettingsReq := WB.document.getElementById("__open_settings_req").value
        if (openSettingsReq = "1") {
            try WB.document.getElementById("__open_settings_req").value := "0"
            Gosub, OpenSettingsWindow
        }

        ; ── Command queue: drain all pending commands in one tick ──
        ; Replaces document.title polling. JS pushes "CMD:foo\n" lines
        ; into __cmd_queue; we read the whole buffer, clear it, then
        ; dispatch each non-empty line. This eliminates the race where
        ; two commands fired within 50ms would overwrite each other
        ; under the old title-based approach.
        qBuf := ""
        try qBuf := WB.document.getElementById("__cmd_queue").value
        if (qBuf != "") {
            ; Clear the queue immediately so JS can keep appending
            try WB.document.getElementById("__cmd_queue").value := ""
            ; Split on newline and dispatch each command
            Loop, Parse, qBuf, `n
            {
                cmd := Trim(A_LoopField)
                if (cmd = "")
                    continue
                ; Isolate every command: a failure in one handler (e.g. a
                ; file command throwing) must never abort the tick and
                ; silently drop the remaining queued commands, which once
                ; lost the startup CMD:check_update and broke the whole
                ; icon pipeline behind it.
                try {
                    Gosub, DispatchCommand
                } catch e {
                    ThumbLog("cmd EXC [" . cmd . "] " . e.What . ": " . e.Message . " @line " . e.Line)
                }
            }
        }

        ; Direct install bridge fallback. JS sets this flag before sending
        ; the normal queue command, so an old WebBrowser control cannot lose
        ; the user's click while an overlay is closing.
        installReq := "0"
        try installReq := WB.document.getElementById("__update_install_req").value
        if (installReq = "1") {
            try WB.document.getElementById("__update_install_req").value := "0"
            if (g_update_state = "available")
                Gosub, StartUpdateDownload
        }

        Gosub, ProcessSettingsCommands
        Gosub, SyncUpdateToSettingsPopup
    }
Return

; ============================================================
;  DETACHED SETTINGS WINDOW COMMANDS
;  The settings page has its own queue. During dispatch WB temporarily points
;  to that page, so all existing handlers keep working without duplicating the
;  settings implementation or changing the visual design.
; ============================================================
ProcessSettingsCommands:
    if (!hSettingsWnd)
        return
    ; The child document starts with the same HTML as the main page.  Ignore
    ; its bridge until the host has copied the real current state and finished
    ; initNativeSettingsPopup(), otherwise defaults can overwrite the main UI.
    if (!g_settings_ready)
        return

    qBuf := ""
    try qBuf := SettingsWB.document.getElementById("__cmd_queue").value
    if (qBuf = "")
        return
    try SettingsWB.document.getElementById("__cmd_queue").value := ""

    mainWB := WB
    g_command_source := "settings"
    Loop, Parse, qBuf, `n
    {
        cmd := Trim(A_LoopField)
        if (cmd = "")
            continue

        ; Copy the current settings page state before every command. The
        ; regular handlers then read the detached page through WB below.
        WB := mainWB
        Gosub, SyncSettingsPopupToMain
        WB := SettingsWB
        try {
            Gosub, DispatchCommand
        } catch e {
            ThumbLog("cmd EXC [" . cmd . "] " . e.What . ": " . e.Message . " @line " . e.Line)
        }

        ; settings_save closes the native child. Do not touch its COM object
        ; again while draining a queue that may contain another line.
        if (!hSettingsWnd)
            break
    }
    WB := mainWB
    g_command_source := "main"
Return

; ============================================================
;  UPDATE INSTALL POLL
;  Dedicated bridge for the install button. It deliberately does not rely
;  on the command queue, because the legacy WebBrowser control can retain a
;  queued command while another UI action is running.
; ============================================================
PollUpdateInstall:
    Critical
    try {
        installReq := WB.document.getElementById("__update_install_req").value
        if (installReq = "1") {
            WB.document.getElementById("__update_install_req").value := "0"
            if (g_update_state = "available")
                Gosub, StartUpdateDownload
        }
    }
Return

; ============================================================
;  SIMPLE JS COMMAND BRIDGE
;  Mmacro uses window.ahkCmd for one-shot commands. Keep this dedicated
;  poller for the update action so installation does not depend on the
;  larger DOM queue or a modal animation finishing in the same tick.
; ============================================================
PollJSCmd:
    Critical
    cmd := ""
    try {
        cmd := WB.document.parentWindow.ahkCmd
        if (cmd != "")
            WB.document.parentWindow.ahkCmd := ""
    }
    if (cmd = "CMD:install_update" && g_update_state = "available")
        Gosub, StartUpdateDownload
Return

; ============================================================
; Dispatch a single CMD:xxx line read from the queue.
; Sets global `cmd` and falls through to the matching handler.
; ============================================================
DispatchCommand:
    if (cmd = "CMD:open_settings") {
        Gosub, OpenSettingsWindow
    } else if (cmd = "CMD:close_settings") {
        Gosub, CloseSettingsWindow
    } else if (cmd = "CMD:ready") {
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
    } else if (cmd = "CMD:settings_save") {
        Gosub, OnSettingsSave
    } else if (cmd = "CMD:settings_live") {
        ; The popup state is copied to the main document before dispatch.
    } else if (cmd = "CMD:set_opacity") {
        Gosub, OnSetOpacity
    } else if (cmd = "CMD:set_always_on_top") {
        Gosub, OnSetAlwaysOnTop
    } else if (cmd = "CMD:set_autostart") {
        Gosub, OnSetAutostart
    } else if (cmd = "CMD:sh_capture_start") {
        Gosub, OnSHCaptureStart
    } else if (cmd = "CMD:sh_hotkey_update") {
        Gosub, OnSHHotkeyUpdate
    } else if (cmd = "CMD:capture_start") {
        Gosub, OnCaptureStart
    } else if (cmd = "CMD:capture_preset_hk") {
        Gosub, OnCapturePresetHK
    } else if (cmd = "CMD:update_preset_hk") {
        Gosub, UpdatePresetHotkeys
    } else if (SubStr(cmd, 1, 14) = "CMD:thumb_req ") {
        Gosub, OnThumbRequest
    } else if (cmd = "CMD:export_presets") {
        Gosub, OnExportPresets
    } else if (cmd = "CMD:import_presets") {
        Gosub, OnImportPresets
    } else if (cmd = "CMD:resize") {
        ; Resize is already handled above via __resize_req polling — no action needed here
    } else if (cmd = "CMD:factory_reset") {
        Gosub, OnFactoryReset
    } else if (cmd = "CMD:export_theme_presets") {
        Gosub, OnExportThemePresets
    } else if (cmd = "CMD:import_theme_presets") {
        Gosub, OnImportThemePresets
    } else if (cmd = "CMD:save_preset_groups") {
        Gosub, OnSavePresetGroups
    } else if (cmd = "CMD:copy_clipboard") {
        Gosub, OnCopyClipboard
    } else if (cmd = "CMD:load_history") {
        Gosub, OnLoadHistory
    } else if (cmd = "CMD:clear_history") {
        Gosub, OnClearHistory
    } else if (cmd = "CMD:backup_create") {
        Gosub, OnBackupCreate
    } else if (cmd = "CMD:backup_restore") {
        Gosub, OnBackupRestore
    } else if (cmd = "CMD:reload_state") {
        Gosub, OnReloadState
    } else if (cmd = "CMD:export_stats") {
        Gosub, OnExportStats
    } else if (cmd = "CMD:save_window_pos") {
        Gosub, OnSaveWindowPos
    } else if (cmd = "CMD:check_update") {
        Gosub, OnCheckUpdate
    } else if (cmd = "CMD:install_update") {
        Gosub, StartUpdateDownload
    }
Return

; ============================================================
;  DETACHED SETTINGS WINDOW
; ============================================================
OpenSettingsWindow:
    if (hSettingsWnd) {
        if (g_settings_ready) {
            Gui, Settings:Show
            WinActivate, ahk_id %hSettingsWnd%
        }
        return
    }

    g_settings_ready := false
    Gui, Settings:New, +LastFound +ToolWindow -Caption -Border +HWNDhSettingsWnd +Owner%hMainWnd%
    Gui, Settings:Margin, 0, 0
    ; Use a real dark background.  A lime transparency key leaked through
    ; while the ActiveX document was painting and caused the green flash.
    Gui, Settings:Color, 0F0F0F
    Gui, Settings:Add, ActiveX, x0 y0 w%SETTINGS_W% h%SETTINGS_H% vSettingsWB, Shell.Explorer

    SettingsWB.silent := true
    SettingsWB.navigate("file:///" . StrReplace(TMP_SETTINGS_HTML, "\", "/") . "#settings-native")
    SysGet, settingsArea, MonitorWorkArea, 1
    settingsX := settingsAreaLeft + ((settingsAreaRight - settingsAreaLeft - SETTINGS_W) // 2)
    settingsY := settingsAreaTop + ((settingsAreaBottom - settingsAreaTop - SETTINGS_H) // 2)
    Gui, Settings:Show, Hide x%settingsX% y%settingsY% w%SETTINGS_W% h%SETTINGS_H%, % UiMsg("settings_title", "RVL Settings")

    ; Match the rounded surface used by the existing HTML design.
    settingsRgn := DllCall("CreateRoundRectRgn", "Int", 0, "Int", 0, "Int", SETTINGS_W, "Int", SETTINGS_H, "Int", CORNER_RADIUS, "Int", CORNER_RADIUS, "Ptr")
    DllCall("SetWindowRgn", "Ptr", hSettingsWnd, "Ptr", settingsRgn, "Int", 1)

    ; Initialize asynchronously so the main window is never blocked while the
    ; child WebBrowser paints. The native-mode CSS already hides the splash.
    SetTimer, InitSettingsWindow, 50
    Gosub, InitSettingsWindow
Return

InitSettingsWindow:
    if (!hSettingsWnd)
        return
    settingsState := 0
    try settingsState := SettingsWB.readyState
    if (settingsState != 4)
        return
    SetTimer, InitSettingsWindow, Off
    Gosub, SyncMainToSettingsPopup
    try SettingsWB.document.parentWindow.execScript("initNativeSettingsPopup()")
    Gosub, SyncUpdateToSettingsPopup
    g_settings_ready := true
    Gui, Settings:Show, x%settingsX% y%settingsY% w%SETTINGS_W% h%SETTINGS_H%, % UiMsg("settings_title", "RVL Settings")
    WinActivate, ahk_id %hSettingsWnd%
Return

CloseSettingsWindow:
    g_settings_ready := false
    if (!hSettingsWnd)
        return
    SetTimer, InitSettingsWindow, Off
    Gui, Settings:Destroy
    SettingsWB := ""
    hSettingsWnd := 0
Return

; Copy all settings fields, including hidden AHK bridge values, between the
; two identical HTML documents. Using one list keeps imports, theme presets,
; hotkey capture and future settings controls working in the child window.
CopySettingsDom(sourceWB, targetWB) {
    valueIds := "__cfg_place|__cfg_link|__cfg_hotkey|__cfg_enabled|__cfg_method|__cfg_presets|__cfg_theme_mode|__cfg_theme_bg|__cfg_theme_surface|__cfg_theme_text|__cfg_theme_accent|__cfg_auto_minimize|__cfg_scale|__cfg_launch_delay|__cfg_theme_grad_en|__cfg_theme_grad_bg2|__cfg_theme_grad_angle|__cfg_theme_grad_op|__cfg_tooltips|__cfg_lang|__cfg_last_preset|__last_loaded_preset_id|__cfg_opacity|__cfg_sh_key|__cfg_sh_en|__cfg_mask_inputs|__cfg_always_on_top|__cfg_autostart|__cfg_compact_mode|__cfg_sort_mode|__cfg_theme_presets|__cfg_preset_groups|__presets_out|__theme_presets_out|__preset_groups_out|__import_data|__import_theme_data|__clipboard_data|__history_data|__dash_export_req|__app_version|__cfg_ui_hidden|__cfg_ui_text"
    Loop, Parse, valueIds, |
    {
        fieldId := A_LoopField
        try targetWB.document.getElementById(fieldId).value := sourceWB.document.getElementById(fieldId).value
    }

    visibleIds := "inp-place|inp-link|inp-share-code|inp-key|theme-mode|theme-bg|theme-surface|theme-text|theme-accent|theme-grad-bg2|theme-grad-angle|opacity-slider|sh-key-box|tp-name-inp"
    Loop, Parse, visibleIds, |
    {
        fieldId := A_LoopField
        try targetWB.document.getElementById(fieldId).value := sourceWB.document.getElementById(fieldId).value
    }

    checkedIds := "chk-enabled|chk-gradient|chk-auto-minimize|chk-tooltips|chk-mask-inputs|chk-always-on-top|chk-autostart|chk-compact-mode|sh-chk-enabled"
    Loop, Parse, checkedIds, |
    {
        fieldId := A_LoopField
        try targetWB.document.getElementById(fieldId).checked := sourceWB.document.getElementById(fieldId).checked
    }
}

SyncMainToSettingsPopup:
    if (!hSettingsWnd)
        return
    CopySettingsDom(WB, SettingsWB)
Return

SyncSettingsPopupToMain:
    if (!hSettingsWnd || !g_settings_ready)
        return
    CopySettingsDom(SettingsWB, WB)
    try WB.document.parentWindow.execScript("syncSettingsFromNativeBridge()")
Return

SyncUpdateToSettingsPopup:
    if (!hSettingsWnd)
        return
    updateIds := "__update_state|__update_version|__update_message|__update_progress|__update_notice"
    Loop, Parse, updateIds, |
    {
        fieldId := A_LoopField
        try SettingsWB.document.getElementById(fieldId).value := WB.document.getElementById(fieldId).value
    }
    try SettingsWB.document.parentWindow.execScript("refreshUpdateBridge()")
Return

; ============================================================
OnJsReady:
    isReady := true
    Gosub, InjectConfig
    Gosub, UpdatePresetHotkeys   ; register any hotkeys stored in presets
    Gosub, RebuildTrayMenu       ; Enhancement D1: build tray with favorites
Return

OnLaunch:
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WritePresets
    if (g_auto_minimize = 1 || g_auto_minimize = "1") {
        Gui, Hide
        g_windowVisible := false
    }
    if (g_method = "2") {
        LaunchRobloxShare(g_link)
    } else {
        LaunchRoblox(g_place, g_link)
    }
Return

OnSaveClose:
    Gosub, CloseSettingsWindow
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WritePresets
    Gosub, WriteThemePresets
    Gosub, WritePresetGroups
    try FileDelete, %TMP_HTML%
    try FileDelete, %TMP_SETTINGS_HTML%
    ExitApp
Return

OnMinimize:
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WriteThemePresets
    Gosub, WritePresetGroups
    g_windowVisible := false
    Gui, Hide
Return

OnSavePreset:
    Gosub, ReadDom
    Gosub, WritePresets
    Gosub, SaveConfig
    Gosub, RebuildTrayMenu
Return

OnSavePresetGroups:
    Gosub, ReadDom
    Gosub, WritePresets
    Gosub, WritePresetGroups
Return

OnDelPreset:
    Gosub, ReadDom
    Gosub, WritePresets
    Gosub, RebuildTrayMenu
Return

OnHotkeyUpdate:
    Gosub, ReadDom
    if (g_hkKey = "")
        g_hkKey := "F4"
    UpdateHotkey(g_hkKey, g_hkEn)
Return

OnSettingsSave:
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WriteThemePresets
    if (g_command_source = "settings")
        Gosub, CloseSettingsWindow
Return

; ============================================================
;  UPDATE CHECK / DOWNLOAD
;  GitHub Releases is the source of truth for the installed version.
;  No GitHub token is embedded in the application.
; ============================================================
OnCheckUpdate:
    if (g_update_state = "available") {
        Gosub, StartUpdateDownload
        return
    }

    g_update_state := "checking"
    ThumbLog("check_update begin")
    SetUpdateBridge("checking", "", UiMsg("checking", "Checking for updates..."), 0)
    ThumbLog("msg=[" . UiMsg("checking", "") . "]")

    remoteVersion := ""
    downloadUrl := ""

    ; The official /releases/latest API is the source of truth. Do not use
    ; releases.atom here: GitHub can retain old/deleted release entries in
    ; that feed, which may report a tag that is not the current Latest release.
    release := HttpGet(UPDATE_RELEASES)
    if (release != "") {
        RegExMatch(release, """tag_name""\s*:\s*""([^""]+)""", rv)
        RegExMatch(release, "s)""browser_download_url""\s*:\s*""([^""]+\.zip)""", ru)
        if (ru1 = "")
            RegExMatch(release, """zipball_url""\s*:\s*""([^""]+)""", ru)
        releaseVersion := Trim(rv1)
        releaseUrl := Trim(ru1)
        ; GitHub's zipball API redirects; use codeload directly so both
        ; UrlDownloadToFile and the PowerShell helper handle the archive.
        releaseUrl := StrReplace(releaseUrl, "https://api.github.com/repos/", "https://codeload.github.com/")
        releaseUrl := StrReplace(releaseUrl, "/zipball/", "/zip/")
        if (releaseVersion != "" && releaseUrl != "") {
            remoteVersion := releaseVersion
            downloadUrl := releaseUrl
        }
    }

    ; If the single-release endpoint is unavailable or malformed, use the
    ; public releases list. It also contains only published releases.
    if (remoteVersion = "" || downloadUrl = "") {
        releases := HttpGet(UPDATE_RELEASES_LIST)
        if (releases != "") {
            RegExMatch(releases, """tag_name""\s*:\s*""([^""]+)""", lr)
            listVersion := Trim(lr1)
            if (listVersion != "") {
                remoteVersion := listVersion
                downloadUrl := "https://codeload.github.com/mozrg/RVL/zip/refs/tags/" . listVersion
            }
        }
    }

    ; Tags must be checked even when a Release exists: a newer tag pushed
    ; without a published Release (or a stale Release pointing at an older
    ; commit) would otherwise hide a real update forever. Whichever source
    ; reports the newer version wins.
    tagsJson := HttpGet(UPDATE_TAGS)
    if (tagsJson != "") {
        scanPos := 1
        Loop {
            scanPos := RegExMatch(tagsJson, """name""\s*:\s*""([^""]+)""", tagMatch, scanPos)
            if (!scanPos)
                break
            tagName := Trim(tagMatch1)
            scanPos += StrLen(tagMatch)
            ; Only plain numeric tags (1.14, v1.14) may drive an update so a
            ; random non-version tag can never trigger one.
            if (tagName != "" && RegExMatch(tagName, "^v?[0-9]+(\.[0-9]+)*$") && VersionToNumber(tagName) > VersionToNumber(remoteVersion)) {
                remoteVersion := tagName
                downloadUrl := "https://codeload.github.com/mozrg/RVL/zip/refs/tags/" . tagName
            }
        }
    }

    downloadUrl := StrReplace(downloadUrl, "\/", "/")
    if (remoteVersion = "" || downloadUrl = "") {
        ; All three GitHub endpoints failed — report a real error so the
        ; splash can exit promptly with an honest message and the user can
        ; retry. Pretending "latest" here used to mask real network
        ; failures (including the GitHub rate limit) as "up to date".
        g_update_state := "error"
        SetUpdateBridge("error", "", UiMsg("unreachable", "Cannot reach GitHub - check your connection"), 0)
        ThumbLog("check_update unreachable")
        return
    }

    if (VersionToNumber(remoteVersion) <= VersionToNumber(APP_VERSION)) {
        g_update_state := "latest"
        SetUpdateBridge("latest", APP_VERSION, UiMsg("latest", "You have the latest version"), 100)
    ThumbLog("check_update latest msg=[" . UiMsg("latest", "") . "]")
        return
    }

    g_update_url := downloadUrl
    g_update_version := remoteVersion
    g_update_state := "available"
    SetUpdateBridge("available", remoteVersion, UiMsg("available", "Update available"), 0)
    ThumbLog("check_update available " . remoteVersion)
Return

StartUpdateDownload:
    if (g_update_url = "") {
        g_update_state := "error"
        SetUpdateBridge("error", "", UiMsg("no_url", "Update URL unavailable"), 0)
        return
    }

    ; Save all user state before the current files are replaced.
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WritePresets
    Gosub, WriteThemePresets
    Gosub, WritePresetGroups

    try FileDelete, %UPDATE_STATUS_FILE%
    restartPath := A_ScriptFullPath
    restartArgs := ""
    if (!A_IsCompiled) {
        restartPath := A_AhkPath
        restartArgs := A_ScriptFullPath
    }

    ; The visible progress screen now lives in the RVL HTML UI. This worker
    ; only downloads/extracts/replaces files in the background.
    helper := A_ScriptDir "\update\update-worker.ps1"
    if (!FileExist(helper)) {
        SetUpdateBridge("error", "", UiMsg("no_helper", "Update helper not found"), 0)
        return
    }

    psExe := A_WinDir "\System32\WindowsPowerShell\v1.0\powershell.exe"
    if (!FileExist(psExe))
        psExe := "powershell.exe"
    ; Copy the worker and put all Unicode values into a UTF-8 config file.
    ; The PowerShell command line contains only ASCII paths from %TEMP%, so
    ; OneDrive\Документы and Cyrillic arguments cannot break process launch.
    stamp := A_TickCount
    workerTemp := A_Temp "\RVL_update_worker_" . stamp . ".ps1"
    configTemp := A_Temp "\RVL_update_config_" . stamp . ".ini"
    try FileCopy, %helper%, %workerTemp%, 1
    if (ErrorLevel || !FileExist(workerTemp)) {
        g_update_state := "error"
        SetUpdateBridge("error", "", UiMsg("prepare_fail", "Failed to prepare the updater"), 0)
        return
    }

    configFile := FileOpen(configTemp, "w", "UTF-8")
    if (!configFile)
        throw Exception(UiMsg("config_fail", "Failed to create the update config"))
    configFile.Write("Url=" . g_update_url . "`r`n")
    configFile.Write("Target=" . A_ScriptDir . "`r`n")
    configFile.Write("RestartPath=" . restartPath . "`r`n")
    configFile.Write("RestartArgs=" . restartArgs . "`r`n")
    configFile.Write("StatusPath=" . UPDATE_STATUS_FILE . "`r`n")
    configFile.Write("WaitPid=" . DllCall("GetCurrentProcessId") . "`r`n")
    configFile.Close()
    psArgs := "-NoProfile -NoLogo -NonInteractive -STA -ExecutionPolicy Bypass -WindowStyle Hidden -File " . UpdateQuote(workerTemp)
    psArgs .= " -ConfigPath " . UpdateQuote(configTemp)

    g_update_state := "downloading"
    g_update_started_at := A_TickCount
    SetUpdateBridge("downloading", g_update_version, UiMsg("connecting", "Connecting to GitHub..."), 0)
    ; Run starts PowerShell through the same reliable AHK path used by Mmacro.
    ; ShellExecute can return without launching the script on some Windows
    ; configurations, which previously produced a delayed false error.
    try {
        ; Both command-line paths are ASCII temporary paths.
        runCommand := UpdateQuote(psExe) . " " . psArgs
        ; Use an ASCII temporary working directory. The project path may
        ; contain Cyrillic characters and is already passed inside the PS1.
        Run, %runCommand%, %A_Temp%, Hide, workerPid
        g_update_worker_pid := workerPid
        if (ErrorLevel)
            throw Exception(UiMsg("ps_fail", "PowerShell failed to start"))
    } catch e {
        g_update_state := "error"
        SetUpdateBridge("error", "", UiMsg("start_fail", "Failed to start the updater"), 0)
        return
    }

    ; Keep RVL open: the HTML overlay renders the worker's real progress.
    ; The worker waits for this process to exit before replacing any files.
Return

; ============================================================
;  UPDATE STATUS POLLER
;  Format: state|progress|message
; ============================================================
PollUpdateStatus:
    Critical
    if (!FileExist(UPDATE_STATUS_FILE)) {
        if (g_update_state = "downloading" && g_update_started_at && A_TickCount - g_update_started_at > 10000) {
            g_update_state := "error"
            Process, Exist, %g_update_worker_pid%
            if (ErrorLevel)
                updateStartError := UiMsg("worker_no_response", "The updater is running but not responding")
            else
                updateStartError := UiMsg("worker_not_running", "PowerShell did not start the updater")
            SetUpdateBridge("error", g_update_version, updateStartError, 0)
        }
        return
    }
    statusRaw := ""
    try FileRead, statusRaw, *P65001 %UPDATE_STATUS_FILE%
    statusRaw := Trim(statusRaw, " `t`r`n")
    statusRaw := RegExReplace(statusRaw, "^\x{FEFF}", "")
    if (statusRaw = "")
        return
    parts := StrSplit(statusRaw, "|")
    workerState := parts[1]
    if (workerState = "starting" || workerState = "downloading" || workerState = "installing") {
        workerProgress := parts.MaxIndex() >= 2 ? parts[2] + 0 : 0
        workerMessage := parts.MaxIndex() >= 3 ? parts[3] : UiMsg("downloading_default", "Downloading update...")
        g_update_state := "downloading"
        SetUpdateBridge("downloading", g_update_version, workerMessage, workerProgress)
    } else if (workerState = "ready") {
        if (!g_update_exit_pending) {
            g_update_exit_pending := true
            g_update_state := "installing"
            SetUpdateBridge("installing", g_update_version, UiMsg("ready", "Files are ready. Restarting RVL..."), 100)
            SetTimer, FinishUpdateRestart, -700
        }
    } else if (workerState = "error") {
        workerMessage := parts.MaxIndex() >= 3 ? parts[3] : UiMsg("dl_fail", "Failed to download the update")
        g_update_state := "error"
        SetUpdateBridge("error", g_update_version, workerMessage, 0)
    }
Return

FinishUpdateRestart:
    if (g_update_exit_pending) {
        Gosub, CloseSettingsWindow
        try FileDelete, %TMP_HTML%
        try FileDelete, %TMP_SETTINGS_HTML%
        ExitApp
    }
Return

; ============================================================
;  DIRECT SOURCE UPDATE (.ahk mode)
; ============================================================
UpdateSourceFilesDirect:
    zipPath := A_Temp "\RVL_update.zip"
    extractDir := A_Temp "\RVL_update_extract"
    try FileDelete, %zipPath%
    try FileRemoveDir, %extractDir%, 1
    FileCreateDir, %extractDir%

    SetUpdateBridge("downloading", g_update_version, UiMsg("zip_dl", "Downloading the update archive..."), 35)
    if (!DownloadFile(g_update_url, zipPath) || !FileExist(zipPath)) {
        SetUpdateBridge("error", g_update_version, UiMsg("zip_dl_fail", "Failed to download the update archive"), 0)
        return
    }
    SetUpdateBridge("downloading", g_update_version, UiMsg("extracting", "Extracting the update..."), 70)

    try {
        zipShell := ComObjCreate("Shell.Application")
        zipNs := zipShell.NameSpace(zipPath)
        destNs := zipShell.NameSpace(extractDir)
        if (!zipNs || !destNs)
            throw Exception(UiMsg("zip_open_fail", "Failed to open the archive"))
        ; 4 = no progress UI, 16 = no confirmation UI.
        destNs.CopyHere(zipNs.Items, 20)
    } catch e {
        try FileDelete, %zipPath%
        try FileRemoveDir, %extractDir%, 1
        SetUpdateBridge("error", g_update_version, UiMsg("extract_fail", "Failed to extract the update"), 0)
        return
    }

    sourceRoot := ""
    Loop, 100 {
        Sleep, 100
        Loop, Files, %extractDir%\*, D
        {
            sourceRoot := A_LoopFileFullPath
            break
        }
        if (sourceRoot != "")
            break
    }

    ; Shell.Application extracts asynchronously; wait for the actual script
    ; before copying the tree, not just for the root directory to appear.
    if (sourceRoot != "") {
        Loop, 100 {
            if (FileExist(sourceRoot "\RVL.ahk"))
                break
            Sleep, 100
        }
    }

    if (sourceRoot = "" || !FileExist(sourceRoot "\RVL.ahk")) {
        try FileDelete, %zipPath%
        try FileRemoveDir, %extractDir%, 1
        SetUpdateBridge("error", g_update_version, UiMsg("bad_zip", "The update archive has an unexpected format"), 0)
        return
    }

    ; Never copy the data folder from the update archive. It contains the
    ; user's presets, settings, groups and launch history.
    Loop, Files, %sourceRoot%\*, FD
    {
        itemName := A_LoopFileName
        if (itemName = "data" || itemName = ".git")
            continue
        targetPath := A_ScriptDir "\" itemName
        if (InStr(FileExist(A_LoopFileFullPath), "D"))
            FileCopyDir, %A_LoopFileFullPath%, %targetPath%, 1
        else
            FileCopy, %A_LoopFileFullPath%, %targetPath%, 1
    }

    try FileDelete, %zipPath%
    try FileRemoveDir, %extractDir%, 1
    SetUpdateBridge("latest", g_update_version, UiMsg("installed", "Update installed"), 100)
    Sleep, 350
    Gosub, CloseSettingsWindow
    try FileDelete, %TMP_HTML%
    try FileDelete, %TMP_SETTINGS_HTML%
    Reload
Return

OnSetOpacity:
    try {
        ov := WB.document.getElementById("__cfg_opacity").value
        ov := ov + 0
        if (ov < 26)
            ov := 26
        if (ov > 255)
            ov := 255
        if (ov >= 255) {
            WinSet, Transparent, Off, RVL
        } else {
            WinSet, Transparent, %ov%, RVL
        }
        IniWrite, %ov%, %CFG%, Settings, Opacity
    }
Return

OnSetAlwaysOnTop:
    try {
        aotVal := WB.document.getElementById("__cfg_always_on_top").value
        g_always_on_top := aotVal
        if (aotVal = "1")
            WinSet, AlwaysOnTop, On, RVL
        else
            WinSet, AlwaysOnTop, Off, RVL
        IniWrite, %aotVal%, %CFG%, Settings, AlwaysOnTop
    }
Return

; ============================================================
;  AUTOSTART AT SYSTEM STARTUP (HKCU Run key)
;  JS publishes the desired state into __cfg_autostart and sends
;  CMD:set_autostart; we create or delete "HKCU\...\Run\RVL".
;  Non-compiled runs point at the interpreter + this script (quoted
;  paths survive the OneDrive folder with Cyrillic); compiled builds
;  point at the exe itself. The value is intentionally NOT enforced
;  at startup: if the user removes the entry via Task Manager, RVL
;  must not silently re-add it until they toggle the switch again.
; ============================================================
OnSetAutostart:
    try {
        autostartVal := WB.document.getElementById("__cfg_autostart").value
        g_autostart := autostartVal
        AutostartApply(autostartVal)
        IniWrite, %autostartVal%, %CFG%, Settings, Autostart
    }
Return

AutostartApply(state) {
    runKey := "Software\Microsoft\Windows\CurrentVersion\Run"
    if (state = "1") {
        if (A_IsCompiled)
            autostartCmd := UpdateQuote(A_ScriptFullPath)
        else
            autostartCmd := UpdateQuote(A_AhkPath) . " " . UpdateQuote(A_ScriptFullPath)
        RegWrite, REG_SZ, HKCU, %runKey%, RVL, %autostartCmd%
        ThumbLog("autostart enable err=" . ErrorLevel)
        return ErrorLevel = 0
    }
    try RegDelete, HKCU, %runKey%, RVL
    ThumbLog("autostart disable err=" . ErrorLevel)
    return ErrorLevel = 0
}

; ============================================================
ReadDom:
    try {
        g_place        := WB.document.getElementById("inp-place").value
        g_link         := WB.document.getElementById("inp-link").value
        g_method       := WB.document.getElementById("__cfg_method") ? WB.document.getElementById("__cfg_method").value : "1"
        g_hkKey        := WB.document.getElementById("inp-key").value
        g_hkEn         := WB.document.getElementById("chk-enabled").checked ? 1 : 0
        g_presets_json := WB.document.getElementById("__presets_out").value
        g_theme_mode   := WB.document.getElementById("theme-mode").value
        g_theme_bg     := WB.document.getElementById("theme-bg").value
        g_theme_surface := WB.document.getElementById("theme-surface").value
        g_theme_text   := WB.document.getElementById("theme-text").value
        g_theme_accent := WB.document.getElementById("theme-accent").value
        g_auto_minimize := WB.document.getElementById("__cfg_auto_minimize").value
        g_scale         := WB.document.getElementById("__cfg_scale").value
        g_theme_grad_en    := WB.document.getElementById("__cfg_theme_grad_en") ? WB.document.getElementById("__cfg_theme_grad_en").value : "0"
        g_theme_grad_bg2   := WB.document.getElementById("__cfg_theme_grad_bg2") ? WB.document.getElementById("__cfg_theme_grad_bg2").value : g_theme_bg
        g_theme_grad_angle := WB.document.getElementById("__cfg_theme_grad_angle") ? WB.document.getElementById("__cfg_theme_grad_angle").value : "135"
        g_theme_grad_op    := WB.document.getElementById("__cfg_theme_grad_op") ? WB.document.getElementById("__cfg_theme_grad_op").value : "100"
        g_launch_delay     := WB.document.getElementById("__cfg_launch_delay") ? WB.document.getElementById("__cfg_launch_delay").value : "0"
        g_tooltips      := WB.document.getElementById("__cfg_tooltips").value
        g_lang          := WB.document.getElementById("__cfg_lang").value
        g_last_preset   := WB.document.getElementById("__cfg_last_preset").value
        g_opacity       := WB.document.getElementById("__cfg_opacity").value
        g_shKey         := WB.document.getElementById("__cfg_sh_key").value
        g_shEn          := WB.document.getElementById("__cfg_sh_en").value
        g_mask_inputs   := WB.document.getElementById("__cfg_mask_inputs") ? WB.document.getElementById("__cfg_mask_inputs").value : "1"
        g_always_on_top := WB.document.getElementById("__cfg_always_on_top") ? WB.document.getElementById("__cfg_always_on_top").value : "0"
        g_autostart := WB.document.getElementById("__cfg_autostart") ? WB.document.getElementById("__cfg_autostart").value : "0"
        g_ui_hidden := WB.document.getElementById("__cfg_ui_hidden") ? WB.document.getElementById("__cfg_ui_hidden").value : ""
        g_ui_text   := WB.document.getElementById("__cfg_ui_text") ? WB.document.getElementById("__cfg_ui_text").value : ""
        g_theme_presets := WB.document.getElementById("__theme_presets_out").value
        g_preset_groups_json := WB.document.getElementById("__preset_groups_out") ? WB.document.getElementById("__preset_groups_out").value : g_preset_groups_json
    } catch e {
        g_place := "" , g_link := "" , g_hkKey := "F4" , g_hkEn := 1
        g_theme_mode := "dark" , g_theme_bg := "#0A0A0A" , g_theme_surface := "#111111" , g_theme_text := "#E8E8E8" , g_theme_accent := "#FFFFFF"
        g_theme_presets := "[]"
        g_mask_inputs := "1" , g_always_on_top := "0"
    }
Return

InjectConfig:
    IniRead, pid,  %CFG%, Settings, PlaceId,       133410800847665
    IniRead, lc,   %CFG%, Settings, LinkCode,       63587187475624144843883901936517
    IniRead, hk,   %CFG%, Settings, HotkeyKey,      F4
    IniRead, hken, %CFG%, Settings, HotkeyEnabled,  1
    IniRead, thm,  %CFG%, Settings, ThemeMode,      dark
    IniRead, thbg, %CFG%, Settings, ThemeBg,        #0A0A0A
    IniRead, thsf, %CFG%, Settings, ThemeSurface,   #111111
    IniRead, thtx, %CFG%, Settings, ThemeText,      #E8E8E8
    IniRead, thac, %CFG%, Settings, ThemeAccent,    #FFFFFF
    IniRead, automin, %CFG%, Settings, AutoMinimize, 0
    IniRead, sc,     %CFG%, Settings, Scale,         1.0
    IniRead, thgren, %CFG%, Settings, ThemeGradEn,    0
    IniRead, thgrbg2, %CFG%, Settings, ThemeGradBg2,  #0A0A0A
    IniRead, thgrang, %CFG%, Settings, ThemeGradAngle, 135
    IniRead, thgrop,  %CFG%, Settings, ThemeGradOp,    100
    IniRead, ldel,   %CFG%, Settings, LaunchDelay,    0
    IniRead, tt,     %CFG%, Settings, TooltipsEnabled, 1
    IniRead, lang,       %CFG%, Settings, Lang,            ru
    IniRead, lastPreset, %CFG%, Settings, LastPreset,
    IniRead, opacity,    %CFG%, Settings, Opacity,         255
    IniRead, g_shKey,    %CFG%, Settings, ShowHideKey,
    IniRead, g_shEn,     %CFG%, Settings, ShowHideEnabled, 0
    IniRead, maskIn,     %CFG%, Settings, MaskInputs,      1
    IniRead, aot,        %CFG%, Settings, AlwaysOnTop,     0
    IniRead, autostart,  %CFG%, Settings, Autostart,       0
    IniRead, compactMode, %CFG%, Settings, CompactMode,    0
    IniRead, sortMode,   %CFG%, Settings, SortMode,        manual
    IniRead, winX,       %CFG%, Settings, WindowX,         -1
    IniRead, winY,       %CFG%, Settings, WindowY,         -1
    IniRead, uiHidden,   %CFG%, Settings, UiHidden,
    IniRead, uiText,     %CFG%, Settings, UiText,

    pjson := "[]"
    if (FileExist(PRESETS)) {
        FileRead, pjson, *P65001 %PRESETS%
        pjson := Trim(pjson)
        if (pjson = "")
            pjson := "[]"
    }

    tpjson := "[]"
    if (FileExist(THEME_PRESETS)) {
        FileRead, tpjson, *P65001 %THEME_PRESETS%
        tpjson := Trim(tpjson)
        if (tpjson = "")
            tpjson := "[]"
    }

    pgjson := "[]"
    if (FileExist(PRESET_GROUPS)) {
        FileRead, pgjson, *P65001 %PRESET_GROUPS%
        pgjson := Trim(pgjson)
        if (pgjson = "")
            pgjson := "[]"
    }

    try {
        WB.document.getElementById("__cfg_place").value   := pid
        WB.document.getElementById("__cfg_link").value    := lc
        WB.document.getElementById("__cfg_hotkey").value  := hk
        WB.document.getElementById("__cfg_enabled").value := hken
        WB.document.getElementById("__app_version").value := APP_VERSION
        WB.document.getElementById("__cfg_presets").value := pjson
        WB.document.getElementById("__cfg_theme_mode").value    := thm
        WB.document.getElementById("__cfg_theme_bg").value      := thbg
        WB.document.getElementById("__cfg_theme_surface").value := thsf
        WB.document.getElementById("__cfg_theme_text").value    := thtx
        WB.document.getElementById("__cfg_theme_accent").value  := thac
        WB.document.getElementById("__cfg_auto_minimize").value := automin
        WB.document.getElementById("__cfg_scale").value         := sc
        WB.document.getElementById("__cfg_tooltips").value      := tt
        WB.document.getElementById("__cfg_lang").value           := lang
        WB.document.getElementById("__cfg_last_preset").value    := lastPreset
        WB.document.getElementById("__cfg_opacity").value         := opacity
        WB.document.getElementById("__cfg_sh_key").value          := g_shKey
        WB.document.getElementById("__cfg_sh_en").value           := g_shEn
        WB.document.getElementById("__cfg_mask_inputs").value     := maskIn
        WB.document.getElementById("__cfg_always_on_top").value   := aot
        WB.document.getElementById("__cfg_autostart").value        := autostart
        WB.document.getElementById("__cfg_compact_mode").value     := compactMode
        WB.document.getElementById("__cfg_sort_mode").value        := sortMode
        WB.document.getElementById("__cfg_ui_hidden").value        := uiHidden
        WB.document.getElementById("__cfg_ui_text").value          := uiText
        WB.document.getElementById("__cfg_theme_presets").value  := tpjson
        WB.document.getElementById("__cfg_preset_groups").value  := pgjson
        WB.document.getElementById("__cfg_theme_grad_en").value    := thgren
        WB.document.getElementById("__cfg_theme_grad_bg2").value   := thgrbg2
        WB.document.getElementById("__cfg_theme_grad_angle").value := thgrang
        WB.document.getElementById("__cfg_theme_grad_op").value    := thgrop
        WB.document.getElementById("__cfg_launch_delay").value     := ldel
        WB.document.getElementById("__update_notice").value         := g_update_notice
        WB.document.parentWindow.execScript("initApp()")
    }

    if (hk = "")
        hk := "F4"
    UpdateHotkey(hk, hken)
    ; Apply saved opacity
    if (opacity < 255)
        WinSet, Transparent, %opacity%, RVL
    ; Apply saved always-on-top state
    g_always_on_top := aot
    if (aot = "1")
        WinSet, AlwaysOnTop, On, RVL
    else
        WinSet, AlwaysOnTop, Off, RVL
    ; Apply saved show/hide hotkey
    UpdateShowHideHotkey(g_shKey, g_shEn)
Return

; ============================================================
SaveConfig:
    IniWrite, %g_place%, %CFG%, Settings, PlaceId
    IniWrite, %g_link%,  %CFG%, Settings, LinkCode
    IniWrite, %g_hkKey%, %CFG%, Settings, HotkeyKey
    IniWrite, %g_hkEn%,  %CFG%, Settings, HotkeyEnabled
    IniWrite, %g_theme_mode%,    %CFG%, Settings, ThemeMode
    IniWrite, %g_theme_bg%,      %CFG%, Settings, ThemeBg
    IniWrite, %g_theme_surface%, %CFG%, Settings, ThemeSurface
    IniWrite, %g_theme_text%,    %CFG%, Settings, ThemeText
    IniWrite, %g_theme_accent%,  %CFG%, Settings, ThemeAccent
    IniWrite, %g_auto_minimize%, %CFG%, Settings, AutoMinimize
    IniWrite, %g_scale%,         %CFG%, Settings, Scale
    IniWrite, %g_theme_grad_en%,    %CFG%, Settings, ThemeGradEn
    IniWrite, %g_theme_grad_bg2%,   %CFG%, Settings, ThemeGradBg2
    IniWrite, %g_theme_grad_angle%, %CFG%, Settings, ThemeGradAngle
    IniWrite, %g_theme_grad_op%,    %CFG%, Settings, ThemeGradOp
    IniWrite, %g_launch_delay%,     %CFG%, Settings, LaunchDelay
    IniWrite, %g_tooltips%,        %CFG%, Settings, TooltipsEnabled
    IniWrite, %g_lang%,            %CFG%, Settings, Lang
    IniWrite, %g_last_preset%,     %CFG%, Settings, LastPreset
    IniWrite, %g_opacity%,         %CFG%, Settings, Opacity
    IniWrite, %g_shKey%,           %CFG%, Settings, ShowHideKey
    IniWrite, %g_shEn%,            %CFG%, Settings, ShowHideEnabled
    IniWrite, %g_mask_inputs%,     %CFG%, Settings, MaskInputs
    IniWrite, %g_always_on_top%,   %CFG%, Settings, AlwaysOnTop
    IniWrite, %g_autostart%,       %CFG%, Settings, Autostart
    ; Enhancement: save compact mode and sort mode
    try {
        cmVal := WB.document.getElementById("__cfg_compact_mode").value
        IniWrite, %cmVal%, %CFG%, Settings, CompactMode
    }
    try {
        smVal := WB.document.getElementById("__cfg_sort_mode").value
        IniWrite, %smVal%, %CFG%, Settings, SortMode
    }
    try {
        uiHVal := WB.document.getElementById("__cfg_ui_hidden") ? WB.document.getElementById("__cfg_ui_hidden").value : ""
        IniWrite, %uiHVal%, %CFG%, Settings, UiHidden
        uiTVal := WB.document.getElementById("__cfg_ui_text") ? WB.document.getElementById("__cfg_ui_text").value : ""
        IniWrite, %uiTVal%, %CFG%, Settings, UiText
    }
Return

; ── Small helpers used by the updater ──────────────────────
SetUpdateBridge(state, version, message, progress) {
    global WB
    try {
        WB.document.getElementById("__update_state").value := state
        WB.document.getElementById("__update_version").value := version
        WB.document.getElementById("__update_message").value := message
        WB.document.getElementById("__update_progress").value := progress
    }
}

HttpGet(url) {
    try {
        req := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        req.Open("GET", url, false)
        req.Option(6) := true ; WinHttpRequestOption_EnableRedirects
        ; GitHub requires TLS 1.2. WinHTTP otherwise inherits an older
        ; protocol on some Windows installations and fails before receiving
        ; any response, which looked like a generic update-check error.
        try req.Option(9) := 2048 ; WinHttpRequestOption_SecureProtocols / TLS 1.2
        req.SetTimeouts(2500, 2500, 5000, 5000)
        req.SetRequestHeader("User-Agent", "RVL-Updater")
        req.SetRequestHeader("Accept", "application/vnd.github+json, application/atom+xml, application/json")
        req.SetRequestHeader("Cache-Control", "no-cache")
        req.Send()
        if (req.Status != 200)
            return ""
        return req.ResponseText
    } catch e {
        return ""
    }
}

DownloadFile(url, path) {
    try {
        req := ComObjCreate("WinHttp.WinHttpRequest.5.1")
        req.Open("GET", url, false)
        req.Option(6) := true ; WinHttpRequestOption_EnableRedirects
        req.SetTimeouts(5000, 5000, 30000, 30000)
        req.SetRequestHeader("User-Agent", "RVL-Updater")
        req.SetRequestHeader("Accept", "application/octet-stream")
        req.Send()
        if (req.Status != 200)
            return false

        stream := ComObjCreate("ADODB.Stream")
        stream.Type := 1 ; binary
        stream.Open()
        stream.Write(req.ResponseBody)
        stream.SaveToFile(path, 2) ; overwrite
        stream.Close()
        return true
    } catch e {
        return false
    }
}

VersionToNumber(version) {
    version := RegExReplace(version, "[^0-9.]", "")
    parts := StrSplit(version, ".")
    major := parts.MaxIndex() >= 1 ? (parts[1] + 0) : 0
    minor := parts.MaxIndex() >= 2 ? (parts[2] + 0) : 0
    patch := parts.MaxIndex() >= 3 ? (parts[3] + 0) : 0
    return (major * 1000000) + (minor * 1000) + patch
}

UpdateQuote(value) {
    quote := Chr(34)
    return quote . StrReplace(value, quote, quote . quote) . quote
}

; ============================================================
;  WINDOW RESIZE (called from JS via CMD:resize or hidden input)
; ============================================================
OnResize:
    Gosub, ReadResizeReq
    ResizeWindow(newW, newH)
Return

ReadResizeReq:
    try {
        req := WB.document.getElementById("__resize_req").value
        if (req != "") {
            parts := StrSplit(req, "x")
            newW := parts[1]
            newH := parts[2]
        } else {
            newW := 420
            newH := 610
        }
    } catch e {
        newW := 420
        newH := 610
    }
Return

ResizeWindow(w, h) {
    global hMainWnd, CORNER_RADIUS
    ; removed hard floor — window now shrinks to fit content
    if (h > 900)
        h := 900
    if (w < 320)
        w := 320
    if (w > 900)
        w := 900

    ; Get WB control hwnd for WM_SETREDRAW
    ControlGet, hWB, Hwnd,, Internet Explorer_Server1, ahk_id %hMainWnd%

    ; Freeze painting on both main window and WB control to prevent black flash
    DllCall("SendMessage", "Ptr", hMainWnd, "UInt", 0x000B, "Ptr", 0, "Ptr", 0) ; WM_SETREDRAW off
    if (hWB)
        DllCall("SendMessage", "Ptr", hWB, "UInt", 0x000B, "Ptr", 0, "Ptr", 0)

    GuiControl, MoveDraw, WB, w%w% h%h%
    Gui, Show, w%w% h%h%, RVL

    ; Recreate rounded region with the SAME radius as CSS body (16px).
    ; This was already done here, but now uses the shared CORNER_RADIUS
    ; constant so it can never drift out of sync with the initial region.
    cr := CORNER_RADIUS
    if (cr < 2)
        cr := 16
    hRgn := DllCall("CreateRoundRectRgn", "Int", 0, "Int", 0, "Int", w, "Int", h, "Int", cr, "Int", cr, "Ptr")
    DllCall("SetWindowRgn", "Ptr", hMainWnd, "Ptr", hRgn, "Int", 1)

    ; Re-enable painting and force full repaint
    if (hWB)
        DllCall("SendMessage", "Ptr", hWB, "UInt", 0x000B, "Ptr", 1, "Ptr", 0)
    DllCall("SendMessage", "Ptr", hMainWnd, "UInt", 0x000B, "Ptr", 1, "Ptr", 0) ; WM_SETREDRAW on
    ; RDW_INVALIDATE|RDW_ERASE|RDW_ALLCHILDREN|RDW_UPDATENOW = 0x0185
    DllCall("RedrawWindow", "Ptr", hMainWnd, "Ptr", 0, "Ptr", 0, "UInt", 0x0185)
}

; ============================================================
;  ROBLOX STATUS CHECKER  (every 2s)
;  Debounce: a state change must persist for 2 consecutive checks
;  (≈4 seconds) before we update the DOM. This prevents flicker
;  when Roblox is launching/exiting rapidly and the process briefly
;  appears then disappears within a single polling interval.
; ============================================================
UpdateRobloxStatus:
    if (!isReady)
        return
    Process, Exist, RobloxPlayerBeta.exe
    running := (ErrorLevel != 0) ? 1 : 0
    if (running = g_roblox_running) {
        ; State unchanged — clear any pending transition
        g_roblox_pending := -1
        return
    }
    ; State differs from what we last reported to the DOM.
    ; Require it to persist for one extra check before committing,
    ; unless this is the very first detection (g_roblox_running = -1).
    if (g_roblox_running = -1) {
        g_roblox_running := running
        g_roblox_pending := -1
        try {
            WB.document.getElementById("__roblox_status").value := running
            WB.document.parentWindow.execScript("updateRobloxStatus()")
        }
        return
    }
    if (g_roblox_pending = -1) {
        ; First time we see a different state — remember it but don't act yet
        g_roblox_pending := running
        return
    }
    if (g_roblox_pending != running) {
        ; State flipped back before debounce window elapsed — reset
        g_roblox_pending := -1
        return
    }
    ; g_roblox_pending == running for 2 consecutive checks → commit
    g_roblox_running := running
    g_roblox_pending := -1
    try {
        WB.document.getElementById("__roblox_status").value := running
        WB.document.parentWindow.execScript("updateRobloxStatus()")
    }
Return

; ============================================================
;  EXPORT PRESETS
; ============================================================
OnExportPresets:
    Gosub, ReadDom
    if (g_presets_json = "" || g_presets_json = "[]") {
        TrayTip, RVL, No presets to export, 2, 2
        return
    }
    FileSelectFile, savePath, S16, %A_ScriptDir%\data\presets.json, Export presets — choose file, JSON files (*.json)
    if (savePath = "")
        return
    try {
        f := FileOpen(savePath, "w", "UTF-8")
        f.Write(g_presets_json)
        f.Close()
        TrayTip, RVL, Presets exported successfully, 2, 1
    } catch e {
        TrayTip, RVL, Export failed: %e%, 3, 3
    }
Return

; ============================================================
;  IMPORT PRESETS
; ============================================================
OnImportPresets:
    FileSelectFile, loadPath, 3,, Import presets — choose file, JSON files (*.json)
    if (loadPath = "")
        return
    FileRead, importData, %loadPath%
    importData := Trim(importData)
    if (importData = "") {
        TrayTip, RVL, File is empty, 2, 2
        return
    }
    try {
        WB.document.getElementById("__import_data").value := importData
        WB.document.parentWindow.execScript("importPresetsFromAHK()")
        TrayTip, RVL, Presets imported, 2, 1
    } catch e {
        TrayTip, RVL, Import failed, 3, 3
    }
Return

; ============================================================
;  PER-PRESET HOTKEY CAPTURE
; ============================================================
OnCapturePresetHK:
    SetTimer, ProcessCommands, Off
    TrayTip, RVL, Press any key for preset hotkey... (Esc to cancel), 10, 1

    ; Poll physical key states — same approach as OnSHCaptureStart.
    ; The Input command cannot reliably distinguish Numpad keys from the
    ; number row, and misses letter keys entirely. Polling catches all of them.
    keyName   := ""
    cancelled := false
    phkKeyList := HK_CAPTURE_KEYS

    phkElapsed := 0
    Loop {
        Sleep, 20
        phkElapsed += 20
        if (GetKeyState("Escape", "P")) {
            cancelled := true
            break
        }
        if (phkElapsed >= 10000) {
            cancelled := true
            break
        }
        Loop, Parse, phkKeyList, `,
        {
            if (GetKeyState(A_LoopField, "P")) {
                keyName := A_LoopField
                break
            }
        }
        if (keyName != "")
            break
    }

    TrayTip

    if (cancelled || keyName = "") {
        try WB.document.parentWindow.execScript("finishPresetHKCapture(null)")
    } else {
        ; Prevent conflict with main hotkey
        if (keyName = HotkeyKey && HotkeyKey != "") {
            TrayTip, RVL, Conflicts with main hotkey!, 2, 2
            try WB.document.parentWindow.execScript("finishPresetHKCapture(null)")
        } else {
            ; Escape for the single-quoted JS string literal (keys may now
            ; contain an apostrophe or a backslash).
            jsKeyName := StrReplace(keyName, "\", "\\")
            jsKeyName := StrReplace(jsKeyName, "'", "\'")
            try WB.document.parentWindow.execScript("finishPresetHKCapture('" . jsKeyName . "')")
            Sleep, 150
            Gosub, UpdatePresetHotkeys
        }
    }

    SetTimer, ProcessCommands, On
Return

; ============================================================
;  GAME ICON (place avatar) FOR THE DETAIL PANEL
;  JS asks for "CMD:thumb_req <key>" where <key> is either a place
;  id (method 1) or "sc:<shareCode>" (method 2). The whole chain
;  (share page meta / placeId -> universeId -> icon URL -> PNG)
;  runs in a hidden PowerShell worker (update\fetch-icon.ps1), so
;  the AHK UI thread never blocks on the network. The worker writes
;  <png>.done when finished; a timer polls for it and pushes the
;  local path back through __thumb_resp. JS falls back to the index
;  number and retries later on failure.
; ============================================================
OnThumbRequest:
    thumbKey := SubStr(cmd, 15)
    if (thumbKey = "") {
        return
    }
    thumbFileKey := RegExReplace(thumbKey, "\W")
    thumbPath := A_Temp "\RVL_icon_" . thumbFileKey . ".png"
    if (FileExist(thumbPath)) {
        ; Disk cache hit - answer immediately.
        ThumbLog("hit " . thumbKey)
        ThumbRespond(WB.document, thumbKey, thumbPath)
        return
    }
    g_thumb_doc := WB.document
    ThumbLog("req " . thumbKey . " step=" . g_thumb_step)
    if (g_thumb_step) {
        ; A worker is already running - remember the next key in line.
        g_thumb_pending_key := thumbKey
        return
    }
    g_thumb_launch_key := thumbKey
    Gosub, ThumbStartLaunch
Return

; Append a response line "key|path" to the __thumb_resp queue. JS drains the
; whole queue and clears it, mirroring the __cmd_queue direction. A single
; overwritten value lost all but the last answer when every preset hit the
; disk cache within one 350ms JS poll.
ThumbRespond(doc, key, path) {
    try {
        cur := doc.getElementById("__thumb_resp").value
        if (cur != "")
            cur .= "`n"
        doc.getElementById("__thumb_resp").value := cur . key . "|" . path . "`n"
    }
}

ThumbLog(msg) {
    FileAppend, %A_Hour%:%A_Min%:%A_Sec% %msg%`r`n, %A_Temp%\RVL_thumb_debug.txt, UTF-8
}

ThumbStartLaunch:
    thumbKey := g_thumb_launch_key
    thumbFileKey := RegExReplace(thumbKey, "\W")
    thumbPath := A_Temp "\RVL_icon_" . thumbFileKey . ".png"
    thumbDone := thumbPath . ".done"
    g_thumb_key := thumbKey
    g_thumb_path := thumbPath
    g_thumb_step := 1
    g_thumb_ticks := 0
    ; FileDelete and FileCopy THROW inside try-wrapped callers when the
    ; target is missing/unusable. An unguarded FileDelete here used to
    ; abort the launch with g_thumb_step stuck at 1 — every later icon
    ; request then queued forever and the rest of the command queue
    ; (including CMD:check_update) was dropped. Guard every fs command.
    try FileDelete, %thumbDone%
    psSrc := A_ScriptDir "\update\fetch-icon.ps1"
    if (!FileExist(psSrc)) {
        ThumbLog("FAIL psSrc missing: " . psSrc)
        ThumbRespond(g_thumb_doc, thumbKey, "")
        g_thumb_step := 0
        return
    }
    stamp := A_TickCount
    psTemp := A_Temp "\RVL_fetch_icon_" . stamp . ".ps1"
    try FileCopy, %psSrc%, %psTemp%, 1
    if (ErrorLevel || !FileExist(psTemp)) {
        ThumbLog("FAIL copy " . thumbKey)
        ThumbRespond(g_thumb_doc, thumbKey, "")
        g_thumb_step := 0
        return
    }
    psExe := A_WinDir "\System32\WindowsPowerShell\v1.0\powershell.exe"
    if (!FileExist(psExe))
        psExe := "powershell.exe"
    runCmd := UpdateQuote(psExe) . " -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File " . UpdateQuote(psTemp) . " -Key " . UpdateQuote(thumbKey) . " -OutPath " . UpdateQuote(thumbPath) . " -DonePath " . UpdateQuote(thumbDone)
    try {
        Run, %runCmd%,, Hide
        SetTimer, ThumbDoneCheck, 300
    } catch e {
        ThumbLog("FAIL run " . thumbKey . " " . e.Message)
        ThumbRespond(g_thumb_doc, thumbKey, "")
        g_thumb_step := 0
        return
    }
    ThumbLog("launched " . thumbKey)
Return

ThumbDoneCheck:
    g_thumb_ticks += 1
    if (FileExist(g_thumb_path)) {
        ; The worker downloaded the icon.
        SetTimer, ThumbDoneCheck, Off
        thumbDone := g_thumb_path . ".done"
        try FileDelete, %thumbDone%
        ThumbRespond(g_thumb_doc, g_thumb_key, g_thumb_path)
        g_thumb_step := 0
        Gosub, ThumbStartPending
        return
    }
    thumbDone := g_thumb_path . ".done"
    if (g_thumb_ticks > 90 || FileExist(thumbDone)) {
        SetTimer, ThumbDoneCheck, Off
        try FileDelete, %thumbDone%
        ThumbRespond(g_thumb_doc, g_thumb_key, "")
        g_thumb_step := 0
        Gosub, ThumbStartPending
        return
    }
Return

ThumbStartPending:
    if (g_thumb_pending_key != "") {
        g_thumb_launch_key := g_thumb_pending_key
        g_thumb_pending_key := ""
        Gosub, ThumbStartLaunch
    }
Return

; ============================================================
;  REGISTER / DEREGISTER PRESET HOTKEYS
; ============================================================
UpdatePresetHotkeys:
    ; Deregister previous preset hotkeys
    for idx, hk in g_preset_hotkeys {
        try Hotkey, %hk%, PresetHotkeyFire, Off
    }
    g_preset_hotkeys := []
    g_preset_hk_data := {}

    raw := ""
    try raw := WB.document.getElementById("__preset_hk_map").value
    if (raw = "")
        return

    Loop, Parse, raw, `;`
    {
        item := Trim(A_LoopField)
        if (item = "")
            continue
        parts := StrSplit(item, "|")
        if (parts.MaxIndex() < 3)
            continue
        hk  := parts[1]
        pid := parts[2]
        lc  := parts[3]
        pmethod := (parts.MaxIndex() >= 4) ? parts[4] : "1"
        ppid    := (parts.MaxIndex() >= 5) ? parts[5] : ""
        if (hk = "")
            continue
        if (hk = HotkeyKey && HotkeyKey != "")
            continue                 ; skip conflict with main hotkey
        g_preset_hk_data[hk] := {placeId: pid, linkCode: lc, method: pmethod, presetId: ppid}
        try {
            Hotkey, %hk%, PresetHotkeyFire, On
            g_preset_hotkeys.Push(hk)
        }
    }
Return

PresetHotkeyFire:
    hk := A_ThisHotkey
    if (!g_preset_hk_data.HasKey(hk))
        Return
    d := g_preset_hk_data[hk]
    if (d.method = "2" || d.method = 2) {
        LaunchRobloxShare(d.linkCode)
    } else {
        LaunchRoblox(d.placeId, d.linkCode)
    }
    if (d.presetId != "") {
        try {
            WB.document.getElementById("__hotkey_launch_ping").value := d.presetId "|" A_TickCount
        }
    }
Return

WritePresets:
    if (g_presets_json = "")
        return
    try {
        f := FileOpen(PRESETS, "w", "UTF-8")
        f.Write(g_presets_json)
        f.Close()
    }
Return

WriteThemePresets:
    if (g_theme_presets = "")
        return
    try {
        f := FileOpen(THEME_PRESETS, "w", "UTF-8")
        f.Write(g_theme_presets)
        f.Close()
    }
Return

WritePresetGroups:
    if (g_preset_groups_json = "")
        return
    try {
        f := FileOpen(PRESET_GROUPS, "w", "UTF-8")
        f.Write(g_preset_groups_json)
        f.Close()
    }
Return

; ============================================================
;  NATIVE DRAG
; ============================================================
OnDragStart:
    if (g_command_source = "settings" && hSettingsWnd) {
        DllCall("ReleaseCapture")
        DllCall("SendMessage", "Ptr", hSettingsWnd, "UInt", 0xA1, "Ptr", 2, "Ptr", 0)
        return
    }
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
    TrayTip, RVL, Press any key... (Esc to cancel), 10, 1

    ; Poll physical key states for reliable full-keyboard detection.
    ; The Input command cannot distinguish Numpad from number row keys
    ; and misses letter keys, so we poll instead.
    capKeyName   := ""
    capCancelled := false
    capKeyList := HK_CAPTURE_KEYS

    capElapsed := 0
    Loop {
        Sleep, 20
        capElapsed += 20
        if (GetKeyState("Escape", "P")) {
            capCancelled := true
            break
        }
        if (capElapsed >= 10000) {
            capCancelled := true
            break
        }
        Loop, Parse, capKeyList, `,
        {
            if (GetKeyState(A_LoopField, "P")) {
                capKeyName := A_LoopField
                break
            }
        }
        if (capKeyName != "")
            break
    }

    TrayTip

    if (capCancelled || capKeyName = "") {
        if (savedKey != "") {
            try Hotkey, %savedKey%, HotkeyFire, On
            g_prevHotkey := savedKey
        }
        try {
            WB.document.parentWindow.execScript("stopCaptureExternal(null)")
        }
    } else {
        keyName := capKeyName
        try {
            WB.document.getElementById("inp-key").value := keyName
            WB.document.getElementById("chk-enabled").checked := true
            WB.document.getElementById("toggle-track").className := "toggle-track on"
        }
        Gosub, ReadDom
        Gosub, SaveConfig
        UpdateHotkey(keyName, 1)
        jsKeyName := StrReplace(keyName, "\", "\\")
        jsKeyName := StrReplace(jsKeyName, "'", "\'")
        try {
            WB.document.parentWindow.execScript("stopCaptureExternal('" . jsKeyName . "')")
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
            TrayTip, RVL, Hotkey registered: %newKey%, 2, 1
        } catch err {
            HotkeyActive := false
            TrayTip, RVL, Failed to register hotkey: %newKey%, 3, 3
        }
    } else {
        TrayTip, RVL, Hotkey disabled, 2, 1
    }

    if FileExist(RVL_ICON)
        Menu, Tray, Icon, %RVL_ICON%
}

; ============================================================
;  SHOW/HIDE WINDOW HOTKEY
; ============================================================
OnSHCaptureStart:
    SetTimer, ProcessCommands, Off
    TrayTip, RVL, Press any key... (Esc to cancel), 10, 1

    ; Input-based capture cannot distinguish Numpad digits from the main
    ; keyboard's number row (both produce the same character), so a
    ; Numpad-bound hotkey would silently register as the wrong key and
    ; never fire. Poll physical key states instead - this lets Numpad0-9,
    ; NumpadEnter, NumpadAdd/Sub/Mult/Div/Dot register as their own
    ; distinct hotkeys regardless of NumLock state.
    shKeyName   := ""
    shCancelled := false
    shKeyList := HK_CAPTURE_KEYS

    shElapsed := 0
    Loop {
        Sleep, 20
        shElapsed += 20
        if (GetKeyState("Escape", "P")) {
            shCancelled := true
            break
        }
        if (shElapsed >= 10000) {
            shCancelled := true
            break
        }
        Loop, Parse, shKeyList, `,
        {
            if (GetKeyState(A_LoopField, "P")) {
                shKeyName := A_LoopField
                break
            }
        }
        if (shKeyName != "")
            break
    }

    TrayTip

    if (!shCancelled && shKeyName != "") {
        g_shKey := shKeyName
        g_shEn  := 1
        Gosub, SaveConfig
        UpdateShowHideHotkey(shKeyName, 1)
        try {
            WB.document.getElementById("__cfg_sh_key").value := shKeyName
            WB.document.getElementById("__cfg_sh_en").value  := "1"
            jsKeyName := StrReplace(shKeyName, "\", "\\")
            jsKeyName := StrReplace(jsKeyName, "'", "\'")
            WB.document.parentWindow.execScript("stopShowHideCaptureExternal('" . jsKeyName . "')")
        }
    } else {
        try {
            WB.document.parentWindow.execScript("stopShowHideCaptureExternal(null)")
        }
    }

    SetTimer, ProcessCommands, On
Return

OnSHHotkeyUpdate:
    try {
        g_shKey := WB.document.getElementById("__cfg_sh_key").value
        g_shEn  := WB.document.getElementById("__cfg_sh_en").value
    }
    Gosub, SaveConfig
    UpdateShowHideHotkey(g_shKey, g_shEn)
Return

UpdateShowHideHotkey(newKey, enabled) {
    global g_prevShHotkey

    if (g_prevShHotkey != "") {
        try Hotkey, %g_prevShHotkey%, ShowHideFire, Off
        g_prevShHotkey := ""
    }
    if (enabled && newKey != "") {
        try {
            Hotkey, %newKey%, ShowHideFire, On
            g_prevShHotkey := newKey
        }
    }
}

ShowHideFire:
    if (g_windowVisible) {
        Gui, Hide
        g_windowVisible := false
    } else {
        Gui, Show
        WinActivate, RVL
        g_windowVisible := true
    }
Return

; ============================================================
;  HOTKEY FIRE
; ============================================================
HotkeyFire:
    if (!HotkeyActive)
        return

    method := ""
    presetId := ""
    hk_sc := ""
    try {
        hk_pid    := WB.document.getElementById("inp-place").value
        hk_lc     := WB.document.getElementById("inp-link").value
        method    := WB.document.getElementById("__cfg_method").value
        presetId  := WB.document.getElementById("__last_loaded_preset_id").value
        hk_sc     := WB.document.getElementById("inp-share-code").value
    } catch e {
        hk_pid := ""
        hk_lc  := ""
    }

    if (hk_pid = "" && method != "2") {
        IniRead, hk_pid, %CFG%, Settings, PlaceId, 133410800847665
    }
    if (hk_lc = "") {
        IniRead, hk_lc, %CFG%, Settings, LinkCode, 63587187475624144843883901936517
    }

    if (method = "2") {
        LaunchRobloxShare(hk_sc)
    } else {
        LaunchRoblox(hk_pid, hk_lc)
    }

    if (presetId != "") {
        try {
            WB.document.getElementById("__hotkey_launch_ping").value := presetId "|" A_TickCount
        }
    }
Return

; ============================================================
LaunchRoblox(pid, lc) {
    global LOG, g_presets_json
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

    ; Find preset name from presets JSON
    presetName := ""
    try {
        if (g_presets_json != "" && g_presets_json != "[]") {
            ; Simple regex to find name by placeId+linkCode
            searchKey := """placeId"":""" . pid . """.*?""linkCode"":""" . lc . """"
            if (RegExMatch(g_presets_json, "s)""name"":""([^""]+)""[^}]*" . searchKey, nm)) {
                presetName := nm1
            } else if (RegExMatch(g_presets_json, "s)" . searchKey . "[^}]*?""name"":""([^""]+)""", nm2)) {
                presetName := nm2
            }
        }
    }
    if (presetName = "")
        presetName := "Unknown"

    okVal := (InStr(result, "fail")) ? "0" : "1"
    FormatTime, ts,, yyyy-MM-dd HH:mm:ss
    FileAppend, [%ts%]|%presetName%|%pid%|%okVal%`n, %LOG%
}

; Launch via Roblox share link (Method 2)
LaunchRobloxShare(shareCode) {
    global LOG, g_presets_json
    url_app     := "roblox://navigation/share_links?code=" shareCode
    url_browser := "https://www.roblox.com/share?code=" shareCode

    RegRead, handler, HKEY_CLASSES_ROOT, roblox\shell\open\command
    if (ErrorLevel || handler = "") {
        Run, %url_browser%
        result := "browser-share"
    } else {
        Run, %url_app%
        result := ErrorLevel ? "fail" : "ok-share"
    }

    ; Find preset name from presets JSON by linkCode (share code)
    presetName := ""
    try {
        if (g_presets_json != "" && g_presets_json != "[]") {
            searchKey := """linkCode"":""" . shareCode . """"
            if (RegExMatch(g_presets_json, "s)""name"":""([^""]+)""[^}]*" . searchKey, nm)) {
                presetName := nm1
            } else if (RegExMatch(g_presets_json, "s)" . searchKey . "[^}]*?""name"":""([^""]+)""", nm2)) {
                presetName := nm2
            }
        }
    }
    if (presetName = "")
        presetName := "Share Code"

    okVal := (InStr(result, "fail")) ? "0" : "1"
    FormatTime, ts,, yyyy-MM-dd HH:mm:ss
    FileAppend, [%ts%]|%presetName%|SC:%shareCode%|%okVal%`n, %LOG%
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

AHKSelectAll:
    try {
        active := WB.document.activeElement
        tag    := active.tagName
        typ    := active.type
        if (tag = "INPUT" && (typ = "text" || typ = "password")) {
            active.select()
            return
        }
        if (tag = "TEXTAREA") {
            active.select()
            return
        }
    } catch e {
    }
    SendInput, ^a
Return

AHKCopy:
    try {
        active := WB.document.activeElement
        tag    := active.tagName
        typ    := active.type
        if (tag = "INPUT" && (typ = "text" || typ = "password")) {
            sel := WB.document.selection
            if (sel) {
                range := sel.createRange()
                copied := range.text
                if (copied != "") {
                    Clipboard := copied
                    return
                }
            }
            return
        }
        if (tag = "TEXTAREA") {
            sel := WB.document.selection
            if (sel) {
                range := sel.createRange()
                copied := range.text
                if (copied != "")
                    Clipboard := copied
            }
            return
        }
    } catch e {
    }
    SendInput, ^c
Return

AHKCut:
    try {
        active := WB.document.activeElement
        tag    := active.tagName
        typ    := active.type
        if (tag = "INPUT" && (typ = "text" || typ = "password")) {
            sel := WB.document.selection
            if (sel) {
                range := sel.createRange()
                cut := range.text
                if (cut != "") {
                    Clipboard := cut
                    range.text := ""
                    range.collapse(true)
                    range.select()
                }
            }
            return
        }
        if (tag = "TEXTAREA") {
            sel := WB.document.selection
            if (sel) {
                range := sel.createRange()
                cut := range.text
                if (cut != "") {
                    Clipboard := cut
                    range.text := ""
                }
            }
            return
        }
    } catch e {
    }
    SendInput, ^x
Return

AHKUndo:
    try {
        active := WB.document.activeElement
        tag    := active.tagName
        typ    := active.type
        if (tag = "INPUT" && (typ = "text" || typ = "password")) {
            WB.document.execCommand("undo", false, "")
            return
        }
        if (tag = "TEXTAREA") {
            WB.document.execCommand("undo", false, "")
            return
        }
    } catch e {
    }
    SendInput, ^z
Return

AHKRedo:
    try {
        active := WB.document.activeElement
        tag    := active.tagName
        typ    := active.type
        if (tag = "INPUT" && (typ = "text" || typ = "password")) {
            WB.document.execCommand("redo", false, "")
            return
        }
        if (tag = "TEXTAREA") {
            WB.document.execCommand("redo", false, "")
            return
        }
    } catch e {
    }
    SendInput, ^y
Return

; ============================================================
ShowWindow:
    g_windowVisible := true
    Gui, Show
    WinActivate, RVL
Return

RunFromTray:
    ; Try to find the favourite preset in presets.json
    favPid := ""
    favLc  := ""
    try {
        FileRead, presetsRaw, *P65001 %PRESETS%
        if (presetsRaw != "") {
            ; Simple scan for "favorite":true – find that object's placeId+linkCode
            favPos := InStr(presetsRaw, """favorite"":true")
            if (!favPos)
                favPos := InStr(presetsRaw, """favorite"": true")
            if (favPos) {
                ; Search backwards from favPos for placeId
                seg := SubStr(presetsRaw, 1, favPos + 40)
                RegExMatch(seg, ".*""placeId"":""(\d+)""", mP)
                RegExMatch(seg, ".*""linkCode"":""(\d+)""", mL)
                if (mP1 != "" && mL1 != "") {
                    favPid := mP1
                    favLc  := mL1
                }
            }
        }
    }
    if (favPid != "" && favLc != "") {
        LaunchRoblox(favPid, favLc)
    } else {
        IniRead, pid, %CFG%, Settings, PlaceId,  133410800847665
        IniRead, lc, %CFG%, Settings, LinkCode, 63587187475624144843883901936517
        LaunchRoblox(pid, lc)
    }
Return

; ============================================================
;  FACTORY RESET
; ============================================================
OnFactoryReset:
    try FileDelete, %CFG%
    try FileDelete, %PRESETS%
    try FileDelete, %THEME_PRESETS%
    try FileDelete, %PRESET_GROUPS%
    try FileDelete, %LOG%
    ; Factory reset also removes the boot autostart entry.
    AutostartApply("0")
    Reload
Return

; ============================================================
;  COPY TO CLIPBOARD (Enhancement B1)
; ============================================================
OnCopyClipboard:
    try {
        clipData := WB.document.getElementById("__clipboard_data").value
        if (clipData != "") {
            Clipboard := clipData
            WB.document.getElementById("__clipboard_data").value := ""
        }
    }
Return

; ============================================================
;  LOAD HISTORY (Enhancement F1)
;  Reads history.log and injects JSON into __history_data
; ============================================================
OnLoadHistory:
    try {
        histJSON := "[]"
        if (FileExist(LOG)) {
            FileRead, histRaw, *P65001 %LOG%
            entries := []
            Loop, Parse, histRaw, `n, `r
            {
                line := Trim(A_LoopField)
                if (line = "")
                    continue

                ts := ""
                name := ""
                pid := ""
                okVal := "1"

                ; NEW format: [YYYY-MM-DD HH:MM:SS]|name|placeId|ok
                if (RegExMatch(line, "^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\|([^|]*)\|([^|]*)\|(\d+)", m)) {
                    ts := m1
                    name := m2
                    pid := m3
                    okVal := m4
                }
                ; OLD format: [YYYY-MM-DD HH:MM:SS] placeId=XXX linkCode=YYY result=ZZZ
                else if (RegExMatch(line, "^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] placeId=(\S+) linkCode=(\S+) result=(\S+)", m2)) {
                    ts := m21
                    pid := m22
                    name := "Preset " m22
                    okVal := (InStr(m24, "fail")) ? "0" : "1"
                }
                ; OLD share format: [YYYY-MM-DD HH:MM:SS] shareCode=XXX result=ZZZ
                else if (RegExMatch(line, "^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] shareCode=(\S+) result=(\S+)", m3)) {
                    ts := m31
                    name := "Share Code"
                    pid := "SC:" m32
                    okVal := (InStr(m33, "fail")) ? "0" : "1"
                }
                else {
                    continue
                }

                ; Parse timestamp to epoch ms
                epoch := 0
                if (RegExMatch(ts, "(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})", tm)) {
                    ; Use EnvSub for AHK v1.1 compatibility
                    tsVar := tm1 . tm2 . tm3 . tm4 . tm5 . tm6
                    tsVar -= 19700101000000, Seconds
                    epoch := tsVar * 1000
                }

                ; Escape name for JSON
                escName := StrReplace(name, "\", "\\")
                escName := StrReplace(escName, """", "\""")
                escPid := StrReplace(pid, "\", "\\")
                escPid := StrReplace(escPid, """", "\""")
                okBool := (okVal = "1") ? "true" : "false"

                entries.Push("{""ts"":" . epoch . ",""name"":""" . escName . """,""placeId"":""" . escPid . """,""ok"":" . okBool . "}")
            }
            histJSON := "[" . ArrJoin(entries, ",") . "]"
        }
        WB.document.getElementById("__history_data").value := histJSON
    } catch e {
        ; ignore
    }
Return

ArrJoin(arr, sep) {
    result := ""
    for i, v in arr {
        if (i > 1)
            result .= sep
        result .= v
    }
    return result
}

; ============================================================
;  CLEAR HISTORY (Enhancement F1)
; ============================================================
OnClearHistory:
    try {
        try FileDelete, %LOG%
        WB.document.getElementById("__history_data").value := "[]"
    }
Return

; ============================================================
;  BACKUP CREATE (Enhancement G2)
;  Bundles config.ini, presets.json, theme_presets.json,
;  preset_groups.json into a single .rvlbackup file (ZIP-like).
; ============================================================
OnBackupCreate:
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WritePresets
    Gosub, WriteThemePresets
    Gosub, WritePresetGroups

    FileSelectFile, bkPath, S16, %A_ScriptDir%\data\rvl_backup.rvlbackup, Create backup — choose file, RVL Backup (*.rvlbackup)
    if (bkPath = "")
        return

    try {
        ; Build a combined JSON with all state files
        cfgData := ""
        if (FileExist(CFG)) {
            FileRead, cfgData, *P65001 %CFG%
        }
        presetsData := ""
        if (FileExist(PRESETS)) {
            FileRead, presetsData, *P65001 %PRESETS%
        }
        themePresetsData := ""
        if (FileExist(THEME_PRESETS)) {
            FileRead, themePresetsData, *P65001 %THEME_PRESETS%
        }
        groupsData := ""
        if (FileExist(PRESET_GROUPS)) {
            FileRead, groupsData, *P65001 %PRESET_GROUPS%
        }

        ; Escape for JSON
        cfgEsc := StrReplace(cfgData, "\", "\\")
        cfgEsc := StrReplace(cfgEsc, """", "\""")
        cfgEsc := StrReplace(cfgEsc, "`n", "\n")
        cfgEsc := StrReplace(cfgEsc, "`r", "")

        presetsEsc := StrReplace(presetsData, "\", "\\")
        presetsEsc := StrReplace(presetsEsc, """", "\""")
        presetsEsc := StrReplace(presetsEsc, "`n", "\n")
        presetsEsc := StrReplace(presetsEsc, "`r", "")

        themeEsc := StrReplace(themePresetsData, "\", "\\")
        themeEsc := StrReplace(themeEsc, """", "\""")
        themeEsc := StrReplace(themeEsc, "`n", "\n")
        themeEsc := StrReplace(themeEsc, "`r", "")

        groupsEsc := StrReplace(groupsData, "\", "\\")
        groupsEsc := StrReplace(groupsEsc, """", "\""")
        groupsEsc := StrReplace(groupsEsc, "`n", "\n")
        groupsEsc := StrReplace(groupsEsc, "`r", "")

        bkJSON := "{""version"":""1.6"",""timestamp"":""" . A_Now . """"
        bkJSON .= ",""config"":""" . cfgEsc . """"
        bkJSON .= ",""presets"":""" . presetsEsc . """"
        bkJSON .= ",""themePresets"":""" . themeEsc . """"
        bkJSON .= ",""presetGroups"":""" . groupsEsc . """"
        bkJSON .= "}"

        f := FileOpen(bkPath, "w", "UTF-8")
        f.Write(bkJSON)
        f.Close()
    } catch e {
        TrayTip, RVL, Backup failed: %e%, 3, 3
    }
Return

; ============================================================
;  BACKUP RESTORE (Enhancement G2)
; ============================================================
OnBackupRestore:
    FileSelectFile, rsPath, 3,, Restore backup — choose file, RVL Backup (*.rvlbackup)
    if (rsPath = "")
        return

    try {
        FileRead, rsData, *P65001 %rsPath%
        ; Parse and extract sections (simple regex extraction)
        ; config
        if (RegExMatch(rsData, """config"":""(.*?)"",""presets""", m1)) {
            cfgRestored := m1
            cfgRestored := StrReplace(cfgRestored, "\n", "`n")
            cfgRestored := StrReplace(cfgRestored, "\""", """")
            cfgRestored := StrReplace(cfgRestored, "\\", "\")
            f := FileOpen(CFG, "w", "UTF-8")
            f.Write(cfgRestored)
            f.Close()
        }
        if (RegExMatch(rsData, """presets"":""(.*?)"",""themePresets""", m2)) {
            psRestored := m2
            psRestored := StrReplace(psRestored, "\n", "`n")
            psRestored := StrReplace(psRestored, "\""", """")
            psRestored := StrReplace(psRestored, "\\", "\")
            f := FileOpen(PRESETS, "w", "UTF-8")
            f.Write(psRestored)
            f.Close()
        }
        if (RegExMatch(rsData, """themePresets"":""(.*?)"",""presetGroups""", m3)) {
            tpRestored := m3
            tpRestored := StrReplace(tpRestored, "\n", "`n")
            tpRestored := StrReplace(tpRestored, "\""", """")
            tpRestored := StrReplace(tpRestored, "\\", "\")
            f := FileOpen(THEME_PRESETS, "w", "UTF-8")
            f.Write(tpRestored)
            f.Close()
        }
        if (RegExMatch(rsData, """presetGroups"":""(.*?)""}", m4)) {
            pgRestored := m4
            pgRestored := StrReplace(pgRestored, "\n", "`n")
            pgRestored := StrReplace(pgRestored, "\""", """")
            pgRestored := StrReplace(pgRestored, "\\", "\")
            f := FileOpen(PRESET_GROUPS, "w", "UTF-8")
            f.Write(pgRestored)
            f.Close()
        }
        ; Reload the app to pick up restored state
        Reload
    } catch e {
        TrayTip, RVL, Restore failed: %e%, 3, 3
    }
Return

; ============================================================
;  RELOAD STATE (after backup restore)
; ============================================================
OnReloadState:
    Reload
Return

; ============================================================
;  EXPORT STATISTICS (Enhancement F3)
;  Reads __dash_export_req (format: "csv:<data>" or "json:<data>")
;  and saves to file.
; ============================================================
OnExportStats:
    try {
        req := WB.document.getElementById("__dash_export_req").value
        WB.document.getElementById("__dash_export_req").value := ""
        if (InStr(req, "csv:")) {
            data := SubStr(req, 5)
            data := UriDecode(data)
            FileSelectFile, expPath, S16, %A_ScriptDir%\data\rvl_stats.csv, Export statistics — choose file, CSV files (*.csv)
            if (expPath != "") {
                f := FileOpen(expPath, "w", "UTF-8")
                f.Write(data)
                f.Close()
            }
        } else if (InStr(req, "json:")) {
            data := SubStr(req, 6)
            data := UriDecode(data)
            FileSelectFile, expPath, S16, %A_ScriptDir%\data\rvl_stats.json, Export statistics — choose file, JSON files (*.json)
            if (expPath != "") {
                f := FileOpen(expPath, "w", "UTF-8")
                f.Write(data)
                f.Close()
            }
        }
    }
Return

UriDecode(str) {
    pos := 1
    Loop {
        pos := InStr(str, "%", false, pos)
        if (pos = 0)
            break
        hex := SubStr(str, pos + 1, 2)
        char := Chr("0x" . hex)
        str := SubStr(str, 1, pos - 1) . char . SubStr(str, pos + 3)
        pos += 1
    }
    return str
}

; ============================================================
;  SAVE WINDOW POSITION (Enhancement: remember position)
; ============================================================
OnSaveWindowPos:
    try {
        WinGetPos, winX, winY, , , ahk_id %hMainWnd%
        IniWrite, %winX%, %CFG%, Settings, WindowX
        IniWrite, %winY%, %CFG%, Settings, WindowY
    }
Return

; ============================================================
;  TRAY MENU WITH FAVORITES (Enhancement D1)
;  Rebuilds tray menu with favorite presets for quick launch.
; ============================================================
RebuildTrayMenu:
    Menu, Tray, DeleteAll
    Menu, Tray, Add, Show Window,    ShowWindow
    Menu, Tray, Add, Launch Roblox,  RunFromTray

    ; Add favorite presets submenu
    favCount := 0
    ; Clear previous data
    for k, v in g_tray_fav_data {
        g_tray_fav_data.Delete(k)
    }
    if (FileExist(PRESETS)) {
        FileRead, presetsRaw, *P65001 %PRESETS%
        ; Extract favorite preset names via regex — search for both
        ; "favorite": true and "favorite":true (with or without space)
        startPos := 1
        Loop {
            favPos := InStr(presetsRaw, """favorite"": true", false, startPos)
            if (favPos = 0)
                favPos := InStr(presetsRaw, """favorite"":true", false, startPos)
            if (favPos = 0)
                break
            ; Find the name before this favorite flag
            seg := SubStr(presetsRaw, 1, favPos)
            nameVal := ""
            pidVal := ""
            lcVal := ""
            methodVal := "1"
            pos := 1
            while (pos := RegExMatch(seg, """name"":""([^""]+)""", nm, pos)) {
                nameVal := nm1
                pos += StrLen(nm)
            }
            pos := 1
            while (pos := RegExMatch(seg, """placeId"":""([^""]*)""", pm, pos)) {
                pidVal := pm1
                pos += StrLen(pm)
            }
            pos := 1
            while (pos := RegExMatch(seg, """linkCode"":""([^""]*)""", lm, pos)) {
                lcVal := lm1
                pos += StrLen(lm)
            }
            pos := 1
            while (pos := RegExMatch(seg, """method"":(\d+)", mm, pos)) {
                methodVal := mm1
                pos += StrLen(mm)
            }
            ; Allow presets with either placeId or linkCode
            if (nameVal != "" && (pidVal != "" || lcVal != "")) {
                if (favCount = 0) {
                    Menu, Tray, Add
                }
                Menu, Tray, Add, %nameVal%, TrayFavLaunch
                g_tray_fav_data[nameVal] := {pid: pidVal, lc: lcVal, method: methodVal}
                favCount++
            }
            startPos := favPos + 20
        }
    }

    Menu, Tray, Add
    Menu, Tray, Add, Exit, ExitApp
    Menu, Tray, Default, Show Window
    Menu, Tray, Click, 1
    Menu, Tray, Tip, RVL
Return

TrayFavLaunch:
    itemName := A_ThisMenuItem
    if (g_tray_fav_data.HasKey(itemName)) {
        d := g_tray_fav_data[itemName]
        if (d.method = "2") {
            LaunchRobloxShare(d.lc)
        } else {
            LaunchRoblox(d.pid, d.lc)
        }
    }
Return

ExitApp:
    Gosub, CloseSettingsWindow
    Gosub, ReadDom
    Gosub, SaveConfig
    Gosub, WritePresets
    Gosub, WriteThemePresets
    Gosub, WritePresetGroups
    Gosub, OnSaveWindowPos
    FileDelete, %TMP_HTML%
    FileDelete, %TMP_SETTINGS_HTML%
    ExitApp
Return

SettingsGuiClose:
SettingsGuiEscape:
    Gosub, CloseSettingsWindow
Return

GuiClose:
    Gui, Hide
Return
