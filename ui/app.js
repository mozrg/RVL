/* ============================================================
   app.js  ·  RVL v1.0
   IE 11 / Shell.Explorer compatible
   AHK bridge: document.title for commands, hidden inputs for data
   ============================================================ */

/* ── Key code → AHK name map (used for reference only now) ─ */
var KEY_MAP = {
    112:"F1",  113:"F2",  114:"F3",  115:"F4",  116:"F5",
    117:"F6",  118:"F7",  119:"F8",  120:"F9",  121:"F10",
    122:"F11", 123:"F12",
    37:"Left", 38:"Up",   39:"Right", 40:"Down",
    45:"Insert",  46:"Delete",
    36:"Home",    35:"End",
    33:"PgUp",    34:"PgDn",
    9:"Tab",      13:"Enter",  32:"Space",  8:"Backspace",
    20:"CapsLock",144:"NumLock",
    107:"NumpadAdd",  109:"NumpadSub",
    106:"NumpadMult", 111:"NumpadDiv"
};

/* ── Preset dot colours (cycles by index) ───────────────── */
var DOT_COLORS = [
    "#6366F1","#10B981","#F59E0B","#EF4444","#06B6D4","#8B5CF6","#EC4899"
];

/* ── App state ──────────────────────────────────────────── */
var presets       = [];
var capturingKey  = false;
var formOpen      = false;
var themeMode     = "dark";
var updateVisible = false;
var customTheme   = {
    bg:      "#0A0A0A",
    surface: "#111111",
    text:    "#E8E8E8",
    accent:  "#FFFFFF"
};

/* ============================================================
   INIT
   ============================================================ */
function initApp() {
    var place   = el("__cfg_place").value;
    var link    = el("__cfg_link").value;
    var hotkey  = el("__cfg_hotkey").value;
    var enabled = el("__cfg_enabled").value !== "0";

    themeMode = safeThemeMode(el("__cfg_theme_mode").value);
    customTheme.bg      = normalizeHex(el("__cfg_theme_bg").value, "#0A0A0A");
    customTheme.surface = normalizeHex(el("__cfg_theme_surface").value, "#111111");
    customTheme.text    = normalizeHex(el("__cfg_theme_text").value, "#E8E8E8");
    customTheme.accent  = normalizeHex(el("__cfg_theme_accent").value, "#FFFFFF");

    el("inp-place").value = place;
    el("inp-link").value  = link;
    el("inp-key").value   = hotkey;

    el("chk-enabled").checked = enabled;
    syncToggle(enabled);

    try {
        var raw = el("__cfg_presets").value;
        presets = JSON.parse(raw || "[]");
        if (!isArray(presets)) presets = [];
    } catch (e) {
        presets = [];
    }
    renderPresets();
    syncThemeControls();
    applyTheme();
}

/* ============================================================
   DOM READY
   ============================================================ */
window.onload = function () {
    document.title = "CMD:ready";

    el("btn-guide").onmouseover = function () {
        var tt  = el("guide-tooltip");
        var btn = el("btn-guide");
        tt.style.top   = (btn.offsetTop + btn.offsetHeight + 6) + "px";
        tt.style.right = "auto";
        tt.style.left  = btn.offsetLeft + "px";
        tt.className   = "guide-tooltip visible";
    };
    el("btn-guide").onmouseout = function () {
        el("guide-tooltip").className = "guide-tooltip";
    };

    el("btn-min").onclick           = onMinimize;
    el("btn-close").onclick         = function () { sendCmd("CMD:close"); };
    el("btn-settings").onclick      = openSettings;
    el("btn-launch").onclick        = onLaunch;
    el("btn-save").onclick          = onSaveClose;
    el("btn-update").onclick        = function () { sendCmd("CMD:update"); };
    el("btn-capture").onclick       = function () { startCapture(); return false; };
    el("btn-add-preset").onclick    = togglePresetForm;
    el("btn-preset-ok").onclick     = confirmNewPreset;
    el("btn-preset-cancel").onclick = closePresetForm;
    el("settings-close").onclick    = closeSettings;
    el("settings-save").onclick     = saveSettings;
    el("theme-opt-dark").onclick    = function () { selectThemeMode("dark"); };
    el("theme-opt-light").onclick   = function () { selectThemeMode("light"); };
    el("theme-opt-custom").onclick  = function () { selectThemeMode("custom"); };
    el("settings-overlay").onclick  = function (e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t && t.id === "settings-overlay") closeSettings();
    };

    bindColorInput("theme-bg");
    bindColorInput("theme-surface");
    bindColorInput("theme-text");
    bindColorInput("theme-accent");

    /* FIX: prevent label-behavior double-toggle in IE11 */
    el("toggle-track").onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        var chk = el("chk-enabled");
        chk.checked = !chk.checked;
        syncToggle(chk.checked);
        sendCmd("CMD:hotkey_update");
        return false;
    };

    el("inp-preset-name").onkeydown = function (e) {
        e = e || window.event;
        if ((e.keyCode || e.which) === 13) confirmNewPreset();
        if ((e.keyCode || e.which) === 27) closePresetForm();
    };

    /* ── Drag handling (instant, IE-capture safe) ─────────── */
    var titlebar = el("titlebar");

    titlebar.onmousedown = function (e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t.id === "btn-min" || t.id === "btn-close" || t.id === "btn-settings") return;
        if (e.button !== 0) return;

        // IE ActiveX fix: capture mouse so events fire immediately
        if (titlebar.setCapture) {
            try { titlebar.setCapture(); } catch(x){}
        }

        sendCmd("CMD:drag_start");
        return cancelEv(e);
    };

    document.onmouseup = function () {
        if (titlebar.releaseCapture) {
            try { titlebar.releaseCapture(); } catch(x){}
        }
    };
};

