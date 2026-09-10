# RVL Native

Новый нативный host RVL для Windows без AutoHotkey и ActiveX/IE. Существующий
`ui/index.html`, `ui/app.js` и `ui/style.css` остаются интерфейсом приложения;
WebView2 используется только как современный рендерер для этого UI.

## Что уже перенесено

- весь существующий UI и его настройки без упрощения;
- пресеты, группы, drag-and-drop, сортировка, избранное и горячие клавиши;
- запуск через `roblox://` с fallback в браузер;
- история, dashboard-статистика, CSV/JSON экспорт и backup;
- цветовые темы, кастомизация элементов, русский/английский язык;
- аватарки Roblox с дисковым кэшем;
- автозапуск Windows, прозрачность, scale, always-on-top и compact mode;
- сохранение в совместимый с прежней версией `data/` формат.

## Запуск из исходников

Нужны .NET 8 Desktop Runtime и Microsoft Edge WebView2 Runtime для Windows:

```powershell
dotnet run --project app/RVL.csproj
```

Release-сборка:

```powershell
dotnet build app/RVL.csproj -c Release
```

Готовый exe появляется в `app/bin/Release/net8.0-windows/`. Для чистого
релизного каталога используйте `powershell -File app/build.ps1`.

## Ограничение размера

Lean framework-dependent пакет вместе с UI занимает примерно 2–3 МБ. Runtime
WebView2 и .NET устанавливаются отдельно, поэтому приложение остаётся в лимите
5–10 МБ. Полностью self-contained публикация .NET по-прежнему намного тяжелее
и для релиза не используется.

## Данные

Приложение сначала ищет `data/` рядом с exe и в родительских папках проекта,
поэтому текущие `data/presets.json`, `data/config.ini` и `data/history.log`
подхватываются автоматически. Если папки нет, данные создаются в
`%APPDATA%\\RVL\\data`.
