using System.Text;
using System.Text.Json;

namespace RVL;

internal sealed class NativeConfig
{
    private readonly Dictionary<string, string> _values = new(StringComparer.OrdinalIgnoreCase);

    public string UiDirectory { get; } = LocateUiDirectory();
    public string AvatarDirectory => Path.Combine(Storage.DataDirectory, "..", "images", "av");

    public NativeConfig()
    {
        LoadIni();
        SetDefault("PlaceId", "133410800847665");
        SetDefault("LinkCode", "63587187475624144843883901936517");
        SetDefault("HotkeyKey", "F4");
        SetDefault("HotkeyEnabled", "1");
        SetDefault("ThemeMode", "dark");
        SetDefault("ThemeBg", "#0A0A0A");
        SetDefault("ThemeSurface", "#111111");
        SetDefault("ThemeText", "#E8E8E8");
        SetDefault("ThemeAccent", "#FFFFFF");
        SetDefault("AutoMinimize", "0");
        SetDefault("Scale", "1.0");
        SetDefault("ThemeGradEn", "0");
        SetDefault("ThemeGradBg2", "#0A0A0A");
        SetDefault("ThemeGradAngle", "135");
        SetDefault("ThemeGradOp", "100");
        SetDefault("LaunchDelay", "0");
        SetDefault("TooltipsEnabled", "1");
        SetDefault("Lang", "ru");
        SetDefault("LastPreset", "");
        SetDefault("Opacity", "255");
        SetDefault("ShowHideKey", "");
        SetDefault("ShowHideEnabled", "0");
        SetDefault("MaskInputs", "1");
        SetDefault("AlwaysOnTop", "0");
        SetDefault("Autostart", "0");
        SetDefault("AvatarsEnabled", "1");
        SetDefault("CompactMode", "0");
        SetDefault("SortMode", "manual");
        SetDefault("UiHidden", "");
        SetDefault("UiText", "");
        SetDefault("UiNoBg", "");
    }

    public string Get(string key, string fallback = "") => _values.TryGetValue(key, out var value) ? value : fallback;
    public bool GetBool(string key, bool fallback = false) => Get(key, fallback ? "1" : "0") is "1" or "true" or "True";
    public int GetInt(string key, int fallback = 0) => int.TryParse(Get(key), out var value) ? value : fallback;
    public void Set(string key, string? value) => _values[key] = value ?? "";

    public void ReloadFromDisk()
    {
        var fresh = new NativeConfig();
        _values.Clear();
        foreach (var pair in fresh._values) _values[pair.Key] = pair.Value;
    }

    public string PresetsJson => ReadJson("presets.json");
    public string ThemePresetsJson => ReadJson("theme_presets.json");
    public string GroupsJson => ReadJson("preset_groups.json");

    public void SaveJsonState(string presets, string themes, string groups)
    {
        WriteJson("presets.json", string.IsNullOrWhiteSpace(presets) ? "[]" : presets);
        WriteJson("theme_presets.json", string.IsNullOrWhiteSpace(themes) ? "[]" : themes);
        WriteJson("preset_groups.json", string.IsNullOrWhiteSpace(groups) ? "[]" : groups);
    }

    public void SaveIni()
    {
        Directory.CreateDirectory(Storage.DataDirectory);
        var builder = new StringBuilder().AppendLine("[Settings]");
        foreach (var pair in _values) builder.Append(pair.Key).Append('=').AppendLine(pair.Value);
        File.WriteAllText(Storage.ConfigPath, builder.ToString(), Encoding.Unicode);
    }

    public string HistoryPath => Storage.HistoryPath;

    public void ClearHistory()
    {
        if (File.Exists(HistoryPath)) File.Delete(HistoryPath);
    }

    public void ClearAvatars()
    {
        var dir = Path.GetFullPath(AvatarDirectory);
        if (!Directory.Exists(dir)) return;
        foreach (var file in Directory.EnumerateFiles(dir, "*.png").Concat(Directory.EnumerateFiles(dir, "*.done")))
        {
            try { File.Delete(file); } catch { }
        }
    }

    public void CreateBackup(string path, string presets, string themes, string groups)
    {
        SaveIni();
        var backup = new
        {
            version = "2.0",
            timestamp = DateTime.Now.ToString("yyyyMMddHHmmss"),
            config = File.Exists(Storage.ConfigPath) ? File.ReadAllText(Storage.ConfigPath, Encoding.UTF8) : "",
            presets,
            themePresets = themes,
            presetGroups = groups
        };
        File.WriteAllText(path, JsonSerializer.Serialize(backup), new UTF8Encoding(false));
    }

    public void RestoreBackup(string path)
    {
        using var document = JsonDocument.Parse(File.ReadAllText(path, Encoding.UTF8));
        var root = document.RootElement;
        if (root.TryGetProperty("config", out var config)) File.WriteAllText(Storage.ConfigPath, config.GetString() ?? "", new UTF8Encoding(false));
        var presets = root.TryGetProperty("presets", out var p) ? p.GetString() ?? "[]" : "[]";
        var themes = root.TryGetProperty("themePresets", out var t) ? t.GetString() ?? "[]" : "[]";
        var groups = root.TryGetProperty("presetGroups", out var g) ? g.GetString() ?? "[]" : "[]";
        SaveJsonState(presets, themes, groups);
    }

    private void LoadIni()
    {
        if (!File.Exists(Storage.ConfigPath)) return;
        var bytes = File.ReadAllBytes(Storage.ConfigPath);
        var encoding = bytes.Length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xFE
            ? Encoding.Unicode
            : bytes.Length >= 2 && bytes[0] == 0xFE && bytes[1] == 0xFF
                ? Encoding.BigEndianUnicode
                : new UTF8Encoding(false);
        foreach (var line in encoding.GetString(bytes).Split(["\r\n", "\n"], StringSplitOptions.None))
        {
            var value = line.Trim();
            if (value.Length == 0 || value.StartsWith(';') || value.StartsWith('[')) continue;
            var split = value.IndexOf('=');
            if (split > 0) _values[value[..split].Trim()] = value[(split + 1)..].Trim();
        }
    }

    private void SetDefault(string key, string value)
    {
        if (!_values.ContainsKey(key)) _values[key] = value;
    }

    private string ReadJson(string name)
    {
        var path = Path.Combine(Storage.DataDirectory, name);
        if (!File.Exists(path)) return "[]";
        try { return File.ReadAllText(path, Encoding.UTF8).Trim() is { Length: > 0 } raw ? raw : "[]"; }
        catch { return "[]"; }
    }

    private void WriteJson(string name, string value)
    {
        Directory.CreateDirectory(Storage.DataDirectory);
        File.WriteAllText(Path.Combine(Storage.DataDirectory, name), value, new UTF8Encoding(false));
    }

    private static string LocateUiDirectory()
    {
        var candidates = new List<string> { Path.Combine(Environment.CurrentDirectory, "ui") };
        var parent = new DirectoryInfo(AppContext.BaseDirectory);
        for (var depth = 0; depth < 8 && parent is not null; depth++, parent = parent.Parent)
            candidates.Add(Path.Combine(parent.FullName, "ui"));
        return candidates.FirstOrDefault(path => File.Exists(Path.Combine(path, "index.html"))) ?? AppContext.BaseDirectory;
    }
}