/* ============================================================
   BUTTON HANDLERS
   ============================================================ */
function onLaunch() {
    flushPresetsOut();
    sendCmd("CMD:launch");
}

function onSaveClose() {
    flushPresetsOut();
    sendCmd("CMD:save_close");
}

function onMinimize() {
    flushPresetsOut();
    sendCmd("CMD:minimize");
}

/* ============================================================
   SETTINGS / THEMES
   ============================================================ */
function openSettings() {
    syncThemeControls();
    var overlay = el("settings-overlay");
    overlay.style.display = "flex";
    setTimeout(function () {
        overlay.className = "settings-overlay settings-overlay-visible";
    }, 10);
}

function closeSettings() {
    var overlay = el("settings-overlay");
    overlay.className = "settings-overlay";
    setTimeout(function () {
        overlay.style.display = "none";
    }, 220);
}

function saveSettings() {
    syncCustomFromInputs(true);
    syncThemeControls();
    applyTheme();
    sendCmd("CMD:settings_save");
    closeSettings();
}

function selectThemeMode(mode) {
    themeMode = safeThemeMode(mode);
    el("theme-mode").value = themeMode;
    syncCustomFromInputs(false);
    syncThemeControls();
    applyTheme();
}

function syncThemeControls() {
    var mode = safeThemeMode(themeMode);
    el("theme-mode").value = mode;
    el("theme-bg").value = customTheme.bg;
    el("theme-surface").value = customTheme.surface;
    el("theme-text").value = customTheme.text;
    el("theme-accent").value = customTheme.accent;

    el("theme-opt-dark").className   = mode === "dark"   ? "theme-option active" : "theme-option";
    el("theme-opt-light").className  = mode === "light"  ? "theme-option active" : "theme-option";
    el("theme-opt-custom").className = mode === "custom" ? "theme-option active" : "theme-option";
    el("custom-theme").className     = mode === "custom" ? "custom-theme open" : "custom-theme";

    updateSwatches();
}

function bindColorInput(id) {
    var node = el(id);
    node.onkeyup = function () {
        syncCustomFromInputs(false);
        updateSwatches();
        if (themeMode === "custom") applyTheme();
    };
    node.onchange = node.onkeyup;
}

function syncCustomFromInputs(forceNormalize) {
    customTheme.bg      = readColor("theme-bg", customTheme.bg, forceNormalize);
    customTheme.surface = readColor("theme-surface", customTheme.surface, forceNormalize);
    customTheme.text    = readColor("theme-text", customTheme.text, forceNormalize);
    customTheme.accent  = readColor("theme-accent", customTheme.accent, forceNormalize);

    if (forceNormalize) {
        el("theme-bg").value = customTheme.bg;
        el("theme-surface").value = customTheme.surface;
        el("theme-text").value = customTheme.text;
        el("theme-accent").value = customTheme.accent;
    }
}

function readColor(id, fallback, forceNormalize) {
    var raw = trim(el(id).value);
    if (isHex(raw)) return normalizeHex(raw, fallback);
    return forceNormalize ? fallback : fallback;
}

function updateSwatches() {
    el("swatch-bg").style.backgroundColor = customTheme.bg;
    el("swatch-surface").style.backgroundColor = customTheme.surface;
    el("swatch-text").style.backgroundColor = customTheme.text;
    el("swatch-accent").style.backgroundColor = customTheme.accent;
}

function applyTheme() {
    var cls = [];
    if (updateVisible) cls.push("has-update");
    if (themeMode === "light") cls.push("theme-light");
    if (themeMode === "custom") cls.push("theme-custom");

    document.documentElement.className = cls.join(" ");
    document.body.className = cls.join(" ");
    applyCustomThemeStyle();
}

