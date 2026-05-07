/* ============================================================
   app.js  ·  Roblox Launcher v1.0
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

/* ============================================================
   INIT
   ============================================================ */
function initApp() {
    var place   = el("__cfg_place").value;
    var link    = el("__cfg_link").value;
    var hotkey  = el("__cfg_hotkey").value;
    var enabled = el("__cfg_enabled").value !== "0";

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
    el("btn-launch").onclick        = onLaunch;
    el("btn-save").onclick          = onSaveClose;
    el("btn-update").onclick        = function () { sendCmd("CMD:update"); };
    el("btn-capture").onclick       = function () { startCapture(); return false; };
    el("btn-add-preset").onclick    = togglePresetForm;
    el("btn-preset-ok").onclick     = confirmNewPreset;
    el("btn-preset-cancel").onclick = closePresetForm;

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
        if (t.id === "btn-min" || t.id === "btn-close") return;
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
    if (txt) txt.innerHTML = "&#8593; Доступно обновление " + version + (changelog ? " &mdash; " + changelog : "");
    if (bar) bar.className = "update-bar visible";
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