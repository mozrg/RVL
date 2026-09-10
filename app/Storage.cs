using System.Text;
using System.Text.Json;

namespace RVL;

public static class Storage
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public static string DataDirectory { get; } = LocateDataDirectory();
    public static string PresetsPath => Path.Combine(DataDirectory, "presets.json");
    public static string ConfigPath => Path.Combine(DataDirectory, "config.ini");
    public static string HistoryPath => Path.Combine(DataDirectory, "history.log");

    public static List<RvlPreset> LoadPresets()
    {
        try
        {
            if (!File.Exists(PresetsPath)) return [];
            var list = JsonSerializer.Deserialize<List<RvlPreset>>(File.ReadAllText(PresetsPath, Encoding.UTF8), JsonOptions) ?? [];
            var index = 0;
            foreach (var preset in list)
            {
                if (string.IsNullOrWhiteSpace(preset.Id)) preset.Id = Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(preset.Name)) preset.Name = "Без названия";
                preset.DisplayIndex = index++;
            }
            return list;
        }
        catch
        {
            return [];
        }
    }

    public static void SavePresets(IEnumerable<RvlPreset> presets)
    {
        EnsureDirectory();
        File.WriteAllText(PresetsPath, JsonSerializer.Serialize(presets, JsonOptions), new UTF8Encoding(false));
    }

    public static RvlSettings LoadSettings()
    {
        var values = ReadIni();
        return new RvlSettings
        {
            PlaceId = Get(values, "PlaceId"),
            LinkCode = Get(values, "LinkCode"),
            ThemeMode = string.Equals(Get(values, "ThemeMode", "dark"), "light", StringComparison.OrdinalIgnoreCase) ? "light" : "dark",
            AutoMinimize = GetBool(values, "AutoMinimize"),
            AlwaysOnTop = GetBool(values, "AlwaysOnTop"),
            Autostart = GetBool(values, "Autostart"),
            HotkeyEnabled = GetBool(values, "HotkeyEnabled"),
            LaunchDelay = Math.Clamp(GetInt(values, "LaunchDelay"), 0, 30),
            LastPreset = Get(values, "LastPreset")
        };
    }

    public static void SaveSettings(RvlSettings settings)
    {
        EnsureDirectory();
        var text = new StringBuilder()
            .AppendLine("[Settings]")
            .AppendLine($"PlaceId={settings.PlaceId}")
            .AppendLine($"LinkCode={settings.LinkCode}")
            .AppendLine($"ThemeMode={settings.ThemeMode}")
            .AppendLine($"AutoMinimize={(settings.AutoMinimize ? 1 : 0)}")
            .AppendLine($"AlwaysOnTop={(settings.AlwaysOnTop ? 1 : 0)}")
            .AppendLine($"Autostart={(settings.Autostart ? 1 : 0)}")
            .AppendLine($"HotkeyEnabled={(settings.HotkeyEnabled ? 1 : 0)}")
            .AppendLine($"LaunchDelay={Math.Clamp(settings.LaunchDelay, 0, 30)}")
            .AppendLine($"LastPreset={settings.LastPreset}");
        File.WriteAllText(ConfigPath, text.ToString(), new UTF8Encoding(false));
    }

    public static List<HistoryEntry> LoadHistory()
    {
        if (!File.Exists(HistoryPath)) return [];
        var result = new List<HistoryEntry>();
        foreach (var line in File.ReadLines(HistoryPath, Encoding.UTF8).Reverse())
        {
            var parts = line.Split('|');
            if (parts.Length < 4 || !DateTime.TryParse(parts[0].Trim('[', ']'), out var time)) continue;
            result.Add(new HistoryEntry(time, parts[1], parts[2], parts[3] == "1"));
        }
        return result;
    }

    public static void AppendHistory(RvlPreset preset, bool success)
    {
        EnsureDirectory();
        var target = preset.Method == 2 ? "SC:" + RvlPreset.NormalizeShareCode(preset.LinkCode) : preset.PlaceId;
        var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}]|{preset.Name}|{target}|{(success ? 1 : 0)}{Environment.NewLine}";
        File.AppendAllText(HistoryPath, line, new UTF8Encoding(false));
    }

    private static Dictionary<string, string> ReadIni()
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (!File.Exists(ConfigPath)) return values;
        foreach (var line in File.ReadLines(ConfigPath, Encoding.UTF8))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith(';') || trimmed.StartsWith('[')) continue;
            var split = trimmed.IndexOf('=');
            if (split > 0) values[trimmed[..split].Trim()] = trimmed[(split + 1)..].Trim();
        }
        return values;
    }

    private static string Get(Dictionary<string, string> values, string key, string fallback = "") => values.TryGetValue(key, out var value) ? value : fallback;
    private static int GetInt(Dictionary<string, string> values, string key) => int.TryParse(Get(values, key), out var value) ? value : 0;
    private static bool GetBool(Dictionary<string, string> values, string key) => Get(values, key) is "1" or "true" or "True";

    private static void EnsureDirectory() => Directory.CreateDirectory(DataDirectory);

    private static string LocateDataDirectory()
    {
        var candidates = new List<string>
        {
            Path.Combine(AppContext.BaseDirectory, "data"),
            Path.Combine(Environment.CurrentDirectory, "data")
        };
        var parent = new DirectoryInfo(AppContext.BaseDirectory);
        for (var depth = 0; depth < 6 && parent is not null; depth++, parent = parent.Parent)
            candidates.Add(Path.Combine(parent.FullName, "data"));
        foreach (var candidate in candidates)
        {
            if (File.Exists(Path.Combine(candidate, "presets.json")) || File.Exists(Path.Combine(candidate, "config.ini")))
                return candidate;
        }
        var roaming = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "RVL", "data");
        Directory.CreateDirectory(roaming);
        return roaming;
    }
}