function applyCustomThemeStyle() {
    var css = "";
    if (themeMode === "custom") {
        css =
            "body.theme-custom{background:" + customTheme.bg + ";color:" + customTheme.text + ";border-color:" + customTheme.accent + ";}" +
            "body.theme-custom .titlebar,body.theme-custom .guide-modal,body.theme-custom .settings-modal,body.theme-custom .guide-header,body.theme-custom .settings-header{background:" + customTheme.surface + ";border-color:" + customTheme.accent + ";}" +
            "body.theme-custom .content,body.theme-custom .field-input,body.theme-custom .color-input,body.theme-custom .preset-row,body.theme-custom .btn-capture,body.theme-custom .btn-secondary,body.theme-custom .btn-ghost,body.theme-custom .btn-guide,body.theme-custom .btn-cancel,body.theme-custom .theme-option,body.theme-custom .preset-load,body.theme-custom .preset-del,body.theme-custom .guide-code,body.theme-custom .guide-tag{background:" + customTheme.surface + ";color:" + customTheme.text + ";border-color:" + customTheme.accent + ";}" +
            "body.theme-custom .accent-bar,body.theme-custom .btn-primary,body.theme-custom .btn-confirm,body.theme-custom .settings-save,body.theme-custom .toggle-track.on,body.theme-custom .theme-option.active{background:" + customTheme.accent + ";color:" + customTheme.bg + ";border-color:" + customTheme.accent + ";}" +
            "body.theme-custom .tb-logo,body.theme-custom .tb-title,body.theme-custom .guide-title,body.theme-custom .settings-title,body.theme-custom .tc-btn,body.theme-custom .guide-close,body.theme-custom .settings-close,body.theme-custom .field-label,body.theme-custom .section-title,body.theme-custom .settings-label,body.theme-custom .color-name,body.theme-custom .chk-txt,body.theme-custom .preset-sub,body.theme-custom .tb-ver,body.theme-custom .guide-text,body.theme-custom .preset-name{color:" + customTheme.text + ";}" +
            "body.theme-custom .divider{background:" + customTheme.accent + ";}" +
            "body.theme-custom .update-bar{background:" + customTheme.surface + ";border-color:" + customTheme.accent + ";}" +
            "body.theme-custom .update-txt,body.theme-custom .btn-update{color:" + customTheme.accent + ";border-color:" + customTheme.accent + ";}" +
            "body.theme-custom .btn-update:hover{background:" + customTheme.accent + ";color:" + customTheme.bg + ";}";
    }
    setStyleText("custom-theme-style", css);
}

function setStyleText(id, css) {
    var style = el(id);
    if (!style) {
        style = document.createElement("style");
        style.id = id;
        document.getElementsByTagName("head")[0].appendChild(style);
    }
    if (style.styleSheet) style.styleSheet.cssText = css;
    else style.textContent = css;
}

/* ============================================================
   PRESETS CRUD
   ============================================================ */
function togglePresetForm() {
    if (formOpen) closePresetForm();
    else openPresetForm();
}

function openPresetForm() {
    formOpen = true;
    var pf = el("preset-form");
    pf.className = "preset-form open";
    el("inp-preset-name").value = "";
    try { el("inp-preset-name").focus(); } catch(e){}
}

function closePresetForm() {
    formOpen = false;
    el("preset-form").className = "preset-form";
}

function confirmNewPreset() {
    var name = trim(el("inp-preset-name").value);
    if (!name) {
        try { el("inp-preset-name").focus(); } catch(e){}
        return;
    }
    var preset = {
        id:      uid(),
        name:    name,
        placeId: trim(el("inp-place").value),
        linkCode:trim(el("inp-link").value)
    };
    presets.push(preset);
    renderPresets();
    closePresetForm();
    flushPresetsOut();
    sendCmd("CMD:save_preset");
}

function loadPreset(id) {
    var p = findPreset(id);
    if (!p) return;
    el("inp-place").value = p.placeId;
    el("inp-link").value  = p.linkCode;
}

function deletePreset(id) {
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) {
            presets.splice(i, 1);
            break;
        }
    }
    renderPresets();
    flushPresetsOut();
    sendCmd("CMD:del_preset");
}

function renderPresets() {
    var list = el("presets-list");
    list.innerHTML = "";

    if (!presets.length) {
        var empty = document.createElement("div");
        empty.className = "presets-empty";
        empty.innerHTML = "No presets saved yet";
        list.appendChild(empty);
        return;
    }

    for (var i = 0; i < presets.length; i++) {
        list.appendChild(buildPresetRow(presets[i], i));
    }
}

