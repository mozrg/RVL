using System.Windows.Forms;

namespace RVL;

internal static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
        Application.Run(new WebMainForm(args));
    }
}
