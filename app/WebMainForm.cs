using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.IO.Compression;
using Microsoft.Win32;
using System.Collections.Concurrent;

namespace RVL;

/// <summary>
/// Native host for the existing RVL UI. The HTML/CSS/JS remain the source of
/// truth for the layout and feature set; this class replaces only the old AHK
/// window/DOM bridge.
/// </summary>
public sealed class WebMainForm : Form
{
    private const int MainHotKeyId = 42001;
    private const int ShowHideHotKeyId = 42002;
    private const int PresetHotKeyBase = 42100;
    private const int WmHotKey = 0x0312;
    private const int WmNclButtonDown = 0xA1;
    private const int WmNchittest = 0x0084;
    private const int HtCaption = 2;
    private const int HtClient = 1;
    private readonly WebView2 _web = new();
    private readonly NativeConfig _config;
    private readonly bool _isSettings;
    private readonly string _windowKind;
    private readonly WebMainForm? _owner;
    private readonly Dictionary<string, WebMainForm> _childWindows = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<int, string> _presetHotkeys = new();
    private readonly Dictionary<string, int> _registeredKeys = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, byte> _thumbnailRequests = new(StringComparer.OrdinalIgnoreCase);
    private readonly SemaphoreSlim _thumbnailPushLock = new(1, 1);
    private NotifyIcon? _tray;
    private System.Windows.Forms.Timer? _statusTimer;
    private bool _ready;
    private bool _capturing;
    private string _captureKind = "";
    private string _updateState = "idle";
    private string _updateVersion = "";
    private string _updateMessage = "";
    private int _updateProgress;
    private string _updateUrl = "";
    private bool _updateIsNativePackage;

    [DllImport("user32.dll")] private static extern bool ReleaseCapture();
    [DllImport("user32.dll")] private static extern nint SendMessage(nint hWnd, int msg, nint wParam, nint lParam);
    [DllImport("user32.dll")] private static extern nint GetForegroundWindow();
    [DllImport("user32.dll", SetLastError = true)] private static extern bool RegisterHotKey(nint hWnd, int id, uint modifiers, uint key);
    [DllImport("user32.dll", SetLastError = true)] private static extern bool UnregisterHotKey(nint hWnd, int id);

    [DllImport("dwmapi.dll")] private static extern int DwmSetWindowAttribute(nint hwnd, int attribute, ref int value, int size);

    private const int DwmwaNcRenderingPolicy = 2;       /* DWMWA_NCRENDERING_POLICY */
    private const int DwmwaWindowCornerPreference = 33; /* DWMWA_WINDOW_CORNER_PREFERENCE */
    private const int DwmwaBorderColor = 34;            /* DWMWA_BORDER_COLOR */
    private const int DwmncrpDisabled = 3;              /* DWMNCRP_DISABLED — no drop shadow */
    private const int DwmcpRound = 2;                   /* DWMWCP_ROUND */
    private const int DwmColorNone = unchecked((int)0xFFFFFFFE); /* DWMWA_COLOR_NONE */

    private static readonly HttpClient Http = CreateHttpClient();
    private static readonly object WebViewEnvironmentSync = new();
    private static Task<CoreWebView2Environment>? _webViewEnvironmentTask;

    public WebMainForm() : this(new NativeConfig(), "main", null) { }

    private WebMainForm(NativeConfig config, bool settings, WebMainForm? owner)
        : this(config, settings ? "settings" : "main", owner) { }

    private WebMainForm(NativeConfig config, string windowKind, WebMainForm? owner)
    {
        _config = config;
        _windowKind = windowKind;
        _isSettings = windowKind.Equals("settings", StringComparison.OrdinalIgnoreCase);
        _owner = owner;

        Text = _isSettings ? "RVL — Настройки" : windowKind == "main" ? "RVL" : "RVL — " + WindowTitle(windowKind);
        Icon = LoadIcon();
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = windowKind == "main" ? FormStartPosition.CenterScreen : FormStartPosition.CenterParent;
        ClientSize = _isSettings ? new Size(760, 680) : windowKind == "main" ? new Size(900, 610) : ToolWindowSize(windowKind);
        MinimumSize = _isSettings ? new Size(600, 420) : new Size(360, 300);
        BackColor = ThemeSurfaceColor();
        ShowInTaskbar = true;
        KeyPreview = true;
        /* The position must be final BEFORE the window is created — otherwise
           a fresh install flashes the form in the top-left corner and an
           existing install shows it there for a frame before it jumps to the
           saved spot. */
        if (windowKind == "main") ApplySavedStartupPosition();

        _web.Dock = DockStyle.Fill;
        _web.CreationProperties = new CoreWebView2CreationProperties();
        /* The WebView2 surface must match the page background: at the rounded
           corners the page's own border-radius exposes whatever is behind it,
           and a hardcoded dark color shows as ugly dark pixels in the light
           theme. */
        _web.DefaultBackgroundColor = ThemeSurfaceColor();
        Controls.Add(_web);
        FormClosing += OnFormClosing;
        Resize += (_, _) => { if (_ready && _windowKind == "main") SaveWindowPosition(); };
    }

    private static string WindowTitle(string kind) => kind switch
    {
        "history" => "История",
        "dashboard" => "Статистика",
        "backup" => "Резервная копия",
        "bulk" => "Массовое редактирование",
        "export" => "Экспорт пресетов",
        "guide" => "Инструкция",
        "groups" => "Группы",
        "themes" => "Цветовые пресеты",
        "new" => "Новый пресет",
        _ => "Окно"
    };

    /* Corner color: the WebView2 surface and the form must both match the
       active theme background, otherwise the page's rounded corners expose
       mismatched pixels. NOTE: ThemeBg belongs to the CUSTOM theme only —
       using it for the dark theme painted the pre-render surface dark red
       (#1C0400), which read as a "red window" flash. */
    private Color ThemeSurfaceColor()
    {
        var mode = _config.Get("ThemeMode", "dark");
        if (mode == "light") return Color.FromArgb(244, 245, 247); /* body.theme-light #F4F5F7 */
        if (mode == "custom") return ParseHexColor(_config.Get("ThemeBg", "#0A0A0A"), Color.FromArgb(10, 10, 10));
        return Color.FromArgb(15, 15, 15); /* dark theme base */
    }

    private static Color ParseHexColor(string value, Color fallback)
    {
        try { return ColorTranslator.FromHtml(value); }
        catch { return fallback; }
    }

    private void UpdateThemeSurfaceColor()
    {
        var color = ThemeSurfaceColor();
        BackColor = color;
        _web.DefaultBackgroundColor = color;
    }

    /* The config may lag behind the live theme (settings changes become
       persistent only on SAVE), so after the page renders, match the surface
       to the page's actual computed background. A transparent result (the
       gradient custom themes paint a background IMAGE) keeps the
       config-based color instead of turning the corners black. */
    private async Task UpdateSurfaceColorFromPageAsync()
    {
        try
        {
            var raw = await ReadValueJs("(function(){var c=getComputedStyle(document.body).backgroundColor;return c||'';})()");
            if (string.IsNullOrWhiteSpace(raw)) return;
            var numbers = Regex.Matches(raw, "\\d+");
            if (numbers.Count >= 4 && int.Parse(numbers[3].Value) == 0) return;
            if (numbers.Count < 3) return;
            var r = int.Parse(numbers[0].Value);
            var g = int.Parse(numbers[1].Value);
            var b = int.Parse(numbers[2].Value);
            var color = Color.FromArgb(r, g, b);
            BackColor = color;
            _web.DefaultBackgroundColor = color;
        }
        catch { }
    }