function buildPresetRow(p, idx) {
    var row = document.createElement("div");
    row.className = "preset-row";
    row.setAttribute("data-id", p.id);

    var dot = document.createElement("span");
    dot.className = "preset-dot";
    dot.style.background = DOT_COLORS[idx % DOT_COLORS.length];
    dot.style.color = DOT_COLORS[idx % DOT_COLORS.length]; // for shadow

    var name = document.createElement("span");
    name.className = "preset-name";
    name.appendChild(document.createTextNode(p.name));

    var sub = document.createElement("span");
    sub.className = "preset-sub";
    sub.appendChild(document.createTextNode("ID " + abbrev(p.placeId, 8)));

    var load = document.createElement("button");
    load.className = "preset-load";
    load.innerHTML = "LOAD";
    load.setAttribute("data-pid", p.id);
    load.onclick   = makeLoader(p.id);

    var del = document.createElement("button");
    del.className = "preset-del";
    del.innerHTML = "&#215;";
    del.setAttribute("data-pid", p.id);
    del.onclick   = makeDeleter(p.id);

    row.appendChild(dot);
    row.appendChild(name);
    row.appendChild(sub);
    row.appendChild(load);
    row.appendChild(del);

    return row;
}

function makeLoader(id)  { return function () { loadPreset(id);  }; }
function makeDeleter(id) { return function () { deletePreset(id); }; }

/* ============================================================
   HOTKEY CAPTURE  (delegated to AHK via CMD:capture_start)
   ============================================================ */
function startCapture() {
    if (capturingKey) return;
    capturingKey = true;

    var btn = el("btn-capture");
    btn.innerHTML = "PRESS KEY...";
    btn.className = "btn-capture capturing";

    sendCmd("CMD:capture_start");
}

/* Called by AHK after key capture (keyName = null on cancel) */
function stopCaptureExternal(keyName) {
    capturingKey = false;
    var btn = el("btn-capture");
    btn.innerHTML = "&#9673;&nbsp;CAPTURE";
    btn.className = "btn-capture";

    if (keyName !== null && keyName !== "") {
        el("inp-key").value = keyName;
        el("chk-enabled").checked = true;
        syncToggle(true);
        sendCmd("CMD:hotkey_update");
    }
}

/* ============================================================
   TOGGLE SWITCH SYNC
   ============================================================ */
function syncToggle(on) {
    var track = el("toggle-track");
    if (on) {
        track.className = "toggle-track on";
    } else {
        track.className = "toggle-track";
    }
}

/* ============================================================
   UPDATE BAR  (called by AHK when new version detected)
   ============================================================ */
function showUpdateBar(version, changelog) {
    var bar = el("update-bar");
    var txt = el("update-txt");
    updateVisible = true;
    applyTheme();
    if (txt) txt.innerHTML = "Update available: " + version + (changelog ? " &mdash; " + changelog : "");
    if (bar) bar.className = "update-bar visible";
    sendCmd("CMD:show_update");
}

function setUpdating(on) {
    var btn = el("btn-update");
    if (!btn) return;
    if (on) {
        btn.innerHTML     = "UPDATING...";
        btn.disabled      = true;
        btn.style.opacity = "0.5";
    } else {
        btn.innerHTML     = "&#8593;&nbsp;UPDATE";
        btn.disabled      = false;
        btn.style.opacity = "1";
    }
}

/* ============================================================
   AHK BRIDGE HELPERS
   ============================================================ */
function flushPresetsOut() {
    try {
        el("__presets_out").value = JSON.stringify(presets);
    } catch (e) {}
}

function sendCmd(cmd) {
    document.title = cmd;
}

/* ============================================================
   UTILS
   ============================================================ */
function el(id)       { return document.getElementById(id); }
function trim(s)      { return s ? s.replace(/^\s+|\s+$/g, "") : ""; }
function abbrev(s, n) { return (s && s.length > n) ? s.slice(0, n) + "…" : s; }
function isArray(v)   { return Object.prototype.toString.call(v) === "[object Array]"; }
function safeThemeMode(mode) {
    mode = trim(mode).toLowerCase();
    return (mode === "light" || mode === "custom") ? mode : "dark";
}
function isHex(value) {
    value = trim(value);
    return /^#?[0-9a-fA-F]{6}$/.test(value) || /^#?[0-9a-fA-F]{3}$/.test(value);
}
function normalizeHex(value, fallback) {
    value = trim(value);
    if (!isHex(value)) return fallback;
    if (value.charAt(0) !== "#") value = "#" + value;
    value = value.toUpperCase();
    if (value.length === 4) {
        value = "#" + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2) + value.charAt(3) + value.charAt(3);
    }
    return value;
}
function findPreset(id) {
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) return presets[i];
    }
    return null;
}

function uid() {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toUpperCase();
}

function cancelEv(e) {
    e = e || window.event;
    try { if (e.preventDefault)  e.preventDefault();  } catch(x){}
    try { if (e.stopPropagation) e.stopPropagation(); } catch(x){}
    try { e.returnValue = false; } catch(x){}
    return false;
}
