using System.Text.Json.Serialization;

namespace RVL;

public sealed class RvlPreset
{
    [JsonPropertyName("id")] public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();
    [JsonPropertyName("name")] public string Name { get; set; } = "Новый пресет";
    [JsonPropertyName("placeId")] public string PlaceId { get; set; } = "";
    [JsonPropertyName("linkCode")] public string LinkCode { get; set; } = "";
    [JsonPropertyName("method")] public int Method { get; set; } = 1;
    [JsonPropertyName("launches")] public int Launches { get; set; }
    [JsonPropertyName("lastLaunch")] public long LastLaunch { get; set; }
    [JsonPropertyName("favorite")] public bool Favorite { get; set; }
    [JsonPropertyName("hotkey")] public string Hotkey { get; set; } = "";
    [JsonPropertyName("_dispIdx")] public int DisplayIndex { get; set; }

    [JsonIgnore]
    public string TypeLabel => Method == 2 ? "Share-код" : "Place ID + Link Code";

    [JsonIgnore]
    public string CodePreview => Method == 2
        ? NormalizeShareCode(LinkCode)
        : $"{PlaceId} · {LinkCode}";

    public static string NormalizeShareCode(string value)
    {
        var code = (value ?? "").Trim();
        var marker = code.IndexOf("code=", StringComparison.OrdinalIgnoreCase);
        if (marker >= 0) code = code[(marker + 5)..];
        var cut = code.IndexOf('&');
        if (cut >= 0) code = code[..cut];
        return code.Trim().TrimEnd('/');
    }
}

public sealed class RvlSettings
{
    public string PlaceId { get; set; } = "";
    public string LinkCode { get; set; } = "";
    public string ThemeMode { get; set; } = "dark";
    public bool AutoMinimize { get; set; }
    public bool AlwaysOnTop { get; set; }
    public bool Autostart { get; set; }
    public bool HotkeyEnabled { get; set; }
    public int LaunchDelay { get; set; }
    public string LastPreset { get; set; } = "";
}

public sealed record HistoryEntry(DateTime Time, string Name, string Target, bool Success);