    /* Tool windows show their panel edge-to-edge, so every window is sized to
       its panel's natural design size instead of one oversized dark frame. */
    private static Size ToolWindowSize(string kind) => kind switch
    {
        "history" => new Size(660, 620),
        "dashboard" => new Size(640, 640),
        "backup" => new Size(420, 300),
        "bulk" => new Size(420, 500),
        "groups" => new Size(700, 360),
        "export" => new Size(760, 560),
        "guide" => new Size(760, 380),
        "new" => new Size(520, 430),
        _ => new Size(760, 620)
    };

    protected override async void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        ApplyDwmWindowAttributes();
        await EnsureWebInitializedAsync();
    }

    private Task? _initTask;
    private TaskCompletionSource<bool>? _firstRender;

    /* The window must appear only when the interface is already rendered —
       a WebView2 control shown before initialization flashes a solid
       uninitialized surface at the user. Tool windows are created hidden
       (ShowDeferred) and revealed right after the first page render.
       NOTE: touching Handle on a form raises OnLoad, so initialization may
       already be running when ShowDeferred continues — always await the
       shared task instead of trusting a flag alone. */
    private Task EnsureWebInitializedAsync()
    {
        if (_initTask is not null) return _initTask;
        _initTask = InitializeWebAsync();
        return _initTask;
    }

    private async Task InitializeWebAsync()
    {
        try
        {
            var environment = await GetWebViewEnvironmentAsync();
            await _web.EnsureCoreWebView2Async(environment);
            _web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            _web.CoreWebView2.Settings.AreDevToolsEnabled = false;
            _web.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            _firstRender = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            _web.CoreWebView2.NavigationCompleted += async (_, _) =>
            {
                if (_windowKind != "main")
                {
                    await InjectStateAsync(true);
                    await SetNativePopupTitleAsync();
                }
                await UpdateSurfaceColorFromPageAsync();
                _firstRender?.TrySetResult(true);
            };

            var index = Path.Combine(_config.UiDirectory, "index.html");
            var uri = new Uri(index).AbsoluteUri + (_windowKind == "main" ? "" : "#" + _windowKind + "-native");
            _web.CoreWebView2.Navigate(uri);
            if (_windowKind == "main")
            {
                TopMost = _config.GetBool("AlwaysOnTop");
                Opacity = Math.Clamp(_config.GetInt("Opacity", 255), 26, 255) / 255d;
                CreateTray();
                _statusTimer = new System.Windows.Forms.Timer { Interval = 2000 };
                _statusTimer.Tick += async (_, _) => await UpdateRobloxStatusAsync();
                _statusTimer.Start();
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "Не удалось запустить встроенный UI. Установите Microsoft Edge WebView2 Runtime.\n\n" + ex.Message, "RVL", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    public async void ShowDeferred(IWin32Window owner)
    {
        Owner = owner as Form;
        if (!IsHandleCreated) { var _ = Handle; }
        ApplyDwmWindowAttributes();
        await EnsureWebInitializedAsync();
        if (_firstRender is not null) { try { await _firstRender.Task; } catch { } }
        if (IsDisposed) return;
        Show(owner);
    }

    private async void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        var command = e.TryGetWebMessageAsString();
        if (string.IsNullOrWhiteSpace(command)) return;
        await HandleCommandAsync(command.Trim());
    }

    private async Task HandleCommandAsync(string command)
    {
        try
        {
            var payload = await ReadBridgeAsync();
            if (command == "CMD:ready")
            {
                await InjectStateAsync(true);
                return;
            }
            if (command.StartsWith("CMD:thumb_req ", StringComparison.Ordinal))
            {
                _ = FetchThumbnailAsync(command[14..].Trim());
                return;
            }

            switch (command)
            {
                case "CMD:open_settings": OpenSettings(); break;
                case "CMD:open_window new": OpenNativeWindow("new"); break;
                case "CMD:open_window history": OpenNativeWindow("history"); break;
                case "CMD:open_window dashboard": OpenNativeWindow("dashboard"); break;
                case "CMD:open_window backup": OpenNativeWindow("backup"); break;
                case "CMD:open_window bulk": OpenNativeWindow("bulk"); break;
                case "CMD:open_window export": OpenNativeWindow("export"); break;
                case "CMD:open_window guide": OpenNativeWindow("guide"); break;
                case "CMD:open_window groups": OpenNativeWindow("groups"); break;
                case "CMD:open_window themes": OpenNativeWindow("themes"); break;
                case "CMD:close_window": if (_windowKind != "main") Close(); break;
                case "CMD:close_settings": _owner?._settingsForm?.Close(); break;
                case "CMD:drag_start": DragWindow(); break;
                case "CMD:resize": ResizeFromBridge(payload); break;
                case "CMD:launch": await LaunchFromBridgeAsync(payload); break;
                case "CMD:save_close": SaveBridge(payload); CloseSettingsAndMain(); break;
                case "CMD:minimize": SaveBridge(payload); Hide(); break;
                case "CMD:close": SaveBridge(payload); Close(); break;
                case "CMD:save_preset": SaveBridge(payload); SyncAll(); ApplyPresetHotkeys(payload); break;
                case "CMD:del_preset": SaveBridge(payload); SyncAll(); ApplyPresetHotkeys(payload); break;
                case "CMD:save_preset_groups": SaveBridge(payload); SyncAll(); break;
                case "CMD:hotkey_update": SaveBridge(payload); ApplyMainHotkey(payload); break;
                case "CMD:settings_save": SaveBridge(payload); SyncAll(); if (_isSettings) Close(); break;
                case "CMD:settings_live": ApplyLiveBridge(payload); SyncAll(); break;
                case "CMD:set_opacity": ApplyOpacity(payload); break;
                case "CMD:set_always_on_top": ApplyAlwaysOnTop(payload); break;
                case "CMD:set_autostart": ApplyAutostart(payload); break;
                case "CMD:sh_capture_start": BeginCapture("show-hide"); break;
                case "CMD:sh_hotkey_update": SaveBridge(payload); ApplyShowHideHotkey(payload); break;
                case "CMD:capture_start": BeginCapture("main"); break;
                case "CMD:capture_preset_hk": BeginCapture("preset"); break;
                case "CMD:update_preset_hk": SaveBridge(payload); ApplyPresetHotkeys(payload); break;
                case "CMD:export_presets": ExportText(payload, "__presets_out", "JSON пресеты (*.json)|*.json", "rvl-presets.json"); break;
                case "CMD:import_presets": await ImportPresetsAsync(); break;
                case "CMD:export_theme_presets": ExportText(payload, "__theme_presets_out", "Цветовые пресеты (*.json)|*.json", "rvl-themes.json"); break;
                case "CMD:import_theme_presets": await ImportThemePresetsAsync(); break;
                case "CMD:save_theme_presets": SaveBridge(payload); SyncAll(); break;
                case "CMD:copy_clipboard": CopyToClipboard(payload); break;
                case "CMD:load_history": await PushHistoryAsync(); break;
                case "CMD:clear_history": _config.ClearHistory(); await PushHistoryAsync(); break;
                case "CMD:clear_avatars": ClearAvatars(); break;
                case "CMD:backup_create": BackupCreate(payload); break;
                case "CMD:backup_restore": BackupRestore(); break;
                case "CMD:reload_state": ReloadState(); break;
                case "CMD:export_stats": ExportStats(payload); break;
                case "CMD:save_window_pos": SaveWindowPosition(); break;
                case "CMD:factory_reset": FactoryReset(); break;
                case "CMD:check_update": await CheckUpdateAsync(); break;
                case "CMD:install_update": await InstallUpdateAsync(); break;
            }
        }
        catch (Exception ex)
        {
            SetStatus("error", ex.Message);
        }
    }

    private async Task<Dictionary<string, string>> ReadBridgeAsync()
    {
        if (_web.CoreWebView2 is null) return new Dictionary<string, string>();
        const string script = """
            (function(){
              var ids=["__cfg_place","__cfg_link","__cfg_hotkey","__cfg_enabled","__cfg_method","__cfg_theme_mode","__cfg_theme_bg","__cfg_theme_surface","__cfg_theme_text","__cfg_theme_accent","__cfg_auto_minimize","__cfg_scale","__cfg_launch_delay","__cfg_theme_grad_en","__cfg_theme_grad_bg2","__cfg_theme_grad_angle","__cfg_theme_grad_op","__cfg_tooltips","__cfg_lang","__cfg_last_preset","__cfg_opacity","__cfg_sh_key","__cfg_sh_en","__cfg_mask_inputs","__cfg_always_on_top","__cfg_autostart","__cfg_avatars","__cfg_compact_mode","__cfg_sort_mode","__cfg_ui_hidden","__cfg_ui_text","__cfg_ui_nobg","__cfg_presets","__presets_out","__cfg_theme_presets","__theme_presets_out","__cfg_preset_groups","__preset_groups_out","__preset_hk_map","__import_data","__import_theme_data","__clipboard_data","__history_data","__dash_export_req","__resize_req","__last_loaded_preset_id","__update_install_req"];
              var o={}; for(var i=0;i<ids.length;i++){var e=document.getElementById(ids[i]);o[ids[i]]=e?String(e.value||""):"";}
              var checks=["chk-enabled","chk-autostart","chk-always-on-top","chk-avatars","chk-compact-mode","chk-auto-minimize","chk-tooltips","chk-mask-inputs"];
              for(var j=0;j<checks.length;j++){var c=document.getElementById(checks[j]);if(c)o[checks[j]]=c.checked?"1":"0";}
              return JSON.stringify(o);
            })()
            """;
        var result = await _web.CoreWebView2.ExecuteScriptAsync(script);
        var inner = JsonSerializer.Deserialize<string>(result) ?? "{}";
        return JsonSerializer.Deserialize<Dictionary<string, string>>(inner) ?? new Dictionary<string, string>();
    }

    private async Task InjectStateAsync(bool initialize)
    {
        if (_web.CoreWebView2 is null) return;
        var data = BuildBridgeState();
        var json = JsonSerializer.Serialize(data);
        var init = initialize
            ? (_isSettings
                ? "window.__rvlNativeHost=true;window.__rvlNativeReady=true;document.documentElement.classList.add('settings-native-ready');initNativeSettingsPopup();"
                : _windowKind == "main"
                    ? "window.__rvlNativeHost=true;initApp();if(typeof refreshRvlIcons==='function')refreshRvlIcons();"
                    : $"window.__rvlNativeHost=true;window.__rvlNativeWindow={JsonSerializer.Serialize(_windowKind)};initApp();if(typeof initNativeWindow==='function')initNativeWindow(window.__rvlNativeWindow);if(typeof refreshRvlIcons==='function')refreshRvlIcons();")
            : "if(typeof syncSettingsFromNativeBridge==='function')syncSettingsFromNativeBridge();if(typeof reloadPresetsFromNativeBridge==='function')reloadPresetsFromNativeBridge();if(typeof refreshUpdateBridge==='function')refreshUpdateBridge();if(typeof refreshRvlIcons==='function')refreshRvlIcons();";
        var script = $"(function(){{var d={json};Object.keys(d).forEach(function(k){{var e=document.getElementById(k);if(e)e.value=d[k];}});{init}}})();";
        await _web.CoreWebView2.ExecuteScriptAsync(script);
        _ready = true;
        if (_windowKind == "main")
        {
            ApplyMainHotkey(data);
            ApplyShowHideHotkey(data);
            ApplyPresetHotkeys(data);
        }
    }

    private Dictionary<string, string> BuildBridgeState()
    {
        var d = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["__cfg_place"] = _config.Get("PlaceId"),
            ["__cfg_link"] = _config.Get("LinkCode"),
            ["__cfg_hotkey"] = _config.Get("HotkeyKey", "F4"),
            ["__cfg_enabled"] = _config.Get("HotkeyEnabled", "1"),
            ["__cfg_method"] = _config.Get("Method", "1"),
            ["__cfg_presets"] = _config.PresetsJson,
            ["__presets_out"] = _config.PresetsJson,
            ["__cfg_theme_mode"] = _config.Get("ThemeMode", "dark"),
            ["__cfg_theme_bg"] = _config.Get("ThemeBg", "#0A0A0A"),
            ["__cfg_theme_surface"] = _config.Get("ThemeSurface", "#111111"),
            ["__cfg_theme_text"] = _config.Get("ThemeText", "#E8E8E8"),
            ["__cfg_theme_accent"] = _config.Get("ThemeAccent", "#FFFFFF"),
            ["__cfg_auto_minimize"] = _config.Get("AutoMinimize", "0"),
            ["__cfg_scale"] = _config.Get("Scale", "1.0"),
            ["__cfg_launch_delay"] = _config.Get("LaunchDelay", "0"),
            ["__cfg_theme_grad_en"] = _config.Get("ThemeGradEn", "0"),
            ["__cfg_theme_grad_bg2"] = _config.Get("ThemeGradBg2", "#0A0A0A"),
            ["__cfg_theme_grad_angle"] = _config.Get("ThemeGradAngle", "135"),
            ["__cfg_theme_grad_op"] = _config.Get("ThemeGradOp", "100"),
            ["__cfg_tooltips"] = _config.Get("TooltipsEnabled", "1"),
            ["__cfg_lang"] = _config.Get("Lang", "ru"),
            ["__cfg_last_preset"] = _config.Get("LastPreset"),
            ["__cfg_opacity"] = _config.Get("Opacity", "255"),
            ["__cfg_sh_key"] = _config.Get("ShowHideKey"),
            ["__cfg_sh_en"] = _config.Get("ShowHideEnabled", "0"),
            ["__cfg_mask_inputs"] = _config.Get("MaskInputs", "1"),
            ["__cfg_always_on_top"] = _config.Get("AlwaysOnTop", "0"),
            ["__cfg_autostart"] = _config.Get("Autostart", "0"),
            ["__cfg_avatars"] = _config.Get("AvatarsEnabled", "1"),
            ["__cfg_compact_mode"] = _config.Get("CompactMode", "0"),
            ["__cfg_sort_mode"] = _config.Get("SortMode", "manual"),
            ["__cfg_ui_hidden"] = _config.Get("UiHidden"),
            ["__cfg_ui_text"] = _config.Get("UiText"),
            ["__cfg_ui_nobg"] = _config.Get("UiNoBg"),
            ["__cfg_theme_presets"] = _config.ThemePresetsJson,
            ["__theme_presets_out"] = _config.ThemePresetsJson,
            ["__cfg_preset_groups"] = _config.GroupsJson,
            ["__preset_groups_out"] = _config.GroupsJson,
            ["__app_version"] = "2.0",
            ["__update_state"] = _updateState,
            ["__update_version"] = _updateVersion,
            ["__update_message"] = _updateMessage,
            ["__update_progress"] = _updateProgress.ToString(),
            ["__update_notice"] = "",
            ["__roblox_status"] = IsRobloxRunning() ? "1" : "0",
            ["__thumb_resp"] = "",
            ["__avatars_cleared"] = ""
        };
        return d;
    }

    private void SaveBridge(Dictionary<string, string> values)
    {
        string V(string key, string fallback = "") => values.TryGetValue(key, out var value) ? value : fallback;
        _config.Set("PlaceId", V("inp-place", V("__cfg_place")));
        _config.Set("LinkCode", V("inp-link", V("__cfg_link")));
        _config.Set("Method", V("__cfg_method", "1"));
        _config.Set("HotkeyKey", V("inp-key", V("__cfg_hotkey", "F4")));
        _config.Set("HotkeyEnabled", V("chk-enabled", V("__cfg_enabled", "1")));
        var map = new Dictionary<string, string>
        {
            ["__cfg_theme_mode"] = "ThemeMode", ["__cfg_theme_bg"] = "ThemeBg", ["__cfg_theme_surface"] = "ThemeSurface", ["__cfg_theme_text"] = "ThemeText", ["__cfg_theme_accent"] = "ThemeAccent",
            ["__cfg_auto_minimize"] = "AutoMinimize", ["__cfg_scale"] = "Scale", ["__cfg_launch_delay"] = "LaunchDelay", ["__cfg_theme_grad_en"] = "ThemeGradEn", ["__cfg_theme_grad_bg2"] = "ThemeGradBg2", ["__cfg_theme_grad_angle"] = "ThemeGradAngle", ["__cfg_theme_grad_op"] = "ThemeGradOp",
            ["__cfg_tooltips"] = "TooltipsEnabled", ["__cfg_lang"] = "Lang", ["__cfg_last_preset"] = "LastPreset", ["__cfg_opacity"] = "Opacity", ["__cfg_sh_key"] = "ShowHideKey", ["__cfg_sh_en"] = "ShowHideEnabled", ["__cfg_mask_inputs"] = "MaskInputs", ["__cfg_always_on_top"] = "AlwaysOnTop", ["__cfg_autostart"] = "Autostart", ["__cfg_avatars"] = "AvatarsEnabled", ["__cfg_compact_mode"] = "CompactMode", ["__cfg_sort_mode"] = "SortMode", ["__cfg_ui_hidden"] = "UiHidden", ["__cfg_ui_text"] = "UiText", ["__cfg_ui_nobg"] = "UiNoBg"
        };
        foreach (var pair in map) _config.Set(pair.Value, V(pair.Key, _config.Get(pair.Value)));
        var presets = V("__presets_out", V("__cfg_presets", "[]"));
        var themes = V("__theme_presets_out", V("__cfg_theme_presets", "[]"));
        var groups = V("__preset_groups_out", V("__cfg_preset_groups", "[]"));
        _config.SaveJsonState(presets, themes, groups);
        _config.SaveIni();
    }

    private void ApplyLiveBridge(Dictionary<string, string> values)
    {
        var map = new Dictionary<string, string>
        {
            ["__cfg_theme_mode"] = "ThemeMode", ["__cfg_theme_bg"] = "ThemeBg", ["__cfg_theme_surface"] = "ThemeSurface", ["__cfg_theme_text"] = "ThemeText", ["__cfg_theme_accent"] = "ThemeAccent",
            ["__cfg_auto_minimize"] = "AutoMinimize", ["__cfg_scale"] = "Scale", ["__cfg_launch_delay"] = "LaunchDelay", ["__cfg_theme_grad_en"] = "ThemeGradEn", ["__cfg_theme_grad_bg2"] = "ThemeGradBg2", ["__cfg_theme_grad_angle"] = "ThemeGradAngle", ["__cfg_theme_grad_op"] = "ThemeGradOp",
            ["__cfg_tooltips"] = "TooltipsEnabled", ["__cfg_lang"] = "Lang", ["__cfg_opacity"] = "Opacity", ["__cfg_sh_key"] = "ShowHideKey", ["__cfg_sh_en"] = "ShowHideEnabled", ["__cfg_mask_inputs"] = "MaskInputs", ["__cfg_always_on_top"] = "AlwaysOnTop", ["__cfg_autostart"] = "Autostart", ["__cfg_avatars"] = "AvatarsEnabled", ["__cfg_compact_mode"] = "CompactMode", ["__cfg_sort_mode"] = "SortMode", ["__cfg_ui_hidden"] = "UiHidden", ["__cfg_ui_text"] = "UiText", ["__cfg_ui_nobg"] = "UiNoBg"
        };
        foreach (var pair in map) if (values.TryGetValue(pair.Key, out var value)) _config.Set(pair.Value, value);
    }

    private void SyncAll()
    {
        _owner?.SyncAll();
        if (_windowKind != "main") return;
        UpdateThemeSurfaceColor();
        _ = InjectStateAsync(false);
        if (_settingsForm is not null) _ = _settingsForm.InjectStateAsync(false);
        foreach (var child in _childWindows.Values.ToArray()) _ = child.InjectStateAsync(false);
    }

    private WebMainForm? _settingsForm;
    private WebMainForm MainHost => _owner ?? this;

    private void OpenSettings()
    {
        if (_isSettings) return;
        if (_settingsForm is { IsDisposed: false }) { _settingsForm.Show(); _settingsForm.Activate(); return; }
        _settingsForm = new WebMainForm(_config, true, this) { Owner = this };
        _settingsForm.FormClosed += (_, _) => _settingsForm = null;
        _settingsForm.ShowDeferred(this);
    }

    private void OpenNativeWindow(string kind)
    {
        var host = MainHost;
        if (host._childWindows.TryGetValue(kind, out var existing) && !existing.IsDisposed)
        {
            existing.Show();
            existing.Activate();
            return;
        }
        var child = new WebMainForm(host._config, kind, host) { Owner = host };
        host._childWindows[kind] = child;
        child.FormClosed += (_, _) => host._childWindows.Remove(kind);
        child.ShowDeferred(host);
    }

    private void CloseSettingsAndMain()
    {
        if (_isSettings) { Close(); return; }
        _settingsForm?.Close();
        foreach (var child in _childWindows.Values.ToArray()) child.Close();
        Close();
    }

    private async Task SetNativePopupTitleAsync()
    {
        if (_web.CoreWebView2 is not null)
            await _web.CoreWebView2.ExecuteScriptAsync($"document.title={JsonSerializer.Serialize(Text)};");
    }

    private async Task WaitForUiReadyAsync()
    {
        if (_web.CoreWebView2 is null) return;
        var required = _isSettings ? "initNativeSettingsPopup" : "initNativeWindow";
        for (var attempt = 0; attempt < 60; attempt++)
        {
            try
            {
                var probe = await _web.CoreWebView2.ExecuteScriptAsync($"document.readyState+'|'+(typeof {required}==='function')");
                if (probe.Contains("complete", StringComparison.OrdinalIgnoreCase) && probe.Contains("true", StringComparison.OrdinalIgnoreCase)) return;
            }
            catch { }
            await Task.Delay(50);
        }
    }

    private static Task<CoreWebView2Environment> GetWebViewEnvironmentAsync()
    {
        lock (WebViewEnvironmentSync)
        {
            _webViewEnvironmentTask ??= CoreWebView2Environment.CreateAsync(
                null,
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "RVL", "WebView2"));
            return _webViewEnvironmentTask;
        }
    }

    private void ResizeFromBridge(Dictionary<string, string> values)
    {
        if (!values.TryGetValue("__resize_req", out var request)) return;
        var match = Regex.Match(request, @"^(\d+)x(\d+)$");
        if (!match.Success) return;
        var width = Math.Clamp(int.Parse(match.Groups[1].Value), MinimumSize.Width, 1200);
        var height = Math.Clamp(int.Parse(match.Groups[2].Value), MinimumSize.Height, 1000);
        /* Fresh-install check BEFORE resizing: the Resize event persists the
           position as soon as the size changes, which would otherwise defeat
           the "no saved position yet" test. */
        var isFresh = _windowKind == "main" && _config.GetInt("WindowX", -1) < 0;
        ClientSize = new Size(width, height);
        /* A fresh install opens centered at its startup size; this
           content-driven resize would otherwise leave it hanging up-left of
           center. Re-center once and persist — afterwards user moves win. */
        if (isFresh)
        {
            var area = Screen.PrimaryScreen.WorkingArea;
            Location = new Point(area.Left + (area.Width - Width) / 2, area.Top + (area.Height - Height) / 2);
            SaveWindowPosition();
        }
    }

    private async Task LaunchFromBridgeAsync(Dictionary<string, string> values)
    {
        SaveBridge(values);
        var method = V(values, "__cfg_method", "1");
        var place = V(values, "inp-place", _config.Get("PlaceId"));
        var rawCode = method == "2" ? V(values, "inp-share-code", V(values, "inp-link", _config.Get("LinkCode"))) : V(values, "inp-link", _config.Get("LinkCode"));
        var code = RvlPreset.NormalizeShareCode(rawCode);
        var appUri = method == "2" ? $"roblox://navigation/share_links?code={Uri.EscapeDataString(code)}" : $"roblox://experiences/start?placeId={Uri.EscapeDataString(place)}&linkCode={Uri.EscapeDataString(rawCode)}";
        var webUri = method == "2" ? $"https://www.roblox.com/share?code={Uri.EscapeDataString(code)}" : $"https://www.roblox.com/games/{Uri.EscapeDataString(place)}/?linkCode={Uri.EscapeDataString(rawCode)}";
        var success = TryOpen(method == "2" || Registry.ClassesRoot.OpenSubKey("roblox") is not null ? appUri : webUri);
        if (!success) success = TryOpen(webUri);

        var name = "Quick launch";
        var id = V(values, "__last_loaded_preset_id");
        var presets = ParsePresets(_config.PresetsJson);
        var preset = presets.FirstOrDefault(p => p.Id == id);
        if (preset is not null) name = preset.Name;
        var historyPreset = new RvlPreset { Name = name, PlaceId = place, LinkCode = method == "2" ? code : rawCode, Method = method == "2" ? 2 : 1 };
        Storage.AppendHistory(historyPreset, success);
        _config.Set("LastPreset", id);
        _config.SaveIni();
        await SetValueAsync("__roblox_status", IsRobloxRunning() ? "1" : "0");
    }

    private static string V(Dictionary<string, string> values, string key, string fallback = "") => values.TryGetValue(key, out var value) && value.Length > 0 ? value : fallback;

    private static bool TryOpen(string uri)
    {
        try { Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true }); return true; }
        catch { return false; }
    }

    private void ApplyOpacity(Dictionary<string, string> values)
    {
        var host = MainHost;
        var alpha = Math.Clamp(int.TryParse(V(values, "__cfg_opacity", "255"), out var parsed) ? parsed : 255, 26, 255);
        host.Opacity = alpha / 255d;
        _config.Set("Opacity", alpha.ToString());
        _config.SaveIni();
    }

    private void ApplyAlwaysOnTop(Dictionary<string, string> values)
    {
        var host = MainHost;
        host.TopMost = V(values, "__cfg_always_on_top") == "1";
        _config.Set("AlwaysOnTop", host.TopMost ? "1" : "0");
        _config.SaveIni();
    }

    private void ApplyAutostart(Dictionary<string, string> values)
    {
        var enabled = V(values, "__cfg_autostart") == "1";
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey("Software\\Microsoft\\Windows\\CurrentVersion\\Run", true) ?? Registry.CurrentUser.CreateSubKey("Software\\Microsoft\\Windows\\CurrentVersion\\Run");
            if (enabled) key?.SetValue("RVL", $"\"{Application.ExecutablePath}\""); else key?.DeleteValue("RVL", false);
            _config.Set("Autostart", enabled ? "1" : "0"); _config.SaveIni();
        }
        catch { }
    }

    private void ApplyMainHotkey(Dictionary<string, string> values)
    {
        var host = MainHost;
        UnregisterHotKey(host.Handle, MainHotKeyId);
        var enabled = V(values, "__cfg_enabled", _config.Get("HotkeyEnabled")) == "1";
        var name = V(values, "inp-key", _config.Get("HotkeyKey", "F4"));
        _config.Set("HotkeyKey", name); _config.Set("HotkeyEnabled", enabled ? "1" : "0"); _config.SaveIni();
        if (enabled && TryKey(name, out var key)) RegisterHotKey(host.Handle, MainHotKeyId, 0, (uint)key);
    }

    private void ApplyShowHideHotkey(Dictionary<string, string> values)
    {
        var host = MainHost;
        UnregisterHotKey(host.Handle, ShowHideHotKeyId);
        var enabled = V(values, "__cfg_sh_en", _config.Get("ShowHideEnabled")) == "1";
        var name = V(values, "__cfg_sh_key", _config.Get("ShowHideKey"));
        _config.Set("ShowHideKey", name); _config.Set("ShowHideEnabled", enabled ? "1" : "0"); _config.SaveIni();
        if (enabled && TryKey(name, out var key)) RegisterHotKey(host.Handle, ShowHideHotKeyId, 0, (uint)key);
    }

    private void ApplyPresetHotkeys(Dictionary<string, string> values)
    {
        var host = MainHost;
        foreach (var id in host._registeredKeys.Values.Distinct()) UnregisterHotKey(host.Handle, id);
        host._registeredKeys.Clear(); host._presetHotkeys.Clear();
        var raw = V(values, "__preset_hk_map");
        var next = PresetHotKeyBase;
        foreach (var item in raw.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = item.Split('|');
            if (parts.Length < 5 || !TryKey(parts[0], out var key)) continue;
            if (parts[0].Equals(_config.Get("HotkeyKey"), StringComparison.OrdinalIgnoreCase)) continue;
            var id = next++;
            if (RegisterHotKey(host.Handle, id, 0, (uint)key)) { host._registeredKeys[parts[0]] = id; host._presetHotkeys[id] = parts[4]; }
        }
    }

    private static bool TryKey(string value, out Keys key)
    {
        key = Keys.None;
        if (string.IsNullOrWhiteSpace(value)) return false;
        value = value.Replace("Numpad", "NumPad", StringComparison.OrdinalIgnoreCase);
        if (value.Equals("NumpadEnter", StringComparison.OrdinalIgnoreCase)) value = "Enter";
        return Enum.TryParse(value, true, out key) && key != Keys.None && (key & Keys.KeyCode) != Keys.None;
    }

    private void BeginCapture(string kind)
    {
        _capturing = true; _captureKind = kind;
    }

    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (_capturing)
        {
            if (keyData == Keys.Escape) FinishCapture(null);
            else FinishCapture(keyData.ToString());
            return true;
        }
        return base.ProcessCmdKey(ref msg, keyData);
    }

    private void FinishCapture(string? key)
    {
        _capturing = false;
        var escaped = key is null ? "null" : JsonSerializer.Serialize(key);
        var fn = _captureKind switch { "show-hide" => "stopShowHideCaptureExternal", "preset" => "finishPresetHKCapture", _ => "stopCaptureExternal" };
        _ = ExecuteScriptAsync($"{fn}({escaped});");
        _captureKind = "";
    }

    private void CopyToClipboard(Dictionary<string, string> values)
    {
        var text = V(values, "__clipboard_data");
        if (text.Length > 0) Clipboard.SetText(text);
    }

    private async Task PushHistoryAsync()
    {
        var list = Storage.LoadHistory().Select(x => new { ts = new DateTimeOffset(x.Time).ToUnixTimeMilliseconds(), name = x.Name, placeId = x.Target, ok = x.Success }).ToList();
        await SetValueAsync("__history_data", JsonSerializer.Serialize(list));
    }

    private void ClearAvatars()
    {
        _config.ClearAvatars();
        var stamp = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString();
        var host = MainHost;
        _ = host.SetValueAsync("__avatars_cleared", stamp);
        if (host._settingsForm is not null) _ = host._settingsForm.SetValueAsync("__avatars_cleared", stamp);
    }

    private void BackupCreate(Dictionary<string, string> values)
    {
        using var dialog = new SaveFileDialog { Filter = "RVL backup (*.rvlbackup)|*.rvlbackup", FileName = "rvl_backup.rvlbackup", InitialDirectory = Storage.DataDirectory };
        if (dialog.ShowDialog(this) == DialogResult.OK) _config.CreateBackup(dialog.FileName, V(values, "__presets_out", _config.PresetsJson), V(values, "__theme_presets_out", _config.ThemePresetsJson), V(values, "__preset_groups_out", _config.GroupsJson));
    }

    private void BackupRestore()
    {
        using var dialog = new OpenFileDialog { Filter = "RVL backup (*.rvlbackup)|*.rvlbackup|Все файлы (*.*)|*.*" };
        if (dialog.ShowDialog(this) == DialogResult.OK) { _config.RestoreBackup(dialog.FileName); ReloadState(); }
    }

    private void ReloadState()
    {
        var host = MainHost;
        host._config.ReloadFromDisk();
        host.SyncAll();
    }

    private void ExportStats(Dictionary<string, string> values)
    {
        var request = V(values, "__dash_export_req");
        if (!request.Contains(':')) return;
        var separator = request.IndexOf(':');
        var format = request[..separator];
        var encoded = request[(separator + 1)..];
        var data = Uri.UnescapeDataString(encoded);
        using var dialog = new SaveFileDialog { Filter = format == "csv" ? "CSV (*.csv)|*.csv" : "JSON (*.json)|*.json", FileName = format == "csv" ? "rvl_stats.csv" : "rvl_stats.json", InitialDirectory = Storage.DataDirectory };
        if (dialog.ShowDialog(this) == DialogResult.OK) File.WriteAllText(dialog.FileName, data, new UTF8Encoding(false));
    }

    private void ExportText(Dictionary<string, string> values, string valueKey, string filter, string fileName)
    {
        var text = V(values, valueKey);
        if (text.Length == 0) return;
        using var dialog = new SaveFileDialog { Filter = filter, FileName = fileName, InitialDirectory = Storage.DataDirectory };
        if (dialog.ShowDialog(this) == DialogResult.OK) File.WriteAllText(dialog.FileName, text, new UTF8Encoding(false));
    }

    private async Task ImportPresetsAsync()
    {
        using var dialog = new OpenFileDialog { Filter = "JSON пресеты (*.json)|*.json|Все файлы (*.*)|*.*" };
        if (dialog.ShowDialog(this) != DialogResult.OK) return;
        var data = await File.ReadAllTextAsync(dialog.FileName);
        await SetValueAsync("__import_data", data);
        await ExecuteScriptAsync("importPresetsFromAHK();");
    }

    private async Task ImportThemePresetsAsync()
    {
        using var dialog = new OpenFileDialog { Filter = "Цветовые пресеты (*.json)|*.json|Все файлы (*.*)|*.*" };
        if (dialog.ShowDialog(this) != DialogResult.OK) return;
        var data = await File.ReadAllTextAsync(dialog.FileName);
        await SetValueAsync("__import_theme_data", data);
        await ExecuteScriptAsync("importThemePresetsFromAHK();");
    }

    private void FactoryReset()
    {
        foreach (var name in new[] { "config.ini", "presets.json", "theme_presets.json", "preset_groups.json", "history.log" })
        {
            try { File.Delete(Path.Combine(Storage.DataDirectory, name)); } catch { }
        }
        _config.ClearAvatars(); ApplyAutostart(new Dictionary<string, string> { ["__cfg_autostart"] = "0" }); ReloadState();
    }

    private void SaveWindowPosition()
    {
        _config.Set("WindowX", Left.ToString()); _config.Set("WindowY", Top.ToString()); _config.SaveIni();
    }

    /* Runs in the constructor, before the window exists: restore the saved
       position, or keep CenterScreen when there is none yet. A position saved
       for a monitor that is no longer connected is dropped — the window then
       opens centered instead of off-screen. */
    private void ApplySavedStartupPosition()
    {
        var x = _config.GetInt("WindowX", -1);
        var y = _config.GetInt("WindowY", -1);
        if (x < 0 && y < 0) return;
        StartPosition = FormStartPosition.Manual;
        Location = new Point(x, y);
        if (!SystemInformation.VirtualScreen.IntersectsWith(new Rectangle(Location, Size)))
        {
            StartPosition = FormStartPosition.CenterScreen;
        }
    }

    private void DragWindow()
    {
        ReleaseCapture(); SendMessage(Handle, WmNclButtonDown, (nint)2, 0);
    }

    private void CreateTray()
    {
        _tray = new NotifyIcon { Visible = true, Text = "RVL", Icon = LoadIcon() };
        _tray.DoubleClick += (_, _) => ShowWindow();
        RebuildTrayMenu();
    }

    private Icon LoadIcon()
    {
        var baseDir = Path.GetDirectoryName(Application.ExecutablePath) ?? AppContext.BaseDirectory;
        var candidates = new[]
        {
            Path.Combine(baseDir, "images", "rvl.ico"),
            Path.Combine(baseDir, "..", "..", "..", "..", "images", "rvl.ico")
        };
        var iconPath = candidates.FirstOrDefault(File.Exists);
        if (iconPath is not null) return new Icon(iconPath);
        return SystemIcons.Application;
    }

    private void RebuildTrayMenu()
    {
        if (_tray is null) return;
        var menu = new ContextMenuStrip();
        menu.Items.Add("Показать RVL", null, (_, _) => ShowWindow());
        menu.Items.Add("Запустить избранное", null, (_, _) => LaunchFavorite());
        var presets = ParsePresets(_config.PresetsJson).Where(p => p.Favorite).ToList();
        if (presets.Count > 0)
        {
            menu.Items.Add(new ToolStripSeparator());
            foreach (var preset in presets.Take(10)) menu.Items.Add(preset.Name, null, (_, _) => LaunchPreset(preset));
        }
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Выход", null, (_, _) => Close());
        _tray.ContextMenuStrip = menu;
    }

    private void ShowWindow()
    {
        Show();
        WindowState = FormWindowState.Normal;
        Activate();
        /* A fullscreen game can bury the restored window below itself; a
           momentary top-most bump forces it above the foreground so a single
           hotkey press is always visible. */
        var wasTopMost = TopMost;
        TopMost = true;
        TopMost = wasTopMost;
    }
    private void LaunchFavorite()
    {
        var preset = ParsePresets(_config.PresetsJson).FirstOrDefault(p => p.Favorite) ?? new RvlPreset { PlaceId = _config.Get("PlaceId"), LinkCode = _config.Get("LinkCode"), Method = int.TryParse(_config.Get("Method"), out var m) ? m : 1 };
        LaunchPreset(preset);
    }

    private async void LaunchPreset(RvlPreset preset)
    {
        var values = new Dictionary<string, string> { ["__cfg_method"] = preset.Method.ToString(), ["inp-place"] = preset.PlaceId, ["inp-link"] = preset.LinkCode, ["inp-share-code"] = preset.LinkCode, ["__last_loaded_preset_id"] = preset.Id };
        await LaunchFromBridgeAsync(values);
    }

    private static List<RvlPreset> ParsePresets(string json)
    {
        try { return JsonSerializer.Deserialize<List<RvlPreset>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? []; } catch { return []; }
    }

    private async Task FetchThumbnailAsync(string key)
    {
        if (_config.Get("AvatarsEnabled", "1") == "0" || string.IsNullOrWhiteSpace(key)) return;
        if (!_thumbnailRequests.TryAdd(key, 0)) return;
        try
        {
            Directory.CreateDirectory(Path.GetFullPath(_config.AvatarDirectory));
            var safe = Regex.Replace(key, @"\W", "");
            var path = Path.Combine(Path.GetFullPath(_config.AvatarDirectory), "RVL_icon_" + safe + ".png");
            if (!File.Exists(path))
            {
                /* The page keys share presets as "sc:<code>" — the prefix must
                   never leak into the share URL. */
                var code = key.StartsWith("sc:", StringComparison.OrdinalIgnoreCase) ? key[3..] : key;
                var placeId = code.All(char.IsDigit) ? code : await ResolvePlaceFromShareAsync(RvlPreset.NormalizeShareCode(code));
                if (string.IsNullOrWhiteSpace(placeId)) { await PushThumbnailAsync(key, ""); return; }
                using var universeResponse = await Http.GetAsync("https://apis.roblox.com/universes/v1/places/" + placeId + "/universe");
                universeResponse.EnsureSuccessStatusCode();
                using var universe = JsonDocument.Parse(await universeResponse.Content.ReadAsStringAsync());
                if (!universe.RootElement.TryGetProperty("universeId", out var universeIdElement) || !universeIdElement.TryGetInt64(out var universeId))
                {
                    await PushThumbnailAsync(key, "");
                    return;
                }
                using var imageResponse = await Http.GetAsync($"https://thumbnails.roblox.com/v1/games/icons?universeIds={universeId}&size=150x150&format=Png");
                imageResponse.EnsureSuccessStatusCode();
                using var imageJson = JsonDocument.Parse(await imageResponse.Content.ReadAsStringAsync());
                var imageUrl = "";
                if (imageJson.RootElement.TryGetProperty("data", out var imageData) && imageData.ValueKind == JsonValueKind.Array && imageData.GetArrayLength() > 0)
                {
                    var first = imageData[0];
                    if (first.TryGetProperty("imageUrl", out var imageUrlElement)) imageUrl = imageUrlElement.GetString() ?? "";
                }
                if (string.IsNullOrWhiteSpace(imageUrl)) { await PushThumbnailAsync(key, ""); return; }
                await File.WriteAllBytesAsync(path, await Http.GetByteArrayAsync(imageUrl));
            }
            /* The page normalizes a local Windows path to file:/// exactly once. */
            await PushThumbnailAsync(key, path);
        }
        catch { await PushThumbnailAsync(key, ""); }
        finally { _thumbnailRequests.TryRemove(key, out _); }
    }

    private static async Task<string> ResolvePlaceFromShareAsync(string code)
    {
        /* The share endpoint answers with a redirect to the canonical game
           page, so the place id is in the final request URL — no markup
           parsing required. Markup fallbacks cover a plain 200 response. */
        using var response = await Http.GetAsync("https://www.roblox.com/share?code=" + Uri.EscapeDataString(code) + "&type=Server");
        response.EnsureSuccessStatusCode();
        var finalUri = response.RequestMessage?.RequestUri?.ToString() ?? "";
        var urlMatch = Regex.Match(finalUri, @"/games/(\d+)", RegexOptions.IgnoreCase);
        if (urlMatch.Success) return urlMatch.Groups[1].Value;
        var html = await response.Content.ReadAsStringAsync();
        foreach (var pattern in new[] { @"place_id""\s+content=""(\d+)""", @"property=""og:url""\s+content=""[^""]*?/games/(\d+)", @"href=""[^""]*?/games/(\d+)", @"""placeId""\s*:\s*""?(\d+)" })
        {
            var match = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
            if (match.Success) return match.Groups[1].Value;
        }
        return "";
    }

    private async Task PushThumbnailAsync(string key, string path)
    {
        await _thumbnailPushLock.WaitAsync();
        try
        {
            var current = await ReadValueAsync("__thumb_resp");
            await SetValueAsync("__thumb_resp", current + key + "|" + path + "\n");
            if (_settingsForm is not null) await _settingsForm.SetValueAsync("__thumb_resp", (await _settingsForm.ReadValueAsync("__thumb_resp")) + key + "|" + path + "\n");
        }
        finally { _thumbnailPushLock.Release(); }
    }

    private async Task UpdateRobloxStatusAsync()
    {
        if (!_ready) return;
        var value = IsRobloxRunning() ? "1" : "0";
        await SetValueAsync("__roblox_status", value);
        await ExecuteScriptAsync("updateRobloxStatus();");
    }

    private static bool IsRobloxRunning() => Process.GetProcessesByName("RobloxPlayerBeta").Length > 0;

    private async Task CheckUpdateAsync()
    {
        var host = MainHost;
        try
        {
            /* A version check only reads release metadata. The download
               state is reserved for an explicit installation click. */
            SetStatus("checking", "Проверяем обновления…", 0);
            var versions = new List<(string version, string url, bool native)>();
            using var release = JsonDocument.Parse(await Http.GetStringAsync("https://api.github.com/repos/mozrg/RVL/releases/latest"));
            AddRelease(release.RootElement, versions);
            using var tags = JsonDocument.Parse(await Http.GetStringAsync("https://api.github.com/repos/mozrg/RVL/tags"));
            foreach (var tag in tags.RootElement.EnumerateArray())
            {
                var name = tag.GetProperty("name").GetString() ?? "";
                if (Regex.IsMatch(name, "^v?[0-9]+(\\.[0-9]+)*$") && tag.TryGetProperty("zipball_url", out var url)) versions.Add((name, url.GetString() ?? "", false));
            }
            var latest = versions.OrderByDescending(x => VersionNumber(x.version)).FirstOrDefault();
            if (string.IsNullOrWhiteSpace(latest.version)) throw new InvalidOperationException("GitHub не вернул версию");
            if (VersionNumber(latest.version) <= VersionNumber("2.0")) SetStatus("latest", "Установлена последняя версия", 100);
            else { host._updateUrl = latest.url; host._updateIsNativePackage = latest.native; host._updateVersion = latest.version; SetStatus("available", "Доступно обновление", 0); }
        }
        catch (Exception ex) { SetStatus("error", "Не удалось проверить обновления: " + ex.Message, 0); }
    }

    private static void AddRelease(JsonElement root, List<(string version, string url, bool native)> versions)
    {
        if (!root.TryGetProperty("tag_name", out var tag) || !root.TryGetProperty("zipball_url", out var url)) return;
        var packageUrl = url.GetString() ?? "";
        var native = false;
        if (root.TryGetProperty("assets", out var assets))
        {
            foreach (var asset in assets.EnumerateArray())
            {
                var name = asset.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                if (name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) && (name.Contains("native", StringComparison.OrdinalIgnoreCase) || name.Contains("win", StringComparison.OrdinalIgnoreCase)))
                {
                    packageUrl = asset.GetProperty("browser_download_url").GetString() ?? packageUrl;
                    native = true;
                    break;
                }
            }
        }
        versions.Add((tag.GetString() ?? "", packageUrl, native));
    }

    private static long VersionNumber(string value)
    {
        var numbers = Regex.Matches(value, "\\d+").Select(m => long.Parse(m.Value)).Take(4).ToArray();
        long result = 0; foreach (var n in numbers) result = result * 1000 + n; return result;
    }

    private async Task InstallUpdateAsync()
    {
        var host = MainHost;
        if (string.IsNullOrWhiteSpace(host._updateUrl)) { await host.CheckUpdateAsync(); return; }
        if (!host._updateIsNativePackage)
        {
            SetStatus("error", "Релиз не содержит native-пакет RVL для автоматической установки.", 0);
            return;
        }
        SetStatus("downloading", "Скачиваем обновление…", 0);
        try
        {
            var temp = Path.Combine(Path.GetTempPath(), "RVL-update-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(temp);
            var zip = Path.Combine(temp, "update.zip");
            await File.WriteAllBytesAsync(zip, await Http.GetByteArrayAsync(host._updateUrl));
            var extract = Path.Combine(temp, "extract");
            ZipFile.ExtractToDirectory(zip, extract);
            var helper = Path.Combine(temp, "install.ps1");
            await File.WriteAllTextAsync(helper, NativeUpdateScript, new UTF8Encoding(false));
            var psi = new ProcessStartInfo("powershell.exe") { UseShellExecute = true, WindowStyle = ProcessWindowStyle.Hidden };
            psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File " + QuoteArg(helper) + " -Source " + QuoteArg(extract) + " -Target " + QuoteArg(AppContext.BaseDirectory) + " -WaitPid " + Environment.ProcessId + " -Restart " + QuoteArg(Application.ExecutablePath);
            Process.Start(psi);
            SetStatus("installing", "Файлы готовы. Перезапускаем RVL…", 100);
            await Task.Delay(500);
            host._settingsForm?.Close(); host.Close();
        }
        catch (Exception ex) { SetStatus("error", ex.Message, 0); }
    }

    private const string NativeUpdateScript = "param([string]$Source,[string]$Target,[int]$WaitPid,[string]$Restart)\n$ErrorActionPreference='Stop'\nwhile(Get-Process -Id $WaitPid -ErrorAction SilentlyContinue){Start-Sleep -Milliseconds 120}\n$root=$Source\nif(-not(Test-Path (Join-Path $root 'RVL.exe'))){$candidate=Get-ChildItem -LiteralPath $root -Recurse -Filter RVL.exe -File | Select-Object -First 1;if($candidate){$root=$candidate.DirectoryName}}\nif(-not(Test-Path (Join-Path $root 'RVL.exe'))){throw 'Native RVL.exe not found in update archive'}\nGet-ChildItem -LiteralPath $root -Force | Where-Object {$_.Name -notin @('data','.git')} | ForEach-Object {Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Target $_.Name) -Recurse -Force}\nStart-Process -FilePath $Restart\nRemove-Item -LiteralPath (Split-Path $Source -Parent) -Recurse -Force -ErrorAction SilentlyContinue\n";

    private void SetStatus(string state, string message, int progress = 0)
    {
        var host = MainHost;
        host._updateState = state; host._updateMessage = message; host._updateProgress = progress;
        _ = host.SetValueAsync("__update_state", state); _ = host.SetValueAsync("__update_message", message); _ = host.SetValueAsync("__update_version", host._updateVersion); _ = host.SetValueAsync("__update_progress", progress.ToString()); _ = host.ExecuteScriptAsync("refreshUpdateBridge();");
        if (host._settingsForm is not null)
        {
            _ = host._settingsForm.SetValueAsync("__update_state", state);
            _ = host._settingsForm.SetValueAsync("__update_message", message);
            _ = host._settingsForm.SetValueAsync("__update_version", host._updateVersion);
            _ = host._settingsForm.SetValueAsync("__update_progress", progress.ToString());
            _ = host._settingsForm.ExecuteScriptAsync("refreshUpdateBridge();");
        }
    }

    private async Task SetValueAsync(string id, string value)
    {
        await ExecuteScriptAsync($"(function(){{var e=document.getElementById({JsonSerializer.Serialize(id)});if(e)e.value={JsonSerializer.Serialize(value)};}})();");
    }

    private async Task<string> ReadValueAsync(string id)
    {
        if (_web.CoreWebView2 is null) return "";
        var raw = await _web.CoreWebView2.ExecuteScriptAsync($"(function(){{var e=document.getElementById({JsonSerializer.Serialize(id)});return e?String(e.value||''):'';}})();");
        return JsonSerializer.Deserialize<string>(raw) ?? "";
    }

    private async Task ExecuteScriptAsync(string script)
    {
        if (_web.CoreWebView2 is not null) await _web.CoreWebView2.ExecuteScriptAsync(script);
    }

    private async Task<string> ReadValueJs(string script)
    {
        if (_web.CoreWebView2 is null) return "";
        var result = await _web.CoreWebView2.ExecuteScriptAsync(script);
        return JsonSerializer.Deserialize<string>(result) ?? "";
    }

    private void SyncAllFromOwner()
    {
        _ = InjectStateAsync(false);
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (_windowKind != "main") return;
        SaveWindowPosition();
        foreach (var id in _registeredKeys.Values.Distinct()) UnregisterHotKey(Handle, id);
        UnregisterHotKey(Handle, MainHotKeyId); UnregisterHotKey(Handle, ShowHideHotKeyId);
        _statusTimer?.Stop(); _tray?.Dispose();
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WmHotKey)
        {
            var id = m.WParam.ToInt32();
            if (id == MainHotKeyId) LaunchFavorite();
            else if (id == ShowHideHotKeyId)
            {
                /* Hide only when the window is actually the active one. If it
                   sits buried behind a fullscreen game (or is minimized), the
                   first press must bring it to the front — the old
                   "Visible" check hid it instead, which made the hotkey feel
                   like it needed two presses. */
                if (Visible && WindowState != FormWindowState.Minimized && GetForegroundWindow() == Handle) Hide();
                else ShowWindow();
            }
            else if (_presetHotkeys.TryGetValue(id, out var presetId))
            {
                var preset = ParsePresets(_config.PresetsJson).FirstOrDefault(p => p.Id == presetId);
                if (preset is not null) { LaunchPreset(preset); _ = SetValueAsync("__hotkey_launch_ping", preset.Id + "|" + DateTimeOffset.Now.ToUnixTimeMilliseconds()); }
            }
        }
        if (m.Msg == WmNchittest && FormBorderStyle == FormBorderStyle.None)
        {
            var point = PointToClient(Cursor.Position);
            var titleHeight = _isSettings ? 48 : 38;
            if (point.Y >= 0 && point.Y <= titleHeight && point.X < ClientSize.Width - 86)
            {
                m.Result = (nint)HtCaption;
                return;
            }
            m.Result = (nint)HtClient;
        }
        base.WndProc(ref m);
    }

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        ApplyDwmWindowAttributes();
    }

    /* Windows 11 rounds the window itself with proper anti-aliasing and can
       drop the 1px system border. The DWM drop shadow is disabled on every
       version: its dark halo hugging the square corners read as permanent
       "dirty corner pixels" against light wallpapers. On Windows 10 (build
       < 22000) the corner-preference attributes are unavailable — a GDI
       region must NOT be used as a fallback there: its hard 1px staircase
       was the other half of the corner-pixel reports. A square borderless
       window is the native Windows 10 look and has zero artifacts. */
    private void ApplyDwmWindowAttributes()
    {
        if (!IsHandleCreated) return;
        try
        {
            var policy = DwmncrpDisabled;
            DwmSetWindowAttribute(Handle, DwmwaNcRenderingPolicy, ref policy, 4);
            var round = DwmcpRound;
            if (DwmSetWindowAttribute(Handle, DwmwaWindowCornerPreference, ref round, 4) == 0)
            {
                var noColor = DwmColorNone;
                DwmSetWindowAttribute(Handle, DwmwaBorderColor, ref noColor, 4);
            }
        }
        catch { }
    }

    private static HttpClient CreateHttpClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(20) };
        client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("RVL", "2.0"));
        return client;
    }

    private static string Escape(string value) => JsonSerializer.Serialize(value);

    private static string QuoteArg(string value) => "\"" + value.Replace("\"", "\\\"") + "\"";
}

