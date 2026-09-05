/* ============================================================
   app.js  ·  RVL v1.5.1
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

/* ── Built-in theme presets ─────────────────────────────── */
var THEME_PRESETS = [
    /* Solid themes */
    { id:"onyx",   name:"Onyx",   bg:"#0A0A0A", surface:"#111111", text:"#E8E8E8", accent:"#FFFFFF" },
    { id:"ocean",  name:"Ocean",  bg:"#050D1A", surface:"#0A1929", text:"#BFE0FF", accent:"#38BDF8" },
    { id:"forest", name:"Forest", bg:"#060E08", surface:"#0C1A0F", text:"#BBEECC", accent:"#22C55E" },
    { id:"sunset", name:"Sunset", bg:"#120808", surface:"#1C0E0E", text:"#FFDFB2", accent:"#F97316" },
    { id:"neon",   name:"Neon",   bg:"#07030F", surface:"#100520", text:"#E0CCFF", accent:"#A855F7" },
    { id:"sakura", name:"Sakura", bg:"#100810", surface:"#1C0F1C", text:"#FFD0EC", accent:"#EC4899" },
    { id:"cobalt", name:"Cobalt", bg:"#05050F", surface:"#0A0A1C", text:"#C8CCFF", accent:"#6366F1" },
    { id:"amber",  name:"Amber",  bg:"#0F0C06", surface:"#1A1408", text:"#FFF0C0", accent:"#F59E0B" },
    { id:"mint",   name:"Mint",   bg:"#050F0A", surface:"#091A12", text:"#C0F0DC", accent:"#10B981" },
    { id:"rose",   name:"Rose",   bg:"#130808", surface:"#1E0E0E", text:"#FFE0DC", accent:"#EF4444" },
    { id:"cyber",  name:"Cyber",  bg:"#040810", surface:"#080F1C", text:"#C0F0FF", accent:"#06B6D4" },
    { id:"slate",  name:"Slate",  bg:"#F4F5F7", surface:"#FFFFFF", text:"#20232A", accent:"#17181C" },
    { id:"crimson",name:"Crimson",bg:"#0E0404", surface:"#180808", text:"#FFC0C0", accent:"#DC2626" },
    { id:"lime",   name:"Lime",   bg:"#080C04", surface:"#0F1808", text:"#D8F0A0", accent:"#84CC16" },
    { id:"violet", name:"Violet", bg:"#0A0510", surface:"#140A1A", text:"#E0B0FF", accent:"#7C3AED" },
    { id:"gold",   name:"Gold",   bg:"#0C0A04", surface:"#181408", text:"#FFE8A0", accent:"#EAB308" },
    { id:"ice",    name:"Ice",    bg:"#04080C", surface:"#081018", text:"#C0E8FF", accent:"#0EA5E9" },
    { id:"coral",  name:"Coral",  bg:"#100604", surface:"#1A0C08", text:"#FFD0C0", accent:"#FB7185" },
    { id:"steel",  name:"Steel",  bg:"#08090A", surface:"#101214", text:"#B8C0CC", accent:"#64748B" },
    { id:"plum",   name:"Plum",   bg:"#0C0410", surface:"#180820", text:"#E0B0E0", accent:"#9333EA" },
    /* Gradient themes — vibrant, high-contrast color combinations */
    { id:"grad_aurora", name:"Aurora", bg:"#031420", surface:"#082030", text:"#C0F0FF", accent:"#38BDF8",
      gradientEnabled:true, gradientBg2:"#0A0518", gradientAngle:135 },
    { id:"grad_dusk",   name:"Dusk",   bg:"#1A0820", surface:"#241030", text:"#FFD0F0", accent:"#C026D3",
      gradientEnabled:true, gradientBg2:"#200808", gradientAngle:160 },
    { id:"grad_ember",  name:"Ember",  bg:"#1A0E00", surface:"#241800", text:"#FFE8C0", accent:"#F97316",
      gradientEnabled:true, gradientBg2:"#180008", gradientAngle:120 },
    { id:"grad_ocean",  name:"Deep Sea",  bg:"#021020", surface:"#042040", text:"#B0E8FF", accent:"#0EA5E9",
      gradientEnabled:true, gradientBg2:"#021818", gradientAngle:180 },
    { id:"grad_forest", name:"Forest G", bg:"#041810", surface:"#082818", text:"#B8F0C8", accent:"#22C55E",
      gradientEnabled:true, gradientBg2:"#081808", gradientAngle:145 },
    { id:"grad_galaxy", name:"Galaxy", bg:"#080614", surface:"#100C20", text:"#D8C8FF", accent:"#8B5CF6",
      gradientEnabled:true, gradientBg2:"#140810", gradientAngle:125 },
    { id:"grad_eclipse", name:"Eclipse", bg:"#000008", surface:"#0A0818", text:"#E0D0FF", accent:"#A855F7",
      gradientEnabled:true, gradientBg2:"#200838", gradientAngle:135 },
    { id:"grad_sunset", name:"Sunset G", bg:"#200C08", surface:"#2C1408", text:"#FFE0B0", accent:"#F59E0B",
      gradientEnabled:true, gradientBg2:"#100820", gradientAngle:150 },
    { id:"grad_tropical", name:"Tropical", bg:"#042018", surface:"#083028", text:"#B0FFE0", accent:"#14B8A6",
      gradientEnabled:true, gradientBg2:"#041810", gradientAngle:135 },
    { id:"grad_cotton", name:"Cotton Candy", bg:"#1C0C20", surface:"#281030", text:"#FFD0FF", accent:"#E879F9",
      gradientEnabled:true, gradientBg2:"#0C1020", gradientAngle:145 },
    { id:"grad_magma", name:"Magma", bg:"#180400", surface:"#240800", text:"#FFCC80", accent:"#EF4444",
      gradientEnabled:true, gradientBg2:"#180830", gradientAngle:130 },
    { id:"grad_arctic", name:"Arctic", bg:"#041018", surface:"#081828", text:"#D0F0FF", accent:"#22D3EE",
      gradientEnabled:true, gradientBg2:"#041810", gradientAngle:160 },
    { id:"grad_twilight", name:"Twilight", bg:"#0C0818", surface:"#140C28", text:"#D0C0FF", accent:"#818CF8",
      gradientEnabled:true, gradientBg2:"#100810", gradientAngle:135 },
    { id:"grad_mocha", name:"Mocha", bg:"#100804", surface:"#1C1008", text:"#F0D8B0", accent:"#D97706",
      gradientEnabled:true, gradientBg2:"#04100C", gradientAngle:140 },
    { id:"grad_nebula", name:"Nebula", bg:"#041020", surface:"#081830", text:"#C0D0FF", accent:"#3B82F6",
      gradientEnabled:true, gradientBg2:"#100820", gradientAngle:145 },
    { id:"grad_inferno", name:"Inferno", bg:"#1C0400", surface:"#280600", text:"#FFC0A0", accent:"#DC2626",
      gradientEnabled:true, gradientBg2:"#0C0820", gradientAngle:125 },
    { id:"grad_abyss", name:"Abyss", bg:"#000810", surface:"#001020", text:"#A0E0FF", accent:"#0284C7",
      gradientEnabled:true, gradientBg2:"#040020", gradientAngle:170 },
    { id:"grad_emerald", name:"Emerald", bg:"#001008", surface:"#002010", text:"#A0FFC0", accent:"#059669",
      gradientEnabled:true, gradientBg2:"#041018", gradientAngle:155 }
];

/* ── Language ───────────────────────────────────────────── */
var currentLang   = "ru";
var currentMethod = 1;      /* 1 = Place ID + Link Code,  2 = Share Code */
var appInitialized = false; /* true after initApp() completes */
var currentGuidePage = 1;   /* guide modal page 1 or 2 */

var STRINGS = {
    ru: {
        /* Titlebar tooltips */
        tipSettings:    "Настройки",
        tipMinimize:    "Сохранить и свернуть",
        tipClose:       "Закрыть",
        /* Roblox status */
        robloxOn:       "Roblox запущен",
        robloxOff:      "Roblox не запущен",
        robloxSearch:   "Поиск Roblox...",
        /* Main labels */
        labelPlace:     "PLACE ID",
        labelLink:      "LINK CODE",
        labelHotkey:    "HOTKEY",
        enableHotkey:   "Включить хоткей",
        captureBtn:     "&#9673;&nbsp;ЗАХВАТ",
        capturingBtn:   "&#9679;&nbsp;НАЖМИТЕ...",
        labelPresets:   "PRESETS",
        launchBtn:      "&#9654;&nbsp;ЗАПУСК",
        saveCloseBtn:   "СОХРАНИТЬ",
        addPresetBtn:   "&#43;&nbsp;НОВЫЙ",
        searchPh:       "\uD83D\uDD0D Поиск пресетов...",
        presetNamePh:   "Название пресета...",
        /* Preset row */
        loadBtn:        "ЗАГР.",
        sureText:       "ТОЧНО?",
        renameTip:      "Двойной клик для переименования",
        dragTip:        "Зажмите и потащите, чтобы изменить порядок",
        clearFieldTip:  "Очистить поле",
        tipGroups:      "Группы",
        groupsModalTitle: "ГРУППЫ",
        groupNamePh:    "Название группы...",
        noGroupsYet:    "Группы пока не созданы",
        allGroupsLabel: "Все",
        ungroupedLabel: "Без группы",
        editGroupLabel: "ГРУППА",
        reassignTip:    "Нажмите для переназначения",
        removeHkTip:    "Удалить клавишу",
        assignHkTip:    "Назначить клавишу",
        /* Section btns tooltips */
        tipGuide:       "Как добавить VIP сервер",
        tipExport:      "Экспорт пресетов в файл",
        tipImport:      "Импорт пресетов из файла",
        /* Export modal */
        exportModalTitle: "ЭКСПОРТ ПРЕСЕТОВ",
        exportModePresets: "ПРЕСЕТЫ",
        exportModeGroup:   "ГРУППА",
        exportSelectAll:   "Выбрать все",
        exportSelectNone:  "Снять всё",
        exportSelectedCount: function(n) { return n + (n === 1 ? " выбран" : " выбрано"); },
        exportConfirmBtn:  "Экспортировать",
        exportEmptyPresets: "Нет пресетов для экспорта",
        exportEmptyGroups:  "Нет групп",
        /* Launch count */
        launchCount: function(n) { return "Запущен " + n + " раз"; },
        lastLabel:      "Последний",
        /* Time */
        justNow:        "Только что",
        minsAgo:  function(m) { return m + "м назад"; },
        hoursAgo: function(h) { return h + "ч назад"; },
        daysAgo:  function(d) { return d + "д назад"; },
        /* Settings */
        settingsTitle:      "НАСТРОЙКИ",
        langLabel:          "ЯЗЫК",
        langRu:             "РУССКИЙ",
        langEn:             "ENGLISH",
        themeLabel:         "ТЕМА",
        themeDark:          "ТЁМНАЯ",
        themeLight:         "СВЕТЛАЯ",
        themeCustom:        "КАСТОМ",
        managePresetsBtn:   "Управление цветовыми пресетами",
        customColorsLabel:  "СВОИ ЦВЕТА",
        colorBg:            "Фон",
        colorSurface:       "Поверхность",
        colorText:          "Текст",
        colorAccent:        "Акцент",
        windowSizeLabel:    "РАЗМЕР ОКНА",
        opacityLabel:       "ПРОЗРАЧНОСТЬ ОКНА",
        behaviorLabel:      "ПОВЕДЕНИЕ",
        hideAfterLaunch:    "Скрыть окно после запуска",
        showTooltips:       "Показывать подсказки",
        maskInputsLabel:    "Скрывать вводимые данные",
        alwaysOnTopLabel:   "Поверх всех окон",
        showFieldTip:       "Показать",
        hideFieldTip:       "Скрыть",
        settingsSaveBtn:    "СОХРАНИТЬ",
        /* Color presets modal */
        cpTitle:        "ЦВЕТОВЫЕ ПРЕСЕТЫ",
        cpSaveColors:   "Сохранить",
        cpCancel:       "Отмена",
        cpDone:         "Готово",
        cpNamePh:       "Название пресета...",
        tipExportTheme: "Экспорт цветовых пресетов",
        tipImportTheme: "Импорт цветовых пресетов",
        /* Color picker */
        cpickerTitle:   "ВЫБОР ЦВЕТА",
        cpickerPreview: "ПРОСМОТР",
        cpickerHex:     "HEX",
        cpickerCancel:  "Отмена",
        cpickerOk:      "OK",
        /* Guide */
        guideTitle: "КАК ДОБАВИТЬ VIP СЕРВЕР",
        guideStep1: "Скопируй ссылку на VIP сервер в Roblox",
        guideStep2: "Вставь эту ссылку в адресную строку — ссылка автоматически преобразуется",
        guideStep3: "Ты получишь ссылку вида:",
        guideStep4: "Возьми цифры после <span class=\"guide-tag\">/games/</span> и вставь их в поле <span class=\"guide-tag\">PLACE ID</span>",
        guideStep5: "Возьми цифры после <span class=\"guide-tag\">?privateServerLinkCode=</span> и вставь их в поле <span class=\"guide-tag\">LINK CODE</span>. После можешь сохранить нажав <span class=\"guide-tag\">+ НОВЫЙ</span> и написав название пресета",
        guideMethod2Title: "СПОСОБ 2 — CONFIGURE PRIVATE SERVERS",
        guideM2Step1: "Зайди в <span class=\"guide-tag\">Configure Private Servers</span> в настройках игры в Roblox",
        guideM2Step2: "Нажми <span class=\"guide-tag\">Regenerate</span>, чтобы создать ссылку (или используй существующую)",
        guideM2Step3: "Скопируй всё что идёт после <span class=\"guide-tag\">code=</span> (включая <span class=\"guide-tag\">&amp;type=Server</span>), либо просто вставь ссылку целиком — код определится автоматически. Пример:",
        guideM2Step4: "Вставь скопированное в поле <span class=\"guide-tag\">SHARE CODE</span> — значение подставится автоматически. Затем введи <span class=\"guide-tag\">PLACE ID</span> и сохрани через <span class=\"guide-tag\">+ НОВЫЙ</span>",
        methodTab1: "СПОСОБ 1",
        methodTab2: "СПОСОБ 2",
        shareCodeLabel: "SHARE CODE",
        shareCodePlaceholder: "Вставьте ссылку или код...",
        guidePageLabel: "Страница",
        guideMethod1Title: "КАК ДОБАВИТЬ VIP СЕРВЕР (СПОСОБ 1)",
        guideMethod2ModalTitle: "КАК ДОБАВИТЬ VIP СЕРВЕР (СПОСОБ 2)",
        tipColorPick: "Нажмите для выбора цвета",
        favSetTip:    "Сделать избранным — загружается автоматически",
        favUnsetTip:  "Убрать из избранного",
        /* Show/hide hotkey settings */
        showHideLabel:   "КЛАВИША СВЕРНУТЬ/РАЗВЕРНУТЬ",
        showHideEnable:  "Включить",
        showHideCapture: "&#9673;&nbsp;ЗАХВАТ",
        showHideCapturing:"&#9679;&nbsp;НАЖМИТЕ...",
        gradientLabel:"ГРАДИЕНТ ФОНА",gradientColor2:"Цвет 2",gradientAngle:"УГОЛ",
        launchDelayLabel:"Задержка запуска",launchDelayUnit:"с",
        launchCountdown:function(n){return "&#9654;&nbsp;ЗАПУСК "+n+"с...";},
        dupTip:"Дублировать пресет",
        dupIndicatorTip:function(n){return "\u26A0 "+n+" пресета с одинаковым кодом";},
        editPresetTip:"Редактировать Place ID, Link/Share Code и группу",
        editPresetTitle:"Редактировать пресет",editPlaceLabel:"PLACE ID",
        editLinkLabel:"LINK CODE",editSaveBtn:"Сохранить",editCancelBtn:"Отмена",
        factoryResetLabel:"СБРОС",factoryResetBtn:"Сбросить к заводским",
        factoryResetConfirm:"Сбросить всё к заводским настройкам?",
        factoryResetConfirmBtn:"Да, сбросить",
        bulkEditTitle:"Массовое редактирование",bulkEditTooltip:"Массовое редактирование",
        bulkColName:"Название",
        bulkColPlace:"Place ID",bulkColLink:"Link Code",
        bulkSaveBtn:"Сохранить",bulkCancelBtn:"Отмена",
        /* New strings for enhancements */
        copyLinkTip:"Копировать ссылку",
        copyLinkDone:"Ссылка скопирована в буфер",
        copyLinkFail:"Не удалось скопировать",
        sortLabel:"СОРТИРОВКА",
        sortManual:"Вручную",
        sortName:"По имени",
        sortDate:"По дате",
        sortLaunches:"По запускам",
        sortFav:"Избранное вверху",
        undoDelete:"Пресет удалён",
        undoBtn:"Отмена",
        undoRestored:"Пресет восстановлен",
        emptyPresets:"Нет пресетов",
        emptyPresetsHint:"Нажми + НОВЫЙ, чтобы создать первый",
        emptyPresetsHint2:"или перетащи .json файл сюда",
        compactMode:"Компактный режим",
        statusBarPresets:"пресетов",
        statusBarLast:"Последний:",
        statusBarNever:"никогда",
        trayFavLaunch:"Быстрый запуск",
        trayNoFav:"Нет избранных пресетов",
        exitConfirmTitle:"Несохранённые изменения",
        exitConfirmMsg:"Есть несохранённые изменения. Выйти без сохранения?",
        exitConfirmYes:"Выйти",
        exitConfirmNo:"Отмена",
        backupTitle:"РЕЗЕРВНОЕ КОПИРОВАНИЕ",
        backupCreate:"Создать резервную копию",
        backupRestore:"Восстановить из копии",
        backupDone:"Резервная копия создана",
        backupRestoreDone:"Состояние восстановлено",
        backupRestoreConfirm:"Восстановление заменит все текущие данные. Продолжить?",
        historyTitle:"ИСТОРИЯ ЗАПУСКОВ",
        historyColPreset:"Пресет",
        historyColDate:"Дата",
        historyColStatus:"Статус",
        historyColPlaceId:"Код",
        historyClear:"Очистить историю",
        historyEmpty:"История пуста",
        historyFilterAll:"Все",
        historyFilterToday:"Сегодня",
        historyFilterWeek:"За неделю",
        dashboardTitle:"СТАТИСТИКА",
        dashboardTotalLaunches:"Всего запусков",
        dashboardTopPresets:"Топ пресетов",
        dashboardAvgInterval:"Средний интервал",
        dashboardThisWeek:"За неделю",
        dashboardExportCsv:"Экспорт CSV",
        dashboardExportJson:"Экспорт JSON",
        dashboardNoData:"Недостаточно данных",
        statSuccess:"успех",
        statFail:"ошибка",
        searchAllFields:"Поиск по всем полям...",
        dragImportJson:"Отпустите для импорта .json",
        dragImportLink:"Отпустите для автозаполнения",
        toastClose:"Закрыть",
        tpPreview:"Превью",
        /* New strings for v1.7 enhancements */
        ctxLaunch:"Запустить",
        ctxCopyLink:"Копировать ссылку",
        ctxDuplicate:"Дублировать",
        ctxEdit:"Редактировать",
        ctxDelete:"Удалить",
        ctxSetColor:"Цвет метки",
        ctxSetIcon:"Иконка",
        ctxClearColor:"Убрать цвет",
        recentSection:"НЕДАВНИЕ",
        multiSelectTip:"Ctrl+клик для выбора нескольких",
        multiSelected:"выбрано",
        multiDelete:"Удалить выбранные",
        multiExport:"Экспорт выбранных",
        multiClear:"Снять выделение",
        undoRename:"Переименование отменено",
        undoMove:"Перемещение отменено",
        robloxStarted:"Roblox запущен",
        robloxClosed:"Roblox закрыт",
        gridToggle:"Сетка",
        listToggle:"Список",
        presetColor:"Цвет пресета",
        presetIcon:"Иконка пресета",
        iconPlaceholder:"Emoji или символ...",
        previewPlaceId:"Place ID",
        previewLinkCode:"Link Code",
        previewLaunches:"Запусков",
        previewLast:"Последний",
        noColor:"Без цвета"
    },
    en: {
        /* Titlebar tooltips */
        tipSettings:    "Settings",
        tipMinimize:    "Save & minimize",
        tipClose:       "Close",
        /* Roblox status */
        robloxOn:       "Roblox is running",
        robloxOff:      "Roblox is not running",
        robloxSearch:   "Searching for Roblox...",
        /* Main labels */
        labelPlace:     "PLACE ID",
        labelLink:      "LINK CODE",
        labelHotkey:    "HOTKEY",
        enableHotkey:   "Enable hotkey",
        captureBtn:     "&#9673;&nbsp;CAPTURE",
        capturingBtn:   "&#9679;&nbsp;PRESS KEY...",
        labelPresets:   "PRESETS",
        launchBtn:      "&#9654;&nbsp;LAUNCH",
        saveCloseBtn:   "SAVE &amp; CLOSE",
        addPresetBtn:   "&#43;&nbsp;NEW",
        searchPh:       "\uD83D\uDD0D Search presets...",
        presetNamePh:   "Preset name...",
        /* Preset row */
        loadBtn:        "LOAD",
        sureText:       "SURE?",
        renameTip:      "Double-click to rename",
        dragTip:        "Press and drag to reorder",
        clearFieldTip:  "Clear field",
        tipGroups:      "Groups",
        groupsModalTitle: "GROUPS",
        groupNamePh:    "Group name...",
        noGroupsYet:    "No groups yet",
        allGroupsLabel: "All",
        ungroupedLabel: "Ungrouped",
        editGroupLabel: "GROUP",
        reassignTip:    "Click to reassign",
        removeHkTip:    "Remove hotkey",
        assignHkTip:    "Assign hotkey",
        /* Section btns tooltips */
        tipGuide:       "How to add a VIP server",
        tipExport:      "Export presets to file",
        tipImport:      "Import presets from file",
        /* Export modal */
        exportModalTitle: "EXPORT PRESETS",
        exportModePresets: "PRESETS",
        exportModeGroup:   "GROUP",
        exportSelectAll:   "Select all",
        exportSelectNone:  "Select none",
        exportSelectedCount: function(n) { return n + " selected"; },
        exportConfirmBtn:  "Export",
        exportEmptyPresets: "No presets to export",
        exportEmptyGroups:  "No groups",
        /* Launch count */
        launchCount: function(n) { return "Launched " + n + " time" + (n !== 1 ? "s" : ""); },
        lastLabel:      "Last",
        /* Time */
        justNow:        "Just now",
        minsAgo:  function(m) { return m + "m ago"; },
        hoursAgo: function(h) { return h + "h ago"; },
        daysAgo:  function(d) { return d + "d ago"; },
        /* Settings */
        settingsTitle:      "SETTINGS",
        langLabel:          "LANGUAGE",
        langRu:             "РУССКИЙ",
        langEn:             "ENGLISH",
        themeLabel:         "THEME",
        themeDark:          "DARK",
        themeLight:         "LIGHT",
        themeCustom:        "CUSTOM",
        managePresetsBtn:   "Manage Color Presets",
        customColorsLabel:  "CUSTOM COLORS",
        colorBg:            "Background",
        colorSurface:       "Surface",
        colorText:          "Text",
        colorAccent:        "Accent",
        windowSizeLabel:    "WINDOW SIZE",
        opacityLabel:       "WINDOW OPACITY",
        behaviorLabel:      "BEHAVIOR",
        hideAfterLaunch:    "Hide window after launch",
        showTooltips:       "Show tooltips",
        maskInputsLabel:    "Mask input fields",
        alwaysOnTopLabel:   "Always on top",
        showFieldTip:       "Show",
        hideFieldTip:       "Hide",
        settingsSaveBtn:    "SAVE",
        /* Color presets modal */
        cpTitle:        "COLOR PRESETS",
        cpSaveColors:   "Save",
        cpCancel:       "Cancel",
        cpDone:         "Done",
        cpNamePh:       "Preset name...",
        tipExportTheme: "Export theme presets",
        tipImportTheme: "Import theme presets",
        /* Color picker */
        cpickerTitle:   "COLOR PICKER",
        cpickerPreview: "PREVIEW",
        cpickerHex:     "HEX",
        cpickerCancel:  "Cancel",
        cpickerOk:      "OK",
        /* Guide */
        guideTitle: "HOW TO ADD A VIP SERVER",
        guideStep1: "Copy the VIP server link from Roblox",
        guideStep2: "Paste the link into the address bar — it will be converted automatically",
        guideStep3: "You will get a link like this:",
        guideStep4: "Copy digits after <span class=\"guide-tag\">/games/</span> into <span class=\"guide-tag\">PLACE ID</span>",
        guideStep5: "After <span class=\"guide-tag\">?privateServerLinkCode=</span> → <span class=\"guide-tag\">LINK CODE</span>. Save via <span class=\"guide-tag\">+ NEW</span>",
        guideMethod2Title: "METHOD 2 — CONFIGURE PRIVATE SERVERS",
        guideM2Step1: "Open <span class=\"guide-tag\">Configure Private Servers</span> in Roblox game settings",
        guideM2Step2: "Click <span class=\"guide-tag\">Regenerate</span> to create a link (or use existing)",
        guideM2Step3: "Copy everything after <span class=\"guide-tag\">code=</span> (including <span class=\"guide-tag\">&amp;type=Server</span>), or just paste the whole link — the code is extracted automatically:",
        guideM2Step4: "Paste into <span class=\"guide-tag\">SHARE CODE</span> — auto-parsed. Enter <span class=\"guide-tag\">PLACE ID</span> and save via <span class=\"guide-tag\">+ NEW</span>",
        methodTab1: "METHOD 1",
        methodTab2: "METHOD 2",
        shareCodeLabel: "SHARE CODE",
        shareCodePlaceholder: "Paste link or code...",
        guidePageLabel: "Page",
        guideMethod1Title: "HOW TO ADD A VIP SERVER (METHOD 1)",
        guideMethod2ModalTitle: "HOW TO ADD A VIP SERVER (METHOD 2)",
        tipColorPick: "Click to pick color",
        favSetTip:    "Set as favorite — loads automatically on start",
        favUnsetTip:  "Remove from favorites",
        /* Show/hide hotkey settings */
        showHideLabel:   "MINIMIZE / RESTORE HOTKEY",
        showHideEnable:  "Enable",
        showHideCapture: "&#9673;&nbsp;CAPTURE",
        showHideCapturing:"&#9679;&nbsp;PRESS KEY...",
        gradientLabel:"BACKGROUND GRADIENT",gradientColor2:"Color 2",gradientAngle:"ANGLE",
        launchDelayLabel:"Launch delay",launchDelayUnit:"s",
        launchCountdown:function(n){return "&#9654;&nbsp;LAUNCH "+n+"s...";},
        dupTip:"Duplicate preset",
        dupIndicatorTip:function(n){return "\u26A0 "+n+" presets with same code";},
        editPresetTip:"Edit Place ID, Link/Share Code and group",
        editPresetTitle:"Edit preset",editPlaceLabel:"PLACE ID",
        editLinkLabel:"LINK CODE",editSaveBtn:"Save",editCancelBtn:"Cancel",
        factoryResetLabel:"RESET",factoryResetBtn:"Factory reset",
        factoryResetConfirm:"Reset everything to factory defaults?",
        factoryResetConfirmBtn:"Yes, reset",
        bulkEditTitle:"Bulk edit",bulkEditTooltip:"Bulk edit",
        bulkColName:"Name",
        bulkColPlace:"Place ID",bulkColLink:"Link Code",
        bulkSaveBtn:"Save",bulkCancelBtn:"Cancel",
        /* New strings for enhancements */
        copyLinkTip:"Copy link",
        copyLinkDone:"Link copied to clipboard",
        copyLinkFail:"Failed to copy",
        sortLabel:"SORT",
        sortManual:"Manual",
        sortName:"By name",
        sortDate:"By date",
        sortLaunches:"By launches",
        sortFav:"Favorites first",
        undoDelete:"Preset deleted",
        undoBtn:"Undo",
        undoRestored:"Preset restored",
        emptyPresets:"No presets",
        emptyPresetsHint:"Click + NEW to create your first one",
        emptyPresetsHint2:"or drag a .json file here",
        compactMode:"Compact mode",
        statusBarPresets:"presets",
        statusBarLast:"Last:",
        statusBarNever:"never",
        trayFavLaunch:"Quick launch",
        trayNoFav:"No favorite presets",
        exitConfirmTitle:"Unsaved changes",
        exitConfirmMsg:"You have unsaved changes. Exit without saving?",
        exitConfirmYes:"Exit",
        exitConfirmNo:"Cancel",
        backupTitle:"BACKUP",
        backupCreate:"Create backup",
        backupRestore:"Restore from backup",
        backupDone:"Backup created",
        backupRestoreDone:"State restored",
        backupRestoreConfirm:"Restoring will replace all current data. Continue?",
        historyTitle:"LAUNCH HISTORY",
        historyColPreset:"Preset",
        historyColDate:"Date",
        historyColStatus:"Status",
        historyColPlaceId:"Код",
        historyClear:"Clear history",
        historyEmpty:"History is empty",
        historyFilterAll:"All",
        historyFilterToday:"Today",
        historyFilterWeek:"This week",
        dashboardTitle:"STATISTICS",
        dashboardTotalLaunches:"Total launches",
        dashboardTopPresets:"Top presets",
        dashboardAvgInterval:"Avg interval",
        dashboardThisWeek:"This week",
        dashboardExportCsv:"Export CSV",
        dashboardExportJson:"Export JSON",
        dashboardNoData:"Not enough data",
        statSuccess:"success",
        statFail:"error",
        searchAllFields:"Search all fields...",
        dragImportJson:"Drop to import .json",
        dragImportLink:"Drop to auto-fill",
        toastClose:"Close",
        tpPreview:"Preview",
        ctxLaunch:"Launch",
        ctxCopyLink:"Copy link",
        ctxDuplicate:"Duplicate",
        ctxEdit:"Edit",
        ctxDelete:"Delete",
        ctxSetColor:"Set color",
        ctxSetIcon:"Set icon",
        ctxClearColor:"Clear color",
        recentSection:"RECENT",
        multiSelectTip:"Ctrl+click to select multiple",
        multiSelected:"selected",
        multiDelete:"Delete selected",
        multiExport:"Export selected",
        multiClear:"Clear selection",
        undoRename:"Rename undone",
        undoMove:"Move undone",
        robloxStarted:"Roblox started",
        robloxClosed:"Roblox closed",
        gridToggle:"Grid",
        listToggle:"List",
        presetColor:"Preset color",
        presetIcon:"Preset icon",
        iconPlaceholder:"Emoji or symbol...",
        previewPlaceId:"Place ID",
        previewLinkCode:"Link Code",
        previewLaunches:"Launches",
        previewLast:"Last",
        noColor:"No color"
    }
};

/* ── App state ──────────────────────────────────────────── */
var presets       = [];
var capturingKey  = false;
var formOpen      = false;
var themeMode     = "dark";
var autoMinimize  = false;
var isLaunching   = false;
var uiScale       = 1.0;
var uiOpacity     = 255;
var showHideKey   = "";
var showHideEn    = false;
var tooltipsEnabled = true;
var maskInputsEnabled = true;
var alwaysOnTop   = false;

/* ── Layout constants for dynamic height calculation ─────── */
var FIXED_H        = 412;  /* Slightly increased to prevent status-bar clipping */
var ROW_H          = 39;
var SEARCH_H       = 32;
var FORM_H         = 52;
var EMPTY_H        = 0;
var MAX_VISIBLE    = 4;
var BASE_W         = 420;

/* ── Delete-confirm state ────────────────────────────────── */
var pendingDelId  = null;
var pendingDelBtn = null;
var pendingDelTmr = null;

/* ── Rename state ────────────────────────────────────────── */
var renamingId = null;
var editingPresetId = null;
var launchDelay = 0;
var countdownTimer = null;

/* ── Last loaded preset (for launch counter) ─────────────── */
var lastLoadedPresetId = null;

/* ── Favorite preset id ──────────────────────────────────── */
var favoritePresetId = null;

/* ── Preset hotkey capture state ─────────────────────────── */
var capturePresetId = null;

/* ── Drag & reorder state ────────────────────────────────── */
var DRAG_THRESH = 5;
var drag = {
    on: false, pending: false, srcId: null, bucket: null,
    sx: 0, sy: 0, ox: 0, oy: 0,
    ghost: null, line: null
};
var customTheme   = {
    bg:      "#0A0A0A",
    surface: "#111111",
    text:    "#E8E8E8",
    accent:  "#FFFFFF",
    gradientEnabled: false,
    gradientBg2: "#0A0A0A",
    gradientAngle: 135
};

/* ── Theme Presets Manager state ─────────────────────────── */
var userThemePresets = [];
var tpRestore = null;
var tpFormOpen = false;
var pendingTPDeleteId = null;
var pendingTPDeleteTmr = null;

/* ── Preset Groups (folders) state ───────────────────────── */
var groups             = [];      /* [{id, name, color}] */
var activeGroupFilter  = "all";   /* "all" | "ungrouped" | <groupId> */
var collapsedGroups    = {};       /* { [groupId]: true } (session-only) */
var GROUP_HEADER_H     = 26;
var GROUP_COLORS = [
    "#5B8DEF", "#4ECCA3", "#F2B84B", "#E8634C",
    "#A26BF2", "#43BFE0", "#F26BA6", "#9AA5B1"
];
var pendingGroupDeleteId  = null;
var pendingGroupDeleteTmr = null;
var renamingGroupId       = null;

/* ── Enhancement: sort / undo / compact / status ──────────── */
var sortMode          = "manual";  /* manual | name | date | launches | fav */
var undoStack         = [];        /* [{type, data, prevIndex}] — 1-step undo for delete */
var compactMode       = false;
var dirtyState        = false;     /* unsaved changes flag for exit confirm */
var toastQueue        = [];
var toastContainer    = null;

/* New state for v1.7 enhancements */
var selectedPresets   = {};        /* {presetId: true} for multi-select */
var gridViewMode      = false;     /* false = list, true = grid cards */
var contextMenu       = null;      /* active context menu element */
var prevRobloxStatus  = "0";       /* for Roblox start/stop notifications */
var newGroupDraftColor    = GROUP_COLORS[0];

/* ============================================================
   INIT
   ============================================================ */
function initApp() {
    var place   = el("__cfg_place").value;
    var link    = el("__cfg_link").value;
    var hotkey  = el("__cfg_hotkey").value;
    var enabled = el("__cfg_enabled").value !== "0";

    themeMode = safeThemeMode(el("__cfg_theme_mode").value);

    autoMinimize = el("__cfg_auto_minimize").value === "1";
    syncAutoMinToggle();

    var tt = el("__cfg_tooltips").value;
    tooltipsEnabled = (tt !== "0");
    syncTooltipToggle();

    var mi = el("__cfg_mask_inputs") ? el("__cfg_mask_inputs").value : "1";
    maskInputsEnabled = (mi !== "0");
    syncMaskToggle();

    var aot = el("__cfg_always_on_top") ? el("__cfg_always_on_top").value : "0";
    alwaysOnTop = (aot === "1");
    syncAOTToggle(true);

    /* Enhancement: Compact mode — read from config and apply */
    var cm = el("__cfg_compact_mode") ? el("__cfg_compact_mode").value : "0";
    compactMode = (cm === "1");
    applyCompactMode();

    /* Enhancement: Sort mode — read from config */
    var sm = el("__cfg_sort_mode") ? el("__cfg_sort_mode").value : "manual";
    sortMode = (sm === "name" || sm === "date" || sm === "launches" || sm === "fav") ? sm : "manual";

    var ld = parseInt(el("__cfg_launch_delay") ? el("__cfg_launch_delay").value : "0", 10);
    launchDelay = (!isNaN(ld) && ld >= 0 && ld <= 60) ? ld : 0;
    syncDelayDisplay();

    customTheme.gradientEnabled = el("__cfg_theme_grad_en") ? el("__cfg_theme_grad_en").value === "1" : false;
    customTheme.gradientBg2 = el("__cfg_theme_grad_bg2") ? (el("__cfg_theme_grad_bg2").value || customTheme.bg) : customTheme.bg;
    customTheme.gradientAngle = el("__cfg_theme_grad_angle") ? (parseInt(el("__cfg_theme_grad_angle").value, 10) || 135) : 135;

    /* ── Language ── */
    var langVal = trim(el("__cfg_lang") ? el("__cfg_lang").value : "");
    currentLang = (langVal === "en") ? "en" : "ru";

    var sv = parseFloat(el("__cfg_scale").value) || 1.0;
    uiScale = (sv >= 0.8 && sv <= 2.0) ? sv : 1.0;
    applySavedScale();
    syncScaleButtons();

    var ov = parseInt(el("__cfg_opacity") ? el("__cfg_opacity").value : "255", 10);
    uiOpacity = (ov >= 26 && ov <= 255) ? ov : 255;
    syncOpacityButtons();

    /* ── Show/hide hotkey ── */
    showHideKey = el("__cfg_sh_key") ? trim(el("__cfg_sh_key").value) : "";
    showHideEn  = el("__cfg_sh_en")  ? el("__cfg_sh_en").value === "1" : false;
    syncShowHideUI();
    customTheme.bg      = normalizeHex(el("__cfg_theme_bg").value, "#0A0A0A");
    customTheme.surface = normalizeHex(el("__cfg_theme_surface").value, "#111111");
    customTheme.text    = normalizeHex(el("__cfg_theme_text").value, "#E8E8E8");
    customTheme.accent  = normalizeHex(el("__cfg_theme_accent").value, "#FFFFFF");

    try {
        var tpRaw = el("__cfg_theme_presets").value;
        var tpParsed = JSON.parse(tpRaw || "[]");
        if (isArray(tpParsed)) userThemePresets = tpParsed;
    } catch (e) {
        userThemePresets = [];
    }

    try {
        var grpRaw = el("__cfg_preset_groups") ? el("__cfg_preset_groups").value : "[]";
        var grpParsed = JSON.parse(grpRaw || "[]");
        groups = isArray(grpParsed) ? grpParsed : [];
    } catch (e) {
        groups = [];
    }

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
    flushPresetHKMap();

    /* ── Startup preset loading ─────────────────────────────────
       Priority:
         1. If 1 favourite  → load it.
         2. If >1 favourites → load the one matching LastPreset from config
                               (last loaded favourite); if no match, load
                               the favourite with the highest lastLaunch.
         3. If 0 favourites  → load the preset matching LastPreset from config.
         4. No match at all  → leave fields as-is (from PlaceId/LinkCode).
    ────────────────────────────────────────────────────────────── */
    var savedLastId = el("__cfg_last_preset") ? trim(el("__cfg_last_preset").value) : "";

    var favs = [];
    for (var fi = 0; fi < presets.length; fi++) {
        if (presets[fi].favorite) favs.push(presets[fi]);
    }

    var targetId = null;

    if (favs.length === 1) {
        targetId = favs[0].id;

    } else if (favs.length > 1) {
        /* Try savedLastId first — but only if it's still starred */
        var savedIsFav = false;
        for (var si = 0; si < favs.length; si++) {
            if (favs[si].id === savedLastId) { savedIsFav = true; break; }
        }
        if (savedIsFav) {
            targetId = savedLastId;
        } else {
            /* Fallback: favourite with highest lastLaunch */
            var best = null, bestTs = -1;
            for (var bi = 0; bi < favs.length; bi++) {
                var bts = favs[bi].lastLaunch || 0;
                if (bts > bestTs) { bestTs = bts; best = favs[bi].id; }
            }
            targetId = best;
        }

    } else {
        /* No favourites — restore last loaded preset */
        if (savedLastId && findPreset(savedLastId)) {
            targetId = savedLastId;
        }
    }

    if (targetId) {
        var tp = findPreset(targetId);
        if (tp) {
            lastLoadedPresetId = targetId;
            switchMethod(tp.method || 1);
            if ((tp.method || 1) === 2) {
                var scInp0 = el("inp-share-code");
                if (scInp0) scInp0.value = tp.linkCode || "";
                el("inp-place").value = "";
                el("inp-link").value  = tp.linkCode || "";
            } else {
                el("inp-place").value = tp.placeId  || "";
                el("inp-link").value  = tp.linkCode || "";
            }
            if (tp.favorite) favoritePresetId = targetId;
        }
    }

    /* Compute favoritePresetId for multi-fav tray use */
    if (favs.length === 1) {
        favoritePresetId = favs[0].id;
    } else if (favs.length > 1 && favoritePresetId === null) {
        favoritePresetId = targetId;
    }

    /* Write back so AHK persists it on next save */
    var lpInp = el("__cfg_last_preset");
    if (lpInp) lpInp.value = lastLoadedPresetId || "";

    syncThemeControls();
    applyTheme();
    /* Enhancement: apply compact mode AFTER applyTheme so the class
       isn't wiped by applyTheme's body.className overwrite. */
    applyCompactMode();
    syncColorPickers();
    applyLanguage();
    appInitialized = true;
    sendResize();
    /* Second resize after DOM settles — ensures compact-mode CSS has been
       applied so liveHeight() measures correct (smaller) element sizes. */
    setTimeout(function () { sendResize(); }, 50);
    /* Publish titlebar metrics for AHK WM_NCHITTEST after layout settles.
       Use setTimeout to ensure scale/resize has been applied first. */
    setTimeout(function() { publishTitlebarMetrics(); }, 80);
}

/* ============================================================
   DOM READY
   ============================================================ */
window.onload = function () {
    /* Use the queue-based bridge. document.title is no longer used
       for command signalling (see sendCmd). */
    sendCmd("CMD:ready");

    el("btn-min").onclick           = onMinimize;
    el("btn-close").onclick         = function () { requestExit(); };
    el("btn-settings").onclick      = openSettings;
    el("btn-launch").onclick        = onLaunch;
    el("btn-save").onclick          = onSaveClose;
    el("btn-capture").onclick       = function () { startCapture(); return false; };
    el("btn-add-preset").onclick    = togglePresetForm;
    el("btn-preset-ok").onclick     = confirmNewPreset;
    el("btn-preset-cancel").onclick = closePresetForm;

    /* Enhancement: track dirty state on input field changes */
    var dirtyFields = ["inp-place", "inp-link", "inp-share-code", "inp-key"];
    for (var dfi = 0; dfi < dirtyFields.length; dfi++) {
        var dfEl = el(dirtyFields[dfi]);
        if (dfEl) {
            (function (f) {
                f.oninput = function () { setDirty(); };
            })(dfEl);
        }
    }

    /* ── Auto-parse URLs pasted into LINK CODE or PLACE ID fields ────────
       Supported formats:
         Method 1 (old VIP URL):
           https://www.roblox.com/games/PLACEID/Name?privateServerLinkCode=CODE
         Method 2 (share link):
           https://www.roblox.com/share?code=CODE&type=Server
           roblox://navigation/share_links?code=CODE&type=Server
           Just the raw CODE&type=Server value (or raw CODE alone)
    ─────────────────────────────────────────────────────────────────────── */
    function parseRobloxURL(raw) {
        raw = trim(raw);
        /* Method 1: full old-style game URL with privateServerLinkCode */
        var m1Place = raw.match(/roblox\.com\/games\/(\d+)/i);
        var m1Link  = raw.match(/[?&]privateServerLinkCode=([A-Za-z0-9]+)/i);
        if (m1Place && m1Link) {
            return { placeId: m1Place[1], linkCode: m1Link[1] };
        }
        /* Method 2a: https://www.roblox.com/share?code=XXX&type=Server */
        var m2 = raw.match(/[?&]code=([A-Za-z0-9]+)(?:&type=Server)?/i);
        if (m2) {
            return { linkCode: m2[1] + "&type=Server" };
        }
        /* Method 2b: user pasted raw value like "3df324...&type=Server" or just the hex */
        var m3 = raw.match(/^([A-Za-z0-9]{20,})&type=Server$/i);
        if (m3) {
            return { linkCode: m3[1] + "&type=Server" };
        }
        return null;
    }

    function onLinkPaste(e) {
        /* Use setTimeout so .value is already updated when we read it */
        setTimeout(function () {
            var raw = trim(el("inp-link").value);
            var parsed = parseRobloxURL(raw);
            if (!parsed) return;
            if (parsed.linkCode) el("inp-link").value  = parsed.linkCode;
            if (parsed.placeId)  el("inp-place").value = parsed.placeId;
        }, 0);
    }

    var inpLink  = el("inp-link");
    var inpPlace = el("inp-place");
    if (inpLink)  { inpLink.onpaste  = onLinkPaste; }
    /* Also handle paste on place field for Method 1 full URL */
    if (inpPlace) {
        inpPlace.onpaste = function () {
            setTimeout(function () {
                var raw = trim(el("inp-place").value);
                var parsed = parseRobloxURL(raw);
                if (!parsed) return;
                if (parsed.placeId)  el("inp-place").value = parsed.placeId;
                if (parsed.linkCode) el("inp-link").value  = parsed.linkCode;
            }, 0);
        };
    }

    /* ── Method 2 share-code field: auto-parse on paste ── */
    var inpShare = el("inp-share-code");
    if (inpShare) {
        inpShare.onpaste = function () {
            setTimeout(function () {
                var raw = trim(el("inp-share-code").value);
                /* Strip URL prefix if user pasted full URL */
                var m = raw.match(/[?&]code=([A-Za-z0-9]+(?:&type=Server)?)/i);
                if (m) el("inp-share-code").value = m[1];
            }, 0);
        };
    }

    /* ── Clear (×) buttons for PLACE ID / LINK CODE / SHARE CODE ── */
    wireFieldClear(inpPlace, el("clr-place"));
    wireFieldClear(inpLink,  el("clr-link"));
    wireFieldClear(inpShare, el("clr-share-code"));

    /* ── Eye (show/hide) buttons for the same fields ── */
    wireFieldEye(inpPlace, el("eye-place"));
    wireFieldEye(inpLink,  el("eye-link"));
    wireFieldEye(inpShare, el("eye-share-code"));
    applyMaskInputs();


    /* ── Method tabs ── */
    var tab1 = el("method-tab-1");
    var tab2 = el("method-tab-2");
    if (tab1) tab1.onclick = function () { switchMethod(1); };
    if (tab2) tab2.onclick = function () { switchMethod(2); };

    /* ── Guide page navigation ── */
    var gPrev = el("guide-nav-prev");
    var gNext = el("guide-nav-next");
    if (gPrev) gPrev.onclick = function () { switchGuidePage(1); };
    if (gNext) gNext.onclick = function () { switchGuidePage(2); };

    /* Initial render */
    switchMethod(1);
    switchGuidePage(1);
    el("settings-close").onclick = function () {
        cancelFactoryConfirm();
        syncThemeControls();
        closeSettings();
    };
    el("settings-save").onclick     = saveSettings;
    el("theme-opt-dark").onclick    = function () { selectThemeMode("dark"); };
    el("theme-opt-light").onclick   = function () { selectThemeMode("light"); };
    el("theme-opt-custom").onclick  = function () { selectThemeMode("custom"); };
    el("settings-overlay").onclick  = function (e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t && t.id === "settings-overlay") { syncThemeControls(); closeSettings(); }
    };

    bindColorInput("theme-bg");
    bindColorInput("theme-surface");
    bindColorInput("theme-text");
    bindColorInput("theme-accent");

    bindColorPicker("cp-bg",      "theme-bg");
    bindColorPicker("cp-surface", "theme-surface");
    bindColorPicker("cp-text",    "theme-text");
    bindColorPicker("cp-accent",  "theme-accent");

    el("btn-export").onclick = function () {
        openExportModal();
    };
    el("btn-import").onclick = function () {
        sendCmd("CMD:import_presets");
    };

    /* Delay stepper */
    var dminus = el("delay-minus");
    if (dminus) dminus.onclick = function () { if (launchDelay > 0) { launchDelay--; syncDelayDisplay(); } };
    var dplus = el("delay-plus");
    if (dplus) dplus.onclick = function () { if (launchDelay < 60) { launchDelay++; syncDelayDisplay(); } };

    /* Gradient toggle */
    var gradTrack = el("gradient-track");
    if (gradTrack) {
        gradTrack.onclick = function(e) {
            e = e || window.event; cancelEv(e);
            var chk = el("chk-gradient");
            if (chk) chk.checked = !chk.checked;
            customTheme.gradientEnabled = !!(chk && chk.checked);
            syncGradientUI();
            if (themeMode === "custom") applyTheme();
            return false;
        };
    }
    /* Angle buttons */
    var angles = [45, 90, 135, 180];
    for (var ai = 0; ai < angles.length; ai++) {
        (function(ang) {
            var abtn = el("angle-opt-" + ang);
            if (abtn) abtn.onclick = function() {
                customTheme.gradientAngle = ang;
                var angInp = el("theme-grad-angle");
                if (angInp) angInp.value = ang.toString();
                syncAngleButtons();
                if (themeMode === "custom") applyTheme();
            };
        })(angles[ai]);
    }
    var angInp = el("theme-grad-angle");
    if (angInp) angInp.onchange = function() {
        var v = parseInt(this.value, 10);
        if (!isNaN(v)) { customTheme.gradientAngle = Math.max(0, Math.min(360, v)); syncAngleButtons(); if (themeMode === "custom") applyTheme(); }
    };
    bindColorInput("theme-grad-bg2");
    bindColorPicker("cp-grad-bg2", "theme-grad-bg2");
    setTip("swatch-grad-bg2", (STRINGS[currentLang]||STRINGS.ru).tipColorPick);

    /* Bulk edit */
    var bulkOpenBtn = el("btn-bulk-edit");
    if (bulkOpenBtn) bulkOpenBtn.onclick = openBulkEdit;
    var bulkSaveBtn = el("bulk-save");
    if (bulkSaveBtn) bulkSaveBtn.onclick = saveBulkEdit;
    var bulkCancelBtn = el("bulk-cancel");
    if (bulkCancelBtn) bulkCancelBtn.onclick = closeBulkEdit;
    var bulkCloseX = el("bulk-close");
    if (bulkCloseX) bulkCloseX.onclick = closeBulkEdit;
    var bulkOv = el("bulk-overlay");
    if (bulkOv) bulkOv.onclick = function(e) { if ((e||window.event).target === bulkOv) closeBulkEdit(); };

    /* Factory reset */
    var frBtn = el("btn-factory-reset");
    if (frBtn) frBtn.onclick = onFactoryResetClick;

    el("search-inp").oninput = function () {
        applyFilterEnhanced(this.value);
    };

    el("toggle-track").onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        var chk = el("chk-enabled");
        chk.checked = !chk.checked;
        syncToggle(chk.checked);
        sendCmd("CMD:hotkey_update");
        return false;
    };

    el("auto-min-track").onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        var chk = el("chk-auto-minimize");
        chk.checked = !chk.checked;
        autoMinimize = chk.checked;
        syncAutoMinToggle();
        return false;
    };

    var scaleIds = ["scale-opt-1","scale-opt-2","scale-opt-3","scale-opt-4"];
    var scaleVals = [1.0, 1.15, 1.30, 1.50];
    for (var si = 0; si < scaleIds.length; si++) {
        (function(s){ el(scaleIds[si]).onclick = function(){ applyScale(s); }; })(scaleVals[si]);
    }

    /* Opacity preset buttons */
    for (var oi = 0; oi < OPACITY_OPTS.length; oi++) {
        (function(p){ el(OPACITY_OPTS[oi].id) && (el(OPACITY_OPTS[oi].id).onclick = function(){ applyOpacity(p); }); })(OPACITY_OPTS[oi].pct);
    }

    /* Opacity fine-tune slider */
    var opSlider = el("opacity-slider");
    if (opSlider) {
        opSlider.onchange = function () {
            applyOpacity(parseInt(this.value, 10));
        };
        opSlider.oninput = function () {
            var display = el("opacity-display");
            if (display) display.innerHTML = this.value + "%";
        };
    }

    el("tooltip-track").onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        var chk = el("chk-tooltips");
        chk.checked = !chk.checked;
        tooltipsEnabled = chk.checked;
        syncTooltipToggle();
        return false;
    };

    el("mask-track").onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        var chk = el("chk-mask-inputs");
        chk.checked = !chk.checked;
        maskInputsEnabled = chk.checked;
        syncMaskToggle();
        return false;
    };

    el("aot-track").onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        var chk = el("chk-always-on-top");
        chk.checked = !chk.checked;
        alwaysOnTop = chk.checked;
        syncAOTToggle(false);
        return false;
    };

    el("lang-opt-ru").onclick = function () { selectLang("ru"); };
    el("lang-opt-en").onclick = function () { selectLang("en"); };

    /* Show/hide hotkey controls */
    el("sh-btn-capture").onclick = function () { startShowHideCapture(); };
    el("sh-toggle-track").onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        showHideEn = !showHideEn;
        syncShowHideUI();
        if (el("__cfg_sh_en")) el("__cfg_sh_en").value = showHideEn ? "1" : "0";
        sendCmd("CMD:sh_hotkey_update");
        return false;
    };

    el("btn-tp-export").onclick = function () {
        flushThemePresetsOut();
        sendCmd("CMD:export_theme_presets");
    };
    el("btn-tp-import").onclick = function () {
        sendCmd("CMD:import_theme_presets");
    };

    el("tp-name-ok").onclick = confirmTPCreate;
    el("tp-name-cancel").onclick = cancelTPCreate;
    el("tp-name-inp").onkeydown = function (e) {
        e = e || window.event;
        if ((e.keyCode || e.which) === 13) confirmTPCreate();
        if ((e.keyCode || e.which) === 27) cancelTPCreate();
    };

    el("inp-preset-name").onkeydown = function (e) {
        e = e || window.event;
        if ((e.keyCode || e.which) === 13) confirmNewPreset();
        if ((e.keyCode || e.which) === 27) closePresetForm();
    };

    var titlebar = el("titlebar");

    titlebar.onmousedown = function (e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t.id === "btn-min" || t.id === "btn-close" || t.id === "btn-settings") return;
        if (e.button !== 0) return;

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

    /* Esc closes context menu, guide, settings overlays */
    document.onkeydown = function (e) {
        e = e || window.event;
        var key = e.key || e.keyCode;
        if (key === "Escape" || key === 27) {
            try { hideContextMenu(); ctxActionId = null; } catch(x){}
            try { closeGuide(); } catch(x){}
            try { closeSettings(); } catch(x){}
        }
    };

    initTooltips();

    /* Initialize enhancement features (Groups A-G) */
    initEnhancements();

    /* Initialize v1.7 features (context menu, multi-select, grid, etc.) */
    initV17Features();

    /* Color Picker bindings */
    var cpCanvas = el("cpicker-canvas");
    if (cpCanvas) {
        cpCanvas.onmousedown = function(e) {
            e = e || window.event;
            if (!cpState.active) return;
            var c   = cpCanvasCoords(e);
            var mx  = c.x, my = c.y;
            var hit = false;

            /* SV square — priority over hue strip */
            if (mx >= CP_SV_X && mx <= CP_SV_X + CP_SV_W &&
                my >= CP_SV_Y && my <= CP_SV_Y + CP_SV_H) {
                cpState.draggingSV = true;
                updateCPSVFromEvent(e);
                hit = true;
            /* Hue strip — slightly expanded tap target */
            } else if (mx >= CP_HUE_X && mx <= CP_HUE_X + CP_HUE_W &&
                       my >= CP_HUE_Y - 4 && my <= CP_HUE_Y + CP_HUE_H + 4) {
                cpState.draggingHue = true;
                updateCPHueFromEvent(e);
                hit = true;
            }
            if (hit) {
                cpBindDocEvents();
                if (cpCanvas.setCapture) {
                    try { cpCanvas.setCapture(); } catch(x){}
                }
                try { e.returnValue = false; } catch(x){}
                return false;
            }
        };
        cpCanvas.onmousemove = function(e) {
            e = e || window.event;
            if (!cpState.active) return;

            var c2 = cpCanvasCoords(e);
            var mx = c2.x, my = c2.y;
            var inSV  = (mx >= CP_SV_X  && mx <= CP_SV_X  + CP_SV_W  && my >= CP_SV_Y       && my <= CP_SV_Y + CP_SV_H);
            var inHue = (mx >= CP_HUE_X && mx <= CP_HUE_X + CP_HUE_W && my >= CP_HUE_Y - 4  && my <= CP_HUE_Y + CP_HUE_H + 4);

            if (cpState.draggingHue || cpState.draggingSV || inSV || inHue) {
                cpCanvas.style.cursor = "crosshair";
            } else {
                cpCanvas.style.cursor = "default";
            }

            if (cpState.draggingHue) {
                updateCPHueFromEvent(e);
                try { e.returnValue = false; } catch(x){}
                return false;
            }
            if (cpState.draggingSV) {
                updateCPSVFromEvent(e);
                try { e.returnValue = false; } catch(x){}
                return false;
            }
        };
    }

    el("cpicker-ok").onclick = function() { closeColorPicker(true); };
    el("cpicker-cancel").onclick = function() { closeColorPicker(false); };
    el("cpicker-close").onclick = function() { closeColorPicker(false); };
    el("cpicker-overlay").onclick = function(e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t && t.id === "cpicker-overlay") closeColorPicker(false);
    };
    el("cpicker-hex").onchange = function() {
        var hex = normalizeHex(this.value, "#FFFFFF");
        this.value = hex;
        var prev = el("cpicker-preview");
        if (prev) prev.style.background = hex;
        var rgb = hexToRgb(hex);
        var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        cpState.hue = hsv.h;
        cpState.sat = hsv.s;
        cpState.val = hsv.v;
        drawCP();
    };

    /* Theme Presets Manager bindings */
    el("btn-manage-presets").onclick = openTPManager;
    el("tp-close").onclick = function() { closeTPManager(true); };
    el("btn-tp-cancel").onclick = function() { closeTPManager(false); };
    el("btn-tp-done").onclick = function() { closeTPManager(true); };
    el("btn-tp-save").onclick = saveCurrentAsThemePreset;
    el("tp-overlay").onclick = function(e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t && t.id === "tp-overlay") closeTPManager(true);
    };

    /* Preset Groups Manager bindings */
    el("btn-groups").onclick = openGroupsManager;
    el("grp-close").onclick = function () { closeGroupsManager(); };
    el("grp-overlay").onclick = function (e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t && t.id === "grp-overlay") closeGroupsManager();
    };

    /* Export modal bindings */
    el("export-close").onclick = closeExportModal;
    el("export-cancel").onclick = closeExportModal;
    el("export-overlay").onclick = function (e) {
        e = e || window.event;
        var t = e.target || e.srcElement;
        if (t && t.id === "export-overlay") closeExportModal();
    };
    el("export-mode-presets").onclick = function () {
        exportMode = "presets";
        syncExportModeUI();
        updateExportConfirmState();
    };
    el("export-mode-group").onclick = function () {
        exportMode = "group";
        syncExportModeUI();
        updateExportConfirmState();
    };
    el("export-select-all").onclick = function () {
        var S = STRINGS[currentLang] || STRINGS.ru;
        var allOn = true;
        for (var i = 0; i < presets.length; i++) {
            if (!exportSelectedIds[presets[i].id]) { allOn = false; break; }
        }
        for (var j = 0; j < presets.length; j++) exportSelectedIds[presets[j].id] = !allOn;
        renderExportPresetList();
        updateExportConfirmState();
        el("export-select-all").innerHTML = "";
        el("export-select-all").appendChild(document.createTextNode(
            !allOn ? (S.exportSelectNone || "Снять всё") : (S.exportSelectAll || "Выбрать все")
        ));
    };
    el("export-confirm").onclick = performExport;
    el("grp-new-color-swatch").onclick = function () {
        var sw = el("grp-new-color-swatch");
        openGroupColorPicker(newGroupDraftColor, "grp-new-color-swatch", function (hex) {
            newGroupDraftColor = hex;
            sw.style.background = hex;
        });
    };
    el("grp-add-ok").onclick = confirmAddGroup;
    el("grp-name-inp").onkeydown = function (e) {
        e = e || window.event;
        var k = e.keyCode || e.which;
        if (k === 13) confirmAddGroup();
    };
};

/* ============================================================
   THEME PRESETS MANAGER
   ============================================================ */
function openTPManager() {
    /* Ensure button texts are in the current language before showing */
    var S = STRINGS[currentLang] || STRINGS.ru;
    var bts = el("btn-tp-save"); if (bts) { try { bts.innerText = S.cpSaveColors; } catch(e) { bts.innerHTML = S.cpSaveColors; } }
    var btc = el("btn-tp-cancel"); if (btc) { try { btc.innerText = S.cpCancel; } catch(e) { btc.innerHTML = S.cpCancel; } }
    var btd = el("btn-tp-done"); if (btd) { try { btd.innerText = S.cpDone; } catch(e) { btd.innerHTML = S.cpDone; } }

    tpRestore = {
        mode: themeMode,
        custom: {
            bg: customTheme.bg,
            surface: customTheme.surface,
            text: customTheme.text,
            accent: customTheme.accent
        }
    };
    renderTPGrid();
    var overlay = el("tp-overlay");
    overlay.style.display = "flex";
    setTimeout(function () {
        overlay.className = "tp-overlay tp-overlay-visible";
    }, 10);
}

function closeTPManager(keep) {
    var overlay = el("tp-overlay");
    overlay.className = "tp-overlay";
    setTimeout(function () {
        overlay.style.display = "none";
    }, 220);

    if (!keep && tpRestore) {
        themeMode = tpRestore.mode;
        customTheme.bg = tpRestore.custom.bg;
        customTheme.surface = tpRestore.custom.surface;
        customTheme.text = tpRestore.custom.text;
        customTheme.accent = tpRestore.custom.accent;
        syncThemeControls();
        applyTheme();
        syncColorPickers();
    }
    tpRestore = null;
}

function renderTPGrid() {
    var grid = el("tp-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (var i = 0; i < THEME_PRESETS.length; i++) {
        grid.appendChild(buildTPChip(THEME_PRESETS[i], false));
    }
    for (var i = 0; i < userThemePresets.length; i++) {
        grid.appendChild(buildTPChip(userThemePresets[i], true));
    }
}

function buildTPChip(p, isUser) {
    /* Wrapper so we can position delete button outside the chip */
    var wrap = document.createElement("div");
    wrap.className = "tp-chip-wrap";
    wrap.id = "tp-chip-wrap-" + p.id;

    /* Preview thumbnail showing bg/surface/accent/text colors */
    var thumb = buildTPThumb(p);
    wrap.appendChild(thumb);

    var chip = document.createElement("button");
    chip.className = "tp-chip";
    chip.id = "tp-chip-" + p.id;
    /* Check if this preset is currently active */
    if (themeMode === "custom" && customTheme.bg === p.bg && customTheme.accent === p.accent && customTheme.surface === p.surface) {
        chip.className = "tp-chip tp-chip-active";
        thumb.style.boxShadow = "0 0 0 2px " + (p.accent || "#FFFFFF") + ", 0 0 12px " + ra_hex(p.accent || "#FFFFFF", 0.3);
    }
    chip.style.background = p.bg;
    chip.style.borderColor = p.accent;
    chip.style.color = p.text;

    var dot = document.createElement("span");
    if (p.gradientEnabled && p.gradientBg2 && p.gradientBg2 !== p.bg) {
        /* Wide gradient swatch: shows both colors of the gradient */
        dot.className = "tp-dot tp-grad-swatch";
        dot.style.background = "linear-gradient(90deg," + p.bg + " 0%," + p.gradientBg2 + " 100%)";
        dot.style.borderColor = p.accent;
    } else {
        dot.className = "tp-dot";
        dot.style.background = p.accent;
    }
    chip.appendChild(dot);

    var nameSpan = document.createElement("span");
    nameSpan.className = "tp-chip-name";
    nameSpan.appendChild(document.createTextNode(p.name));
    chip.appendChild(nameSpan);

    /* Gradient indicator badge */
    if (p.gradientEnabled) {
        var grdBadge = document.createElement("span");
        grdBadge.className = "tp-chip-grad";
        grdBadge.appendChild(document.createTextNode("GRD"));
        chip.appendChild(grdBadge);
    }

    chip.onclick = function (e) {
        e = e || window.event;
        if (pendingTPDeleteId) return;
        applyThemePreset(p);
    };

    wrap.appendChild(chip);

    if (isUser) {
        var del = document.createElement("button");
        del.className = "tp-chip-del";
        del.id = "tp-chip-del-" + p.id;
        del.innerHTML = "\u00D7";
        del.title = "";
        del.onclick = function (e) {
            e = e || window.event;
            cancelEv(e);
            if (pendingTPDeleteId === p.id) {
                clearTPDeleteConfirm();
                for (var i = 0; i < userThemePresets.length; i++) {
                    if (userThemePresets[i].id === p.id) {
                        userThemePresets.splice(i, 1);
                        renderTPGrid();
                        flushThemePresetsOut();
                        sendCmd("CMD:settings_save");
                        return;
                    }
                }
            } else {
                clearTPDeleteConfirm();
                pendingTPDeleteId = p.id;
                var delBtn = el("tp-chip-del-" + p.id);
                if (delBtn) {
                    delBtn.className = "tp-chip-del tp-chip-del-confirm";
                    delBtn.innerHTML = "?";
                }
                var chipEl = el("tp-chip-" + p.id);
                if (chipEl) chipEl.className = "tp-chip tp-chip-confirm";
                pendingTPDeleteTmr = setTimeout(clearTPDeleteConfirm, 2500);
            }
        };
        wrap.appendChild(del);
    }

    return wrap;
}

function saveCurrentAsThemePreset() {
    if (tpFormOpen) return;
    tpFormOpen = true;
    var form = el("tp-form");
    form.className = "tp-form open";
    el("tp-name-inp").value = "";
    try { el("tp-name-inp").focus(); } catch(e){}
}

function confirmTPCreate() {
    if (!tpFormOpen) return;
    var name = trim(el("tp-name-inp").value);
    if (!name) {
        try { el("tp-name-inp").focus(); } catch(e){}
        return;
    }
    var p = {
        id: uid(),
        name: name,
        bg: customTheme.bg,
        surface: customTheme.surface,
        text: customTheme.text,
        accent: customTheme.accent,
        gradientEnabled: !!customTheme.gradientEnabled,
        gradientBg2: customTheme.gradientBg2 || customTheme.bg,
        gradientAngle: customTheme.gradientAngle || 135
    };
    userThemePresets.push(p);
    cancelTPCreate();
    renderTPGrid();
    flushThemePresetsOut();
    sendCmd("CMD:settings_save");
}

function cancelTPCreate() {
    tpFormOpen = false;
    el("tp-form").className = "tp-form";
}

function clearTPDeleteConfirm() {
    if (pendingTPDeleteTmr) { clearTimeout(pendingTPDeleteTmr); pendingTPDeleteTmr = null; }
    if (pendingTPDeleteId) {
        var chipEl = el("tp-chip-" + pendingTPDeleteId);
        if (chipEl) chipEl.className = "tp-chip";
        var delBtn = el("tp-chip-del-" + pendingTPDeleteId);
        if (delBtn) { delBtn.className = "tp-chip-del"; delBtn.innerHTML = "\u00D7"; }
        pendingTPDeleteId = null;
    }
}

/* ============================================================
   PRESET GROUPS (FOLDERS) MANAGER
   ============================================================ */
function openGroupsManager() {
    newGroupDraftColor = GROUP_COLORS[groups.length % GROUP_COLORS.length];
    var sw = el("grp-new-color-swatch");
    if (sw) sw.style.background = newGroupDraftColor;
    var inp = el("grp-name-inp");
    if (inp) inp.value = "";

    renderGroupsManagerList();

    var overlay = el("grp-overlay");
    overlay.style.display = "flex";
    setTimeout(function () {
        overlay.className = "grp-overlay grp-overlay-visible";
    }, 10);
}

function closeGroupsManager() {
    var overlay = el("grp-overlay");
    overlay.className = "grp-overlay";
    setTimeout(function () {
        overlay.style.display = "none";
    }, 220);
    clearPendingGroupDelete();
    renamingGroupId = null;
}

/* ============================================================
   EXPORT MODAL — choose specific presets, or a whole group, to export
   ============================================================ */
var exportMode           = "presets"; /* "presets" | "group" */
var exportSelectedIds    = {};        /* presetId -> true     */
var exportSelectedGroupId = null;     /* group id | "ungrouped" | null */

function openExportModal() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    setText("export-title-text",   S.exportModalTitle  || "ЭКСПОРТ ПРЕСЕТОВ");
    setText("export-mode-presets", S.exportModePresets || "ПРЕСЕТЫ");
    setText("export-mode-group",   S.exportModeGroup   || "ГРУППА");
    setText("export-select-all",   S.exportSelectAll   || "Выбрать все");
    setText("export-cancel",       S.editCancelBtn      || "Отмена");

    exportMode = "presets";
    exportSelectedIds = {};
    for (var i = 0; i < presets.length; i++) exportSelectedIds[presets[i].id] = true;
    exportSelectedGroupId = groups.length ? groups[0].id : null;

    var groupTab = el("export-mode-group");
    if (groupTab) groupTab.style.display = groups.length ? "" : "none";

    syncExportModeUI();
    renderExportPresetList();
    renderExportGroupList();
    updateExportConfirmState();

    var overlay = el("export-overlay");
    overlay.style.display = "flex";
    setTimeout(function () {
        overlay.className = "export-overlay export-overlay-visible";
    }, 10);
}

function closeExportModal() {
    var overlay = el("export-overlay");
    overlay.className = "export-overlay";
    setTimeout(function () {
        overlay.style.display = "none";
    }, 220);
}

function syncExportModeUI() {
    var pTab = el("export-mode-presets"), gTab = el("export-mode-group");
    var pPanel = el("export-presets-panel"), gPanel = el("export-group-panel");
    if (pTab)   pTab.className   = "method-tab" + (exportMode === "presets" ? " method-tab-active" : "");
    if (gTab)   gTab.className   = "method-tab" + (exportMode === "group"   ? " method-tab-active" : "");
    if (pPanel) pPanel.style.display = exportMode === "presets" ? "" : "none";
    if (gPanel) gPanel.style.display = exportMode === "group"   ? "" : "none";
}

function renderExportPresetList() {
    var list = el("export-preset-list");
    if (!list) return;
    list.innerHTML = "";
    var S = STRINGS[currentLang] || STRINGS.ru;

    if (!presets.length) {
        var empty = document.createElement("div");
        empty.className = "export-empty";
        empty.appendChild(document.createTextNode(S.exportEmptyPresets || "Нет пресетов для экспорта"));
        list.appendChild(empty);
        return;
    }

    for (var i = 0; i < presets.length; i++) {
        list.appendChild(buildExportPresetRow(presets[i]));
    }
}

function buildExportPresetRow(p) {
    var row = document.createElement("div");
    row.className = "export-preset-row";

    var box = document.createElement("span");
    box.className = "export-checkbox" + (exportSelectedIds[p.id] ? " export-checkbox-on" : "");

    var name = document.createElement("span");
    name.className = "preset-name";
    name.appendChild(document.createTextNode(p.name));

    var sub = document.createElement("span");
    sub.className = "preset-sub";
    if ((p.method || 1) === 2) {
        sub.appendChild(document.createTextNode("SC " + abbrev(p.linkCode, 8)));
    } else {
        sub.appendChild(document.createTextNode("ID " + abbrev(p.placeId, 8)));
    }

    row.appendChild(box);
    row.appendChild(name);
    row.appendChild(sub);

    row.onclick = function () {
        exportSelectedIds[p.id] = !exportSelectedIds[p.id];
        box.className = "export-checkbox" + (exportSelectedIds[p.id] ? " export-checkbox-on" : "");
        updateExportConfirmState();
    };
    return row;
}

function renderExportGroupList() {
    var wrap = el("export-group-list");
    if (!wrap) return;
    wrap.innerHTML = "";
    var S = STRINGS[currentLang] || STRINGS.ru;

    if (!groups.length) {
        var empty = document.createElement("div");
        empty.className = "export-empty";
        empty.appendChild(document.createTextNode(S.exportEmptyGroups || "Нет групп"));
        wrap.appendChild(empty);
        return;
    }

    for (var i = 0; i < groups.length; i++) {
        wrap.appendChild(buildExportGroupChip(groups[i].color, groups[i].name, groups[i].id));
    }

    var hasUngrouped = false;
    for (var j = 0; j < presets.length; j++) {
        if (!presets[j].groupId) { hasUngrouped = true; break; }
    }
    if (hasUngrouped) {
        wrap.appendChild(buildExportGroupChip("#5A5A5A", S.ungroupedLabel || "Без группы", "ungrouped"));
    }
}

function buildExportGroupChip(color, label, groupKey) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "group-chip" + (exportSelectedGroupId === groupKey ? " group-chip-active" : "");

    var dot = document.createElement("span");
    dot.className = "group-chip-dot";
    dot.style.background = color;
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(label));

    chip.onclick = function () {
        exportSelectedGroupId = groupKey;
        renderExportGroupList();
        updateExportConfirmState();
    };
    return chip;
}

/* Returns the array of preset objects matching the current export selection */
function getExportSelection() {
    var out = [];
    if (exportMode === "group") {
        if (!exportSelectedGroupId) return out;
        for (var i = 0; i < presets.length; i++) {
            var p = presets[i];
            var inBucket = (exportSelectedGroupId === "ungrouped") ? !p.groupId : (p.groupId === exportSelectedGroupId);
            if (inBucket) out.push(p);
        }
    } else {
        for (var j = 0; j < presets.length; j++) {
            if (exportSelectedIds[presets[j].id]) out.push(presets[j]);
        }
    }
    return out;
}

function updateExportConfirmState() {
    var btn = el("export-confirm");
    if (!btn) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    var count = getExportSelection().length;
    btn.disabled = count === 0;
    btn.innerHTML = "";
    btn.appendChild(document.createTextNode((S.exportConfirmBtn || "Экспортировать") + (count ? " (" + count + ")" : "")));

    var cnt = el("export-selected-count");
    if (cnt) {
        if (exportMode === "presets") {
            cnt.style.display = "";
            cnt.innerHTML = "";
            var fmt = S.exportSelectedCount || function (n) { return n + " selected"; };
            cnt.appendChild(document.createTextNode(fmt(count)));
        } else {
            cnt.style.display = "none";
        }
    }
}

function performExport() {
    var sel = getExportSelection();
    if (!sel.length) return;
    try { el("__presets_out").value = JSON.stringify(sel); } catch (e) {}
    sendCmd("CMD:export_presets");
    /* __presets_out doubles as the live save channel too — AHK reads it
       within ~50ms of the command firing (its poll interval), well before
       its file-picker dialog even opens, so this filtered snapshot is
       safely captured by then. Restore the full list shortly after so any
       later save still persists everything, not just what we exported. */
    setTimeout(flushPresetsOut, 500);
    closeExportModal();
}

function renderGroupsManagerList() {
    var list = el("grp-list");
    if (!list) return;
    list.innerHTML = "";
    var S = STRINGS[currentLang] || STRINGS.ru;

    if (!groups.length) {
        var empty = document.createElement("div");
        empty.className = "grp-empty";
        empty.appendChild(document.createTextNode(S.noGroupsYet || "Группы пока не созданы"));
        list.appendChild(empty);
        return;
    }

    for (var i = 0; i < groups.length; i++) {
        list.appendChild(buildGroupManagerRow(groups[i]));
    }
}

function buildGroupManagerRow(g) {
    var row = document.createElement("div");
    row.className = "grp-row";
    row.id = "grp-row-" + g.id;

    var swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "grp-color-swatch";
    swatch.style.background = g.color;
    swatch.id = "grp-swatch-" + g.id;
    swatch.onclick = function () {
        openGroupColorPicker(g.color, swatch.id, function (hex) {
            g.color = hex;
            swatch.style.background = hex;
            persistGroups();
            renderPresets();
        });
    };

    var name = document.createElement("span");
    name.className = "grp-row-name";
    name.appendChild(document.createTextNode(g.name));
    name.ondblclick = function () { startGroupRename(g.id, name); };
    name.setAttribute("data-tooltip", (STRINGS[currentLang] || STRINGS.ru).renameTip);

    var cnt = document.createElement("span");
    cnt.className = "grp-row-count";
    var n = 0;
    for (var i = 0; i < presets.length; i++) if (presets[i].groupId === g.id) n++;
    cnt.appendChild(document.createTextNode(String(n)));

    var del = document.createElement("button");
    del.type = "button";
    del.className = "grp-row-del";
    del.innerHTML = "&#215;";
    del.id = "grp-del-" + g.id;
    del.onclick = function () { showGroupDeleteConfirm(g.id, del); };

    row.appendChild(swatch);
    row.appendChild(name);
    row.appendChild(cnt);
    row.appendChild(del);
    return row;
}

function openGroupColorPicker(initialHex, swatchElId, onApply) {
    el("grp-color-draft").value = initialHex || GROUP_COLORS[0];
    openColorPicker("grp-color-draft", swatchElId, onApply);
}

function startGroupRename(id, nameSpan) {
    if (renamingGroupId) return;
    renamingGroupId = id;
    var g = findGroup(id);

    var inp = document.createElement("input");
    inp.type = "text";
    inp.value = g ? g.name : "";
    inp.className = "grp-rename-inp";
    inp.maxLength = 24;
    inp.spellcheck = false;

    inp.onkeydown = function (e) {
        e = e || window.event;
        var k = e.keyCode || e.which;
        if (k === 13) confirmGroupRename(id, inp, nameSpan);
        if (k === 27) cancelGroupRename(inp, nameSpan);
    };
    inp.onblur = function () { confirmGroupRename(id, inp, nameSpan); };

    nameSpan.parentNode.insertBefore(inp, nameSpan);
    nameSpan.style.display = "none";
    try { inp.focus(); inp.select(); } catch (e) {}
}

function confirmGroupRename(id, inp, nameSpan) {
    if (!inp.parentNode) return;
    inp.onblur = null;
    var newName = trim(inp.value);
    inp.parentNode.removeChild(inp);
    nameSpan.style.display = "";
    renamingGroupId = null;
    if (!newName) return;
    var g = findGroup(id);
    if (g) {
        g.name = newName;
        nameSpan.innerHTML = "";
        nameSpan.appendChild(document.createTextNode(newName));
        persistGroups();
        renderPresets();
    }
}

function cancelGroupRename(inp, nameSpan) {
    if (!inp.parentNode) return;
    inp.onblur = null;
    inp.parentNode.removeChild(inp);
    nameSpan.style.display = "";
    renamingGroupId = null;
}

function showGroupDeleteConfirm(id, btn) {
    if (pendingGroupDeleteId === id) {
        clearPendingGroupDelete();
        deleteGroup(id);
        return;
    }
    clearPendingGroupDelete();
    pendingGroupDeleteId = id;
    var S = STRINGS[currentLang] || STRINGS.ru;
    btn.innerHTML = S.sureText || "?";
    btn.className = "grp-row-del grp-row-del-confirm";
    pendingGroupDeleteTmr = setTimeout(clearPendingGroupDelete, 2500);
}

function clearPendingGroupDelete() {
    if (pendingGroupDeleteTmr) { clearTimeout(pendingGroupDeleteTmr); pendingGroupDeleteTmr = null; }
    if (pendingGroupDeleteId) {
        var btn = el("grp-del-" + pendingGroupDeleteId);
        if (btn) { btn.innerHTML = "&#215;"; btn.className = "grp-row-del"; }
        pendingGroupDeleteId = null;
    }
}

function deleteGroup(id) {
    for (var i = 0; i < groups.length; i++) {
        if (groups[i].id === id) { groups.splice(i, 1); break; }
    }
    /* Presets that belonged to this group fall back to "ungrouped" */
    for (var j = 0; j < presets.length; j++) {
        if (presets[j].groupId === id) delete presets[j].groupId;
    }
    if (activeGroupFilter === id) activeGroupFilter = "all";
    delete collapsedGroups[id];
    persistGroups();
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:save_preset");
    renderGroupsManagerList();
    renderPresets();
}

function confirmAddGroup() {
    var inp = el("grp-name-inp");
    var name = trim(inp ? inp.value : "");
    if (!name) { try { inp.focus(); } catch (e) {} return; }
    var g = { id: uid(), name: name, color: newGroupDraftColor };
    groups.push(g);
    if (inp) inp.value = "";
    newGroupDraftColor = GROUP_COLORS[groups.length % GROUP_COLORS.length];
    var sw = el("grp-new-color-swatch");
    if (sw) sw.style.background = newGroupDraftColor;
    persistGroups();
    renderGroupsManagerList();
    renderPresets();
    try { inp.focus(); } catch (e) {}
}

function persistGroups() {
    flushGroupsOut();
    setDirty();
    sendCmd("CMD:save_preset_groups");
}

/* ── Chip filter bar (shown above the preset list once ≥1 group exists) ── */
function renderGroupFilterBar() {
    var bar = el("group-filter-bar");
    if (!bar) return;
    if (!groups.length) {
        bar.style.display = "none";
        bar.innerHTML = "";
        return;
    }
    bar.style.display = "";
    bar.innerHTML = "";
    var S = STRINGS[currentLang] || STRINGS.ru;

    bar.appendChild(buildGroupFilterChip(null, S.allGroupsLabel || "Все", "all"));
    for (var i = 0; i < groups.length; i++) {
        bar.appendChild(buildGroupFilterChip(groups[i].color, groups[i].name, groups[i].id));
    }

    var hasUngrouped = false;
    for (var j = 0; j < presets.length; j++) {
        if (!presets[j].groupId) { hasUngrouped = true; break; }
    }
    if (hasUngrouped) {
        bar.appendChild(buildGroupFilterChip("#5A5A5A", S.ungroupedLabel || "Без группы", "ungrouped"));
    }
}

function buildGroupFilterChip(color, label, filterKey) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "group-chip" + (activeGroupFilter === filterKey ? " group-chip-active" : "");
    if (color) {
        var dot = document.createElement("span");
        dot.className = "group-chip-dot";
        dot.style.background = color;
        chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(label));
    chip.onclick = function () {
        activeGroupFilter = filterKey;
        renderPresets();
    };
    return chip;
}

/* ============================================================
   BUTTON HANDLERS
   ============================================================ */
function creditPresetLaunch(id) {
    for (var j = 0; j < presets.length; j++) {
        if (presets[j].id === id) {
            presets[j].launches   = (presets[j].launches || 0) + 1;
            presets[j].lastLaunch = Date.now();
            break;
        }
    }
    renderPresets();
    flushPresetsOut();
}

function onLaunch() {
    if (isLaunching) {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
        isLaunching = false;
        var S0 = STRINGS[currentLang];
        var btn0 = el("btn-launch");
        btn0.innerHTML = S0.launchBtn;
        btn0.className = "btn-primary";
        return;
    }
    isLaunching = true;
    var placeId, linkCode;
    if (currentMethod === 2) {
        placeId  = "";
        linkCode = trim(el("inp-share-code").value);
        /* Strip full URL if user pasted it — extract code value */
        var m2 = linkCode.match(/[?&]code=([A-Za-z0-9]+(?:&type=Server)?)/i);
        if (m2) linkCode = m2[1];
    } else {
        placeId  = trim(el("inp-place").value);
        linkCode = trim(el("inp-link").value);
    }
    /* Also sync the hidden bridge inputs so AHK ReadDom gets the right values */
    if (el("inp-place"))      el("inp-place").value = placeId;
    if (el("inp-link"))       el("inp-link").value  = linkCode;
    if (el("__cfg_method"))   el("__cfg_method").value = String(currentMethod);

    var targetId = lastLoadedPresetId;
    if (targetId) {
        var lp = findPreset(targetId);
        if (!lp || lp.placeId !== placeId || lp.linkCode !== linkCode) targetId = null;
    }
    if (!targetId) {
        for (var i = 0; i < presets.length; i++) {
            if (presets[i].placeId === placeId && presets[i].linkCode === linkCode) {
                targetId = presets[i].id; break;
            }
        }
    }
    function doLaunch() {
        isLaunching = false;
        countdownTimer = null;
        if (targetId) {
            creditPresetLaunch(targetId);
        }
        flushPresetsOut();
        clearDirty();  /* Launch saves state, so dirty flag is cleared */
        sendCmd("CMD:launch");
        triggerLaunchAnim();
    }
    if (launchDelay <= 0) { doLaunch(); return; }
    var remaining = launchDelay;
    var btn = el("btn-launch");
    var S = STRINGS[currentLang];
    btn.className = "btn-primary launching countdown";
    btn.innerHTML = S.launchCountdown(remaining);
    countdownTimer = setInterval(function () {
        remaining--;
        if (remaining <= 0) { clearInterval(countdownTimer); doLaunch(); }
        else { btn.innerHTML = S.launchCountdown(remaining); }
    }, 1000);
}


/* Live DOM measurement ---------------------------------------------------
   The old formula derived listH/srchH from presets.length alone. That broke
   the moment groups entered the picture: a sectioned view adds header rows
   the formula never knew about (under-allocates → buttons clipped), and an
   active group filter shrinks the visible row count without changing
   presets.length (over-allocates → big dead gap before the buttons).
   Reading the real rendered height back from the DOM can't drift out of
   sync with what's on screen, because it *is* what's on screen. This is
   safe for these specific containers because none of them animate their
   display/height (toggled instantly via style.display / style.height), so
   there's no risk of reading a mid-transition value. */
function liveHeight(elId, extraMargin) {
    var node = el(elId);
    if (!node || node.style.display === "none") return 0;
    var h = node.offsetHeight;
    return h > 0 ? h + (extraMargin || 0) : 0;
}

function calcWindowHeight() {
    var listH = liveHeight("presets-list");
    var emptyH = liveHeight("empty-state", 0);
    var srchH = liveHeight("search-wrap", 6);
    var frmH  = formOpen ? FORM_H : 0;
    var grpH  = liveHeight("group-filter-bar", 8);
    /* sort bar: full or collapsed, whichever is visible */
    var sortH = sortBarCollapsed
        ? liveHeight("sort-collapsed", 6)
        : liveHeight("sort-bar", 8);
    var statusH = liveHeight("status-bar", 8);
    var methodOffset = (currentMethod === 2) ? 55 : 0;
    /* Compact mode: reduce fixed height since elements are smaller */
    var compactOffset = compactMode ? 70 : 0;
    /* Use empty-state height when no presets, list height otherwise */
    var contentH = (listH > 0) ? listH : emptyH;
    return FIXED_H - methodOffset - compactOffset + srchH + contentH + frmH + grpH + sortH + statusH;
}

function sendResize() {
    var h = calcWindowHeight();
    var w = Math.round(BASE_W * uiScale);
    var scaledH = Math.round(h * uiScale);
    el("__resize_req").value = w + "x" + scaledH;
    sendCmd("CMD:resize");
    /* Re-publish titlebar metrics after resize so WM_NCHITTEST stays
       accurate at the new scale. Delayed to let layout settle. */
    setTimeout(function() { publishTitlebarMetrics(); }, 60);
}

function applyScale(s) {
    uiScale = s;
    document.body.style.width = BASE_W + "px";
    document.documentElement.style.height = "auto";
    document.body.style.height = "auto";
    setBodyScale(s);
    el("__cfg_scale").value = s.toString();
    syncScaleButtons();
    sendResize();
    /* Metrics refresh is triggered by sendResize above */
}

function applySavedScale() {
    document.body.style.width = BASE_W + "px";
    document.documentElement.style.height = "auto";
    document.body.style.height = "auto";
    setBodyScale(uiScale);
}

function setBodyScale(s) {
    var t = "scale(" + s + ")";
    document.body.style.msTransform = t;
    document.body.style.transform = t;
    document.body.style.msTransformOrigin = "top left";
    document.body.style.transformOrigin = "top left";
}

function syncScaleButtons() {
    var opts = [
        {id:"scale-opt-1", val:1.0 },
        {id:"scale-opt-2", val:1.15},
        {id:"scale-opt-3", val:1.30},
        {id:"scale-opt-4", val:1.50}
    ];
    for (var i = 0; i < opts.length; i++) {
        var btn = el(opts[i].id);
        if (!btn) continue;
        btn.className = (Math.abs(opts[i].val - uiScale) < 0.01)
            ? "theme-option active" : "theme-option";
    }
}

/* ── Show/Hide window hotkey ─────────────────────────────── */
var capturingShowHide = false;

function syncShowHideUI() {
    var keyEl = el("sh-key-box");
    if (keyEl) keyEl.value = showHideKey;
    var track = el("sh-toggle-track");
    var chk   = el("sh-chk-enabled");
    if (track) track.className = "toggle-track" + (showHideEn ? " on" : "");
    if (chk)   chk.checked = !!showHideEn;
}

function startShowHideCapture() {
    if (capturingShowHide) return;
    capturingShowHide = true;
    var btn = el("sh-btn-capture");
    var S = STRINGS[currentLang] || STRINGS.ru;
    if (btn) { btn.innerHTML = S.showHideCapturing; btn.className = "btn-capture capturing"; }
    sendCmd("CMD:sh_capture_start");
}

function stopShowHideCaptureExternal(keyName) {
    capturingShowHide = false;
    var btn = el("sh-btn-capture");
    var S = STRINGS[currentLang] || STRINGS.ru;
    if (btn) { btn.innerHTML = S.showHideCapture; btn.className = "btn-capture"; }
    if (keyName) {
        showHideKey = keyName;
        showHideEn  = true;
        syncShowHideUI();
        if (el("__cfg_sh_key")) el("__cfg_sh_key").value = keyName;
        if (el("__cfg_sh_en"))  el("__cfg_sh_en").value  = "1";
        sendCmd("CMD:sh_hotkey_update");
    }
}
var OPACITY_OPTS = [
    {id:"op-opt-1", pct:50 },
    {id:"op-opt-2", pct:65 },
    {id:"op-opt-3", pct:80 },
    {id:"op-opt-4", pct:100}
];

function applyOpacity(pct) {
    pct = Math.max(10, Math.min(100, pct));
    uiOpacity = Math.round(pct * 2.55);
    if (el("__cfg_opacity")) el("__cfg_opacity").value = uiOpacity.toString();
    syncOpacityButtons();
    sendCmd("CMD:set_opacity");
}

function syncOpacityButtons() {
    var curPct = Math.round(uiOpacity / 2.55);
    for (var i = 0; i < OPACITY_OPTS.length; i++) {
        var btn = el(OPACITY_OPTS[i].id);
        if (!btn) continue;
        btn.className = (Math.abs(OPACITY_OPTS[i].pct - curPct) < 3)
            ? "theme-option active" : "theme-option";
    }
    /* Keep slider in sync */
    var slider = el("opacity-slider");
    if (slider) slider.value = Math.round(uiOpacity / 2.55).toString();
    var display = el("opacity-display");
    if (display) display.innerHTML = Math.round(uiOpacity / 2.55) + "%";
}

function triggerLaunchAnim() {
    var btn = el("btn-launch");
    var S = STRINGS[currentLang];
    btn.className = "btn-primary launching";
    btn.innerHTML = S.launchBtn;
    setTimeout(function () {
        btn.innerHTML = S.launchBtn;
        btn.className = "btn-primary";
    }, 1200);
}

function syncAutoMinToggle() {
    var track = el("auto-min-track");
    if (!track) return;
    track.className = autoMinimize ? "toggle-track on" : "toggle-track";
    var chk = el("chk-auto-minimize");
    if (chk) chk.checked = autoMinimize;
    el("__cfg_auto_minimize").value = autoMinimize ? "1" : "0";
    var wrap = track.parentNode;
    if (wrap) wrap.className = autoMinimize ? "chk-wrap chk-on" : "chk-wrap";
}

function syncDelayDisplay() {
    var disp = el("delay-display");
    if (!disp) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    var unit = (S && S.launchDelayUnit) ? S.launchDelayUnit : "с";
    disp.textContent = launchDelay + unit;
    var minusBtn = el("delay-minus");
    var plusBtn  = el("delay-plus");
    if (minusBtn) minusBtn.disabled = (launchDelay <= 0);
    if (plusBtn)  plusBtn.disabled  = (launchDelay >= 60);
}

function syncTooltipToggle() {
    var track = el("tooltip-track");
    if (!track) return;
    track.className = tooltipsEnabled ? "toggle-track on" : "toggle-track";
    var chk = el("chk-tooltips");
    if (chk) chk.checked = tooltipsEnabled;
    el("__cfg_tooltips").value = tooltipsEnabled ? "1" : "0";
    var wrap = track.parentNode;
    if (wrap) wrap.className = tooltipsEnabled ? "chk-wrap chk-on" : "chk-wrap";

    // Strip native title attributes to prevent double tooltips
    var all = document.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) {
        if (all[i].getAttribute && all[i].getAttribute("data-tooltip")) {
            all[i].removeAttribute("title");
        }
    }
    // Bind or unbind DOM handlers so disabled = zero overhead
    if (tooltipsEnabled) {
        bindTooltipHandlers();
    } else {
        unbindTooltipHandlers();
    }
}

/* Mirrors syncTooltipToggle for the "mask input fields" setting — applies
   the password-style masking and shows/hides the per-field eye buttons. */
function syncMaskToggle() {
    var track = el("mask-track");
    if (!track) return;
    track.className = maskInputsEnabled ? "toggle-track on" : "toggle-track";
    var chk = el("chk-mask-inputs");
    if (chk) chk.checked = maskInputsEnabled;
    if (el("__cfg_mask_inputs")) el("__cfg_mask_inputs").value = maskInputsEnabled ? "1" : "0";
    var wrap = track.parentNode;
    if (wrap) wrap.className = maskInputsEnabled ? "chk-wrap chk-on" : "chk-wrap";
    applyMaskInputs();
}

/* Mirrors syncAutoMinToggle for the "always on top" setting. Unlike the
   purely-cosmetic toggles above, this needs the AHK host to actually pin
   the window — skipCmd=true is used on initial load where the host already
   applies the saved state itself while injecting config. */
function syncAOTToggle(skipCmd) {
    var track = el("aot-track");
    if (!track) return;
    track.className = alwaysOnTop ? "toggle-track on" : "toggle-track";
    var chk = el("chk-always-on-top");
    if (chk) chk.checked = alwaysOnTop;
    if (el("__cfg_always_on_top")) el("__cfg_always_on_top").value = alwaysOnTop ? "1" : "0";
    var wrap = track.parentNode;
    if (wrap) wrap.className = alwaysOnTop ? "chk-wrap chk-on" : "chk-wrap";
    if (!skipCmd) sendCmd("CMD:set_always_on_top");
}

function onSaveClose() {
    flushPresetsOut();
    clearDirty();
    sendCmd("CMD:save_close");
}

function onMinimize() {
    flushPresetsOut();
    clearDirty();
    sendCmd("CMD:minimize");
}

/* ============================================================
   SETTINGS / THEMES
   ============================================================ */
function openSettings() {
    syncThemeControls();
    syncLangButtons();

    /* IE11: flex: 1 1 auto uses content height as basis, breaking layout.
       flex-basis: 0px forces IE11 to allocate remaining space correctly.
       Restore footer to flex flow (remove absolute hack). */
    var winH   = calcWindowHeight();

    /* Strip preset-list/empty-state contribution so the modal doesn't grow
       taller than the base window when there are many presets or when
       the list is empty (empty-state would inflate the calculated height). */
    var _listH     = liveHeight("presets-list");
    var _emptyH    = liveHeight("empty-state", 0);
    var _srchH     = liveHeight("search-wrap", 6);
    var _frmH      = formOpen ? FORM_H : 0;
    var _grpH      = liveHeight("group-filter-bar", 8);
    var _sortH     = sortBarCollapsed
        ? liveHeight("sort-collapsed", 6)
        : liveHeight("sort-bar", 8);
    var _statusH   = liveHeight("status-bar", 8);
    /* Subtract whichever content area is visible (list or empty-state) */
    var _contentH  = (_listH > 0) ? _listH : _emptyH;
    var baseWinH   = winH - _contentH - _srchH - _frmH - _grpH - _sortH - _statusH;
    var modalH     = baseWinH - 40;

    var modal = el("settings-modal");
    var sb    = modal ? modal.querySelector(".settings-body")   : null;
    var ftrEl = modal ? modal.querySelector(".settings-footer") : null;

    if (modal) {
        modal.style.maxHeight = "";
        modal.style.height    = modalH + "px";
        modal.style.position  = "";
    }
    /* Restore footer to normal flex flow */
    if (ftrEl) {
        ftrEl.style.position = "";
        ftrEl.style.bottom   = "";
        ftrEl.style.left     = "";
        ftrEl.style.right    = "";
    }
    /* Override flex-basis to 0px so IE11 fills remaining space correctly */
    if (sb) {
        sb.style.height             = "";
        sb.style.maxHeight          = "";
        sb.style.msFlexPositive     = "1";
        sb.style.msFlexNegative     = "1";
        sb.style.msFlexPreferredSize = "0px";
        sb.style.flexGrow           = "1";
        sb.style.flexShrink         = "1";
        sb.style.flexBasis          = "0px";
    }

    var overlay = el("settings-overlay");
    overlay.style.height  = winH + "px";
    overlay.style.display = "flex";
    overlay.style.display = "flex";
    setTimeout(function () {
        overlay.className = "settings-overlay settings-overlay-visible";
    }, 10);
}

function closeSettings() {
    var overlay = el("settings-overlay");
    overlay.className = "settings-overlay";
    var modal = el("settings-modal");
    var sb    = modal ? modal.querySelector(".settings-body")   : null;
    var ftrEl = modal ? modal.querySelector(".settings-footer") : null;
    /* Clear inline styles only AFTER the transition ends — clearing them
       immediately causes a size flash while the overlay is still fading out. */
    setTimeout(function () {
        overlay.style.display = "none";
        if (modal)  { modal.style.height = ""; modal.style.position = ""; }
        if (ftrEl)  { ftrEl.style.position = ""; ftrEl.style.bottom = ""; ftrEl.style.left = ""; ftrEl.style.right = ""; }
        if (sb)     {
            sb.style.height = ""; sb.style.flexBasis = "";
            sb.style.msFlexPreferredSize = ""; sb.style.flexGrow = "";
            sb.style.flexShrink = ""; sb.style.msFlexPositive = ""; sb.style.msFlexNegative = "";
        }
    }, 220);
}

function saveSettings() {
    syncCustomFromInputs(true);
    syncThemeControls();
    applyTheme();
    flushThemePresetsOut();
    if (el("__cfg_lang"))    el("__cfg_lang").value    = currentLang;
    if (el("__cfg_opacity")) el("__cfg_opacity").value = uiOpacity.toString();
    if (el("__cfg_sh_key"))  el("__cfg_sh_key").value  = showHideKey;
    if (el("__cfg_sh_en"))   el("__cfg_sh_en").value   = showHideEn ? "1" : "0";
    if (el("__cfg_theme_grad_en"))    el("__cfg_theme_grad_en").value    = customTheme.gradientEnabled ? "1" : "0";
    if (el("__cfg_theme_grad_bg2"))   el("__cfg_theme_grad_bg2").value   = customTheme.gradientBg2;
    if (el("__cfg_theme_grad_angle")) el("__cfg_theme_grad_angle").value = (customTheme.gradientAngle || 135).toString();
    if (el("__cfg_launch_delay"))     el("__cfg_launch_delay").value     = launchDelay.toString();
    /* Enhancement: save compact mode and sort mode */
    if (el("__cfg_compact_mode")) el("__cfg_compact_mode").value = compactMode ? "1" : "0";
    if (el("__cfg_sort_mode"))    el("__cfg_sort_mode").value    = sortMode;
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

    syncGradientUI();
    updateSwatches();
    syncColorPickers();
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

    var gradEnChk = el("chk-gradient");
    if (gradEnChk) customTheme.gradientEnabled = gradEnChk.checked;
    customTheme.gradientBg2   = readColor("theme-grad-bg2", customTheme.gradientBg2, forceNormalize);
    var angleInp = el("theme-grad-angle");
    if (angleInp) {
        var a = parseInt(angleInp.value, 10);
        if (!isNaN(a)) customTheme.gradientAngle = Math.max(0, Math.min(360, a));
    }
    if (forceNormalize) {
        el("theme-bg").value = customTheme.bg;
        el("theme-surface").value = customTheme.surface;
        el("theme-text").value = customTheme.text;
        el("theme-accent").value = customTheme.accent;
        if (el("theme-grad-bg2")) el("theme-grad-bg2").value = customTheme.gradientBg2;
    }
}

function readColor(id, fallback, forceNormalize) {
    var raw = trim(el(id).value);
    if (isHex(raw)) return normalizeHex(raw, fallback);
    return forceNormalize ? fallback : fallback;
}

/* ============================================================
   LANGUAGE
   ============================================================ */
function selectLang(lang) {
    currentLang = (lang === "en") ? "en" : "ru";
    syncLangButtons();
    if (el("__cfg_lang")) el("__cfg_lang").value = currentLang;

    var overlay = el("settings-overlay");
    var isOpen  = overlay && overlay.style.display === "flex";

    if (isOpen) {
        /* Close → apply → reopen.
           Mutating many DOM elements inside the open settings-body
           causes IE11's flex+overflow:auto engine to collapse the
           scrollable area. Closing first avoids that entirely.      */
        closeSettings();
        setTimeout(function () {
            applyLanguage();
            openSettings();
        }, 240); /* slightly longer than the 220ms CSS close transition */
    } else {
        setTimeout(function () { applyLanguage(); }, 0);
    }
}

function syncLangButtons() {
    var ru = el("lang-opt-ru");
    var en = el("lang-opt-en");
    if (!ru || !en) return;
    ru.className = (currentLang === "ru") ? "theme-option active" : "theme-option";
    en.className = (currentLang === "en") ? "theme-option active" : "theme-option";
}

function applyLanguage() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    syncLangButtons();

    /* ── Title bar tooltips ── */
    setTip("btn-settings", S.tipSettings);
    setTip("btn-min",      S.tipMinimize);
    setTip("btn-close",    S.tipClose);

    /* ── Main labels ── */
    setLabel("lbl-place",   S.labelPlace);
    setLabel("lbl-link",    S.labelLink);
    setLabel("lbl-hotkey",  S.labelHotkey);
    setLabel("lbl-presets", S.labelPresets);

    /* ── Field clear (×) buttons ── */
    setTip("clr-place",       S.clearFieldTip);
    setTip("clr-link",        S.clearFieldTip);
    setTip("clr-share-code",  S.clearFieldTip);

    /* ── Hotkey area ── */
    setText("chk-txt-hotkey", S.enableHotkey);

    /* ── Capture button (only if not mid-capture) ── */
    if (!capturingKey) {
        var capBtn = el("btn-capture");
        if (capBtn) capBtn.innerHTML = S.captureBtn;
    }

    /* ── Action buttons ── */
    var lb = el("btn-launch");
    if (lb) lb.innerHTML = S.launchBtn;
    var sb = el("btn-save");
    if (sb) sb.innerHTML = S.saveCloseBtn;
    var ap = el("btn-add-preset");
    if (ap) ap.innerHTML = S.addPresetBtn;

    /* ── Section button tooltips ── */
    setTip("btn-guide",  S.tipGuide);
    setTip("btn-export", S.tipExport);
    setTip("btn-import", S.tipImport);
    setTip("btn-groups", S.tipGroups);

    var grpTitle = el("grp-title-text");
    if (grpTitle) grpTitle.textContent = S.groupsModalTitle;
    var grpNameInp = el("grp-name-inp");
    if (grpNameInp) grpNameInp.setAttribute("placeholder", S.groupNamePh);
    renderGroupsManagerList();
    renderGroupFilterBar();

    /* ── Search placeholder ── */
    var si = el("search-inp");
    if (si) si.setAttribute("placeholder", S.searchPh);

    /* ── Preset name form placeholder ── */
    var pni = el("inp-preset-name");
    if (pni) pni.setAttribute("placeholder", S.presetNamePh);

    /* ── Settings modal ── */
    setText("settings-title-text", S.settingsTitle);
    setLabel("lbl-lang-setting",   S.langLabel);
    var lru = el("lang-opt-ru"); if (lru) lru.innerHTML = S.langRu;
    var len = el("lang-opt-en"); if (len) len.innerHTML = S.langEn;

    setLabel("lbl-theme-setting",  S.themeLabel);
    var tdo = el("theme-opt-dark");   if (tdo) tdo.innerHTML = S.themeDark;
    var tlo = el("theme-opt-light");  if (tlo) tlo.innerHTML = S.themeLight;
    var tco = el("theme-opt-custom"); if (tco) tco.innerHTML = S.themeCustom;
    /* btn-manage-presets is a button — use innerHTML to preserve event handlers */
    var bmp = el("btn-manage-presets"); if (bmp) bmp.innerHTML = S.managePresetsBtn;
    setLabel("lbl-custom-colors",     S.customColorsLabel);
    setText("lbl-color-bg",           S.colorBg);
    setText("lbl-color-surface",      S.colorSurface);
    setText("lbl-color-text",         S.colorText);
    setText("lbl-color-accent",       S.colorAccent);
    setLabel("lbl-window-size",       S.windowSizeLabel);
    setLabel("lbl-opacity",           S.opacityLabel);
    setLabel("lbl-behavior",          S.behaviorLabel);
    setText("chk-txt-automin",        S.hideAfterLaunch);
    setText("chk-txt-tooltips",       S.showTooltips);
    setText("chk-txt-mask",           S.maskInputsLabel);
    setText("chk-txt-aot",            S.alwaysOnTopLabel);
    applyMaskInputs();

    /* Show/hide hotkey block */
    setLabel("lbl-showhide",          S.showHideLabel);
    setText("chk-txt-showhide",       S.showHideEnable);
    setLabel("lbl-gradient",   S.gradientLabel  || "ГРАДИЕНТ ФОНА");
    setLabel("lbl-grad-color2", S.gradientColor2 || "Цвет 2");
    setLabel("lbl-grad-angle", S.gradientAngle  || "УГОЛ");
    setText("lbl-launch-delay", S.launchDelayLabel || "Задержка запуска");
    syncDelayDisplay();
    setText("btn-factory-reset", S.factoryResetBtn || "Сбросить к заводским");
    setLabel("lbl-factory-reset", S.factoryResetLabel || "СБРОС");
    applyBulkLanguage();
    var shCapBtn = el("sh-btn-capture");
    if (shCapBtn && !capturingShowHide) shCapBtn.innerHTML = S.showHideCapture;
    setText("settings-save",          S.settingsSaveBtn);

    /* ── Color presets modal ── */
    setText("tp-title-text",    S.cpTitle);
    setText("btn-tp-save",      S.cpSaveColors);
    setText("btn-tp-cancel",    S.cpCancel);
    setText("btn-tp-done",      S.cpDone);
    var tni = el("tp-name-inp"); if (tni) tni.setAttribute("placeholder", S.cpNamePh);
    setTip("btn-tp-export",     S.tipExportTheme);
    setTip("btn-tp-import",     S.tipImportTheme);

    /* ── Color picker modal ── */
    setText("cpicker-title-text",   S.cpickerTitle);
    setText("cpicker-preview-text", S.cpickerPreview);
    setText("cpicker-hex-text",     S.cpickerHex);
    setText("cpicker-cancel",       S.cpickerCancel);
    setText("cpicker-ok",           S.cpickerOk);

    /* ── Color swatch tooltips ── */
    setTip("swatch-bg",      S.tipColorPick);
    setTip("swatch-surface", S.tipColorPick);
    setTip("swatch-text",    S.tipColorPick);
    setTip("swatch-accent",  S.tipColorPick);
    setTip("swatch-grad-bg2", S.tipColorPick);

    /* ── Guide ── */
    /* title + current page content updated via switchGuidePage */
    switchGuidePage(currentGuidePage);
    /* re-apply method tab labels */
    switchMethod(currentMethod);

    /* ── Re-render presets and status asynchronously to avoid
          IE11 flex layout collapse during synchronous DOM updates ── */
    setTimeout(function() {
        renderPresets();
        updateRobloxStatus();
    }, 0);

    /* Apply language to enhancement UI elements */
    applyEnhancementLanguage();
}

function setTip(id, text) {
    var node = el(id);
    if (node) node.setAttribute("data-tooltip", text);
}

/* Wires a "×" button to clear its sibling input. The button stays
   hidden until the field is hovered or focused (matches the row-hover
   reveal pattern used elsewhere — e.g. .preset-fav), so it doesn't
   clutter the field when not needed. */
function wireFieldClear(inp, btn) {
    if (!inp || !btn) return;
    var wrap = inp.parentNode;
    btn.onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        inp.value = "";
        try { inp.focus(); } catch (ignore) {}
    };
    if (wrap) {
        inp.onfocus = function () { wrap.className = "field-input-wrap field-clear-show"; };
        inp.onblur  = function () { wrap.className = "field-input-wrap"; };
    }
}

/* Wires the "eye" button that sits next to the clear (×) button on
   PLACE ID / LINK CODE / SHARE CODE. Clicking it reveals or re-hides
   that one field only — it doesn't change the global mask-inputs
   setting, just like a normal password-field reveal toggle. */
function wireFieldEye(inp, btn) {
    if (!inp || !btn) return;
    btn.onclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        if (!maskInputsEnabled) return false;
        var S = STRINGS[currentLang] || STRINGS.ru;
        var revealed = (inp.type === "text");
        inp.type = revealed ? "password" : "text";
        btn.className = revealed ? "field-eye" : "field-eye field-eye-active";
        btn.setAttribute("data-tooltip", revealed ? S.showFieldTip : S.hideFieldTip);
        try { inp.focus(); } catch (ignore) {}
        return false;
    };
}

/* Applies (or lifts) password-style masking on the PLACE ID / LINK CODE /
   SHARE CODE fields according to the global "mask inputs" setting. When
   masking is off the eye buttons are hidden and fields just stay as plain
   text — there's nothing to reveal/hide per-field anymore. */
function applyMaskInputs() {
    var ids    = ["inp-place", "inp-link", "inp-share-code"];
    var eyeIds = ["eye-place", "eye-link", "eye-share-code"];
    var S = STRINGS[currentLang] || STRINGS.ru;
    for (var i = 0; i < ids.length; i++) {
        var inp = el(ids[i]);
        var btn = el(eyeIds[i]);
        if (!inp) continue;
        if (maskInputsEnabled) {
            inp.type = "password";
            if (btn) {
                btn.style.display = "";
                btn.className = "field-eye";
                btn.setAttribute("data-tooltip", S.showFieldTip);
            }
        } else {
            inp.type = "text";
            if (btn) btn.style.display = "none";
        }
    }
}

/* Use innerText for plain-text updates — avoids IE11 flex layout collapse
   that occurs when using innerHTML="" + appendChild in sequence            */
function setLabel(id, text) {
    var node = el(id);
    if (!node) return;
    try { node.innerText = text; } catch(e) { node.innerHTML = text; }
}

function setText(id, text) {
    var node = el(id);
    if (!node) return;
    try { node.innerText = text; } catch(e) { node.innerHTML = text; }
}

function setHtml(id, html) {
    var node = el(id);
    if (node) node.innerHTML = html;
}

/* ── Guide page 1: Method 1 ─────────────────────────────── */
function buildGuidePage1HTML(S) {
    return '<div class="guide-step">' +
        '<span class="guide-num">1</span>' +
        '<span class="guide-text">' + S.guideStep1 + '</span>' +
        '</div>' +
        '<div class="guide-step">' +
        '<span class="guide-num">2</span>' +
        '<span class="guide-text">' + S.guideStep2 + '</span>' +
        '</div>' +
        '<div class="guide-step">' +
        '<span class="guide-num">3</span>' +
        '<span class="guide-text">' + S.guideStep3 + '</span>' +
        '</div>' +
        '<div class="guide-code">' +
        'https://www.roblox.com/games/<span class="guide-hl-place">107573139811370</span>&amp;Anime-Crusaders?privateServerLinkCode=<span class="guide-hl-link">99973430516258557046893313426143</span>' +
        '</div>' +
        '<div class="guide-step"><span class="guide-num">4</span>' +
        '<div class="guide-text">' + S.guideStep4 + '</div></div>' +
        '<div class="guide-step"><span class="guide-num">5</span>' +
        '<div class="guide-text">' + S.guideStep5 + '</div></div>';
}

/* ── Guide page 2: Method 2 ─────────────────────────────── */
function buildGuidePage2HTML(S) {
    return '<div class="guide-step"><span class="guide-num guide-num-m2">1</span>' +
        '<div class="guide-text">' + (S.guideM2Step1 || "") + '</div></div>' +

        '<div class="guide-step"><span class="guide-num guide-num-m2">2</span>' +
        '<div class="guide-text">' + (S.guideM2Step2 || "") + '</div></div>' +

        '<div class="guide-step"><span class="guide-num guide-num-m2">3</span>' +
        '<div class="guide-text">' + (S.guideM2Step3 || "") + '</div></div>' +

        '<div class="guide-code guide-code-m2">' +
        'https://www.roblox.com/share?code=<span class="guide-hl-link guide-hl-code">3df324408246e249a716375b04aaa777&amp;type=Server</span>' +
        '</div>' +

        '<div class="guide-step"><span class="guide-num guide-num-m2">4</span>' +
        '<div class="guide-text">' + (S.guideM2Step4 || "") + '</div></div>';
}

/* Kept for backward compatibility — now only renders page 1 */
function buildGuideHTML(S) { return buildGuidePage1HTML(S); }

/* ── Guide page navigation ───────────────────────────────── */
function switchGuidePage(page) {
    currentGuidePage = page;
    var S = STRINGS[currentLang] || STRINGS.ru;
    var p1 = el("guide-page-1");
    var p2 = el("guide-page-2");
    var titleEl = el("guide-modal-title");
    var indicator = el("guide-nav-indicator");
    var btnPrev = el("guide-nav-prev");
    var btnNext = el("guide-nav-next");

    if (p1) p1.style.display = (page === 1) ? "" : "none";
    if (p2) p2.style.display = (page === 2) ? "" : "none";

    if (page === 1) {
        if (p1) p1.innerHTML = buildGuidePage1HTML(S);
        if (titleEl) titleEl.innerHTML = S.guideMethod1Title || S.guideTitle;
    } else {
        if (p2) p2.innerHTML = buildGuidePage2HTML(S);
        if (titleEl) titleEl.innerHTML = S.guideMethod2ModalTitle || (S.guideMethod2Title || "METHOD 2");
    }
    if (indicator) indicator.innerHTML = page + " / 2";
    if (btnPrev)   btnPrev.disabled  = (page === 1);
    if (btnNext)   btnNext.disabled  = (page === 2);
}

/* ── Main-page method switching ─────────────────────────── */
function switchMethod(n) {
    currentMethod = n;
    var S = STRINGS[currentLang] || STRINGS.ru;

    var panel1 = el("method-panel-1");
    var panel2 = el("method-panel-2");
    var tab1   = el("method-tab-1");
    var tab2   = el("method-tab-2");

    if (panel1) panel1.style.display = (n === 1) ? "" : "none";
    if (panel2) panel2.style.display = (n === 2) ? "" : "none";

    if (tab1) tab1.className = "method-tab ir-tab" + (n === 1 ? " method-tab-active" : "");
    if (tab2) tab2.className = "method-tab ir-tab" + (n === 2 ? " method-tab-active" : "");

    /* Update tab labels from STRINGS (for language switch) */
    if (tab1 && S.methodTab1) tab1.innerHTML = S.methodTab1;
    if (tab2 && S.methodTab2) tab2.innerHTML = S.methodTab2;

    /* Update SHARE CODE label/placeholder */
    var shareLabel = el("lbl-share-code");
    var shareInp   = el("inp-share-code");
    if (shareLabel && S.shareCodeLabel)       shareLabel.innerHTML = S.shareCodeLabel;
    if (shareInp   && S.shareCodePlaceholder) shareInp.placeholder = S.shareCodePlaceholder;

    /* Persist method for AHK */
    var cfgMethod = el("__cfg_method");
    if (cfgMethod) cfgMethod.value = String(n);

    /* Resize window to fit active method — only after init is complete */
    if (appInitialized) sendResize();
}

function updateSwatches() {
    el("swatch-bg").style.backgroundColor = customTheme.bg;
    el("swatch-surface").style.backgroundColor = customTheme.surface;
    el("swatch-text").style.backgroundColor = customTheme.text;
    el("swatch-accent").style.backgroundColor = customTheme.accent;
    var sw2 = el("swatch-grad-bg2");
    if (sw2) sw2.style.backgroundColor = customTheme.gradientBg2 || customTheme.bg;
}

function applyTheme() {
    var cls = [];
    if (themeMode === "light") cls.push("theme-light");
    if (themeMode === "custom") cls.push("theme-custom");
    /* Enhancement: preserve compact-mode class when theme changes.
       applyTheme() used to overwrite body.className completely,
       which wiped out the compact-mode class added by applyCompactMode(). */
    if (compactMode) cls.push("compact-mode");

    document.documentElement.className = cls.join(" ");
    document.body.className = cls.join(" ");
    applyCustomThemeStyle();
}

function applyCustomThemeStyle() {
    var css = "";
    if (themeMode === "custom") {
        var B = customTheme.bg;
        var S = customTheme.surface;
        var T = customTheme.text;
        var A = customTheme.accent;

        // IE11-safe rgba helper (avoids #RRGGBBAA which IE doesn't parse)
        function ra(hex, alpha) {
            var r = parseInt(hex.substr(1, 2), 16);
            var g = parseInt(hex.substr(3, 2), 16);
            var b = parseInt(hex.substr(5, 2), 16);
            return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
        }

        var t15 = ra(T, 0.15), t20 = ra(T, 0.20), t25 = ra(T, 0.25);
        var t30 = ra(T, 0.30), t33 = ra(T, 0.33), t40 = ra(T, 0.40);
        var t47 = ra(T, 0.47), t50 = ra(T, 0.50), t53 = ra(T, 0.53);
        var t60 = ra(T, 0.60), t67 = ra(T, 0.67), t73 = ra(T, 0.73);
        var t80 = ra(T, 0.80);
        var a06 = ra(A, 0.06), a10 = ra(A, 0.10), a15 = ra(A, 0.15);
        var a20 = ra(A, 0.20), a27 = ra(A, 0.27), a33 = ra(A, 0.33);
        var a40 = ra(A, 0.40), a50 = ra(A, 0.50);

        // Build CSS rules array for readability
        var r = [];

        /* ---- Base ---- */
        if (customTheme.gradientEnabled && customTheme.gradientBg2 && customTheme.gradientBg2 !== B) {
            var ang = customTheme.gradientAngle || 135;
            var gradCSS = "linear-gradient(" + ang + "deg," + B + " 0%," + customTheme.gradientBg2 + " 100%)";
            r.push("html.theme-custom,body.theme-custom{background:" + gradCSS + ";color:" + T + "}");
            r.push("html.theme-custom,body.theme-custom{background-attachment:fixed}");
        } else {
            r.push("body.theme-custom{background:" + B + ";color:" + T + "}");
        }

        /* ---- Titlebar ---- */
        r.push("body.theme-custom .titlebar{background:" + S + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .tb-logo,body.theme-custom .tb-title{color:" + T + "}");
        r.push("body.theme-custom .tb-ver{color:" + t50 + "}");
        r.push("body.theme-custom .tc-btn{color:" + t47 + "}");
        r.push("body.theme-custom .tc-btn:hover{background:" + t20 + ";color:" + t80 + "}");
        r.push("body.theme-custom .tc-close:hover{background:#2A0A0A;color:#FF6666}");

        /* ---- Accent bar ---- */
        r.push("body.theme-custom .accent-bar{background:" + A + "}");
        r.push("body.theme-custom .accent-bar{background:-ms-linear-gradient(left," + B + " 0%," + a33 + " 20%," + A + " 50%," + a33 + " 80%," + B + " 100%)}");
        r.push("body.theme-custom .accent-bar{background:linear-gradient(to right," + B + " 0%," + a33 + " 20%," + A + " 50%," + a33 + " 80%," + B + " 100%)}");

        /* ---- Content ---- */
        r.push("body.theme-custom .content{background:transparent}");

        /* ---- Labels ---- */
        r.push("body.theme-custom .field-label,body.theme-custom .section-title,body.theme-custom .settings-label{color:" + t50 + "}");

        /* ---- Inputs ---- */
        r.push("body.theme-custom .field-input,body.theme-custom .color-input,body.theme-custom .preset-name-inp{background:" + S + ";color:" + T + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .field-input:focus,body.theme-custom .preset-name-inp:focus{border-color:" + t53 + ";box-shadow:0 0 0 2px " + a06 + "}");
        r.push("body.theme-custom .field-input:hover:not(:focus){border-color:" + t30 + "}");
        r.push("body.theme-custom .field-clear{color:" + t50 + "}");
        r.push("body.theme-custom .field-clear:hover{background:" + t20 + ";color:" + t80 + "}");
        r.push("body.theme-custom .field-clear:active{background:" + t30 + "}");

        /* ---- Buttons: capture, ghost, guide, secondary, cancel ---- */
        r.push("body.theme-custom .btn-capture,body.theme-custom .btn-ghost,body.theme-custom .btn-guide,body.theme-custom .btn-secondary,body.theme-custom .btn-cancel,body.theme-custom .theme-option{background:" + S + ";color:" + t67 + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .btn-capture:hover,body.theme-custom .btn-ghost:hover,body.theme-custom .btn-guide:hover{background:" + ra(S, 0.95) + ";color:" + T + ";border-color:" + t53 + "}");
        r.push("body.theme-custom .btn-capture.capturing{border-color:" + t67 + ";color:" + T + ";box-shadow:0 0 0 2px " + ra(T, 0.08) + "}");
        r.push("body.theme-custom .btn-secondary:hover{background:" + ra(S, 0.95) + ";color:" + t80 + ";border-color:" + t33 + "}");
        r.push("body.theme-custom .btn-cancel:hover{background:#1E0A0A;border-color:#3A1A1A;color:#FF7777}");

        /* ---- Primary buttons ---- */
        r.push("body.theme-custom .btn-primary,body.theme-custom .btn-confirm,body.theme-custom .settings-save,body.theme-custom .toggle-track.on,body.theme-custom .theme-option.active{background:" + A + ";color:" + B + ";border-color:" + A + "}");
        r.push("body.theme-custom .btn-primary:hover,body.theme-custom .btn-confirm:hover,body.theme-custom .settings-save:hover{background:" + ra(A, 0.88) + "}");

        /* ---- Toggle ---- */
        r.push("body.theme-custom .toggle-track{background:" + t20 + ";border-color:" + t30 + "}");
        r.push("body.theme-custom .toggle-thumb{background:" + t33 + "}");
        r.push("body.theme-custom .toggle-track.on .toggle-thumb{background:" + B + "}");

        /* ---- Checkbox wrap ---- */
        r.push("body.theme-custom .chk-wrap{background:" + S + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .chk-wrap:hover{background:" + ra(S, 0.95) + ";border-color:" + t30 + "}");
        r.push("body.theme-custom .chk-wrap.chk-on{border-color:" + t40 + "}");
        r.push("body.theme-custom .chk-txt{color:" + t47 + "}");
        r.push("body.theme-custom .chk-wrap:hover .chk-txt{color:" + t73 + "}");
        r.push("body.theme-custom .chk-wrap.chk-on .chk-txt{color:" + t67 + "}");

        /* ---- Color row ---- */
        r.push("body.theme-custom .color-name{color:" + t47 + "}");
        r.push("body.theme-custom .color-swatch{border-color:" + t40 + "}");

        /* ---- Divider ---- */
        r.push("body.theme-custom .divider{background:" + a10 + "}");

        /* ---- Presets ---- */
        r.push("body.theme-custom .preset-row{background:transparent}");
        r.push("body.theme-custom .preset-row:hover{background:" + a15 + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .preset-dot{background:" + t33 + "}");
        r.push("body.theme-custom .preset-name{color:" + t67 + "}");
        r.push("body.theme-custom .preset-sub{color:" + t33 + "}");
        r.push("body.theme-custom .preset-cnt{color:" + ra(T, 0.18) + "}");
        r.push("body.theme-custom .presets-empty{color:" + ra(T, 0.13) + "}");

        /* ---- Preset buttons ---- */
        r.push("body.theme-custom .preset-load{background:transparent;border-color:" + t25 + ";color:" + t53 + "}");
        r.push("body.theme-custom .preset-load:hover{background:" + t20 + ";border-color:" + t40 + ";color:" + T + "}");
        r.push("body.theme-custom .preset-del{background:transparent;border-color:" + t20 + ";color:" + t33 + "}");
        r.push("body.theme-custom .preset-del:hover{background:#1E0A0A;border-color:#3A1A1A;color:#FF7777}");
        r.push("body.theme-custom .preset-del-confirm{background:" + ra("#FF8C00", 0.10) + ";border-color:" + ra("#FF8C00", 0.35) + ";color:#FFA040}");
        r.push("body.theme-custom .preset-del-confirm:hover{background:" + ra("#FF8C00", 0.16) + ";border-color:#FF8C00;color:#FFB860}");
        r.push("body.theme-custom .preset-del-confirm::after{background:#FF8C00}");

        /* ---- Active (loaded) row ---- */
        r.push("body.theme-custom .preset-row-active{background:" + t15 + " !important;border-color:" + t25 + " !important}");
        r.push("body.theme-custom .preset-row-active .preset-name{color:" + T + " !important}");
        r.push("body.theme-custom .preset-row-active::before{background:" + A + ";opacity:0.5}");

        /* ---- Favorite star ---- */
        r.push("body.theme-custom .preset-fav{color:" + t20 + "}");
        r.push("body.theme-custom .preset-fav:hover{color:#F59E0B}");

        /* ---- Rename ---- */
        r.push("body.theme-custom .preset-rename-inp{background:" + ra(S, 0.92) + ";border-color:" + t33 + ";color:" + T + "}");
        r.push("body.theme-custom .preset-rename-inp:focus{border-color:" + t53 + ";background:" + ra(S, 0.85) + "}");

        /* ---- Arrows ---- */
        r.push("body.theme-custom .preset-arrow{color:" + t33 + "}");
        r.push("body.theme-custom .preset-arrow:hover{color:" + T + ";background:" + t20 + "}");
        r.push("body.theme-custom .preset-arrow:active{background:" + t30 + "}");

        /* ---- Ghost & dropline ---- */
        r.push("body.theme-custom .preset-ghost{background:" + S + ";border-color:" + t33 + "}");
        r.push("body.theme-custom .preset-dropline{background:" + A + "}");
        r.push("body.theme-custom .preset-row-dragging{opacity:0.28}");

        /* ---- Hotkeys ---- */
        r.push("body.theme-custom .preset-hk-add{border-color:" + t20 + ";color:" + t20 + "}");
        r.push("body.theme-custom .preset-row:hover .preset-hk-add{opacity:1}");
        r.push("body.theme-custom .preset-hk-add:hover{border-color:" + t40 + ";color:" + t47 + "}");
        r.push("body.theme-custom .preset-hk-set{border-color:" + t25 + ";color:" + t40 + "}");
        r.push("body.theme-custom .preset-hk-set:hover{border-color:" + t40 + ";color:" + t67 + "}");
        r.push("body.theme-custom .preset-hk-capturing{border-color:" + t40 + ";color:" + t53 + "}");
        r.push("body.theme-custom .preset-hk-key:hover{color:" + t67 + "}");
        r.push("body.theme-custom .preset-hk-clear{color:" + t25 + "}");
        r.push("body.theme-custom .preset-hk-clear:hover{color:#FF6666}");

        /* ---- Method tabs (Способ 1 / Способ 2) ---- */
        r.push("body.theme-custom .method-tabs{background:" + B + ";border-color:" + t20 + "}");
        r.push("body.theme-custom .method-tab{color:" + t50 + "}");
        r.push("body.theme-custom .method-tab:hover{color:" + t73 + ";background:" + a10 + "}");
        r.push("body.theme-custom .method-tab-active{background:" + t15 + " !important;color:" + T + " !important;border-color:" + t25 + "}");

        /* ---- Guide ---- */
        r.push("body.theme-custom .guide-modal,body.theme-custom .settings-modal{background:" + S + ";border-color:" + t25 + "}");
        r.push("body.theme-custom .settings-overlay-visible{background:" + ra(B, 0.82) + "}");
        r.push("body.theme-custom .guide-header,body.theme-custom .settings-header{background:" + ra(S, 0.95) + ";border-color:" + t20 + "}");
        r.push("body.theme-custom .guide-title,body.theme-custom .settings-title{color:" + T + "}");
        r.push("body.theme-custom .guide-close,body.theme-custom .settings-close{color:" + t33 + "}");
        r.push("body.theme-custom .guide-close:hover,body.theme-custom .settings-close:hover{background:#1E0A0A;color:#FF7777}");
        r.push("body.theme-custom .guide-num{background:" + t20 + ";border-color:" + t25 + ";color:" + t53 + "}");
        r.push("body.theme-custom .guide-text{color:" + t53 + "}");
        r.push("body.theme-custom .guide-code{background:" + B + ";border-color:" + t20 + ";color:" + t33 + "}");
        r.push("body.theme-custom .guide-hl-place,body.theme-custom .guide-hl-link{color:" + T + "}");
        r.push("body.theme-custom .guide-code-m2{background:" + B + ";border-color:" + ra_hex(A, 0.18) + "}");
        r.push("body.theme-custom .guide-hl-dim{color:" + t20 + "}");
        r.push("body.theme-custom .guide-divider-line{background:" + t20 + "}");
        r.push("body.theme-custom .guide-divider-label{color:" + t33 + "}");
        r.push("body.theme-custom .guide-num-m2{background:" + ra_hex(A, 0.07) + ";border-color:" + ra_hex(A, 0.18) + ";color:" + ra_hex(A, 0.7) + "}");
        r.push("body.theme-custom .guide-tag{background:" + t20 + ";border-color:" + t25 + ";color:" + t80 + "}");
        r.push("body.theme-custom .guide-nav-btn{background:" + S + ";color:" + t67 + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .guide-nav-btn:hover{background:" + ra(S, 0.95) + ";color:" + T + ";border-color:" + t53 + "}");
        r.push("body.theme-custom .guide-nav-indicator{color:" + t33 + "}");

        /* ---- Search ---- */
        r.push("body.theme-custom .search-inp{background:" + ra(S, 0.95) + ";border-color:" + t20 + ";color:" + t53 + "}");
        r.push("body.theme-custom .search-inp:focus{border-color:" + t40 + ";color:" + T + "}");

        /* ---- Import/Export buttons ---- */
        r.push("body.theme-custom .btn-io{background:transparent;border-color:" + t25 + ";color:" + t33 + "}");
        r.push("body.theme-custom .btn-io:hover{border-color:" + t40 + ";color:" + t67 + "}");

        /* ---- Tooltip ---- */
        r.push("body.theme-custom .app-tooltip{background:" + S + ";border-color:" + t25 + ";color:" + t60 + "}");
        r.push("body.theme-custom .tooltip-arrow{background:" + S + ";border-left-color:" + t25 + ";border-top-color:" + t25 + "}");

        /* ---- Scrollbars webkit ---- */
        r.push("body.theme-custom .settings-body::-webkit-scrollbar-thumb{background:" + a40 + "}");
        r.push("body.theme-custom .settings-body::-webkit-scrollbar-track{background:" + S + "}");
        r.push("body.theme-custom .presets-scroll::-webkit-scrollbar-thumb{background:" + a40 + "}");
        r.push("body.theme-custom .presets-scroll::-webkit-scrollbar-track{background:" + S + "}");
        r.push("body.theme-custom .tp-body::-webkit-scrollbar-thumb{background:" + a40 + "}");
        r.push("body.theme-custom .tp-body::-webkit-scrollbar-track{background:" + S + "}");

        /* ---- Scrollbars IE ---- */
        r.push("body.theme-custom .settings-body{scrollbar-face-color:" + a40 + ";scrollbar-track-color:" + S + ";scrollbar-arrow-color:" + a50 + ";scrollbar-highlight-color:" + S + ";scrollbar-3dlight-color:" + S + ";scrollbar-darkshadow-color:" + S + ";scrollbar-shadow-color:" + a40 + "}");
        r.push("body.theme-custom .presets-scroll{scrollbar-face-color:" + a40 + ";scrollbar-track-color:" + S + ";scrollbar-arrow-color:" + a50 + ";scrollbar-highlight-color:" + S + ";scrollbar-3dlight-color:" + S + ";scrollbar-darkshadow-color:" + S + ";scrollbar-shadow-color:" + a40 + "}");
        r.push("body.theme-custom .tp-body{scrollbar-face-color:" + a40 + ";scrollbar-track-color:" + S + ";scrollbar-arrow-color:" + a50 + ";scrollbar-highlight-color:" + S + ";scrollbar-3dlight-color:" + S + ";scrollbar-darkshadow-color:" + S + ";scrollbar-shadow-color:" + a40 + "}");

        /* ---- Theme chips ---- */
        r.push("body.theme-custom .tp-chip{border-color:" + a27 + ";color:" + T + "}");

        /* ---- Opacity slider ---- */
        r.push("body.theme-custom .opacity-slider{background:" + t20 + "}");
        r.push("body.theme-custom .opacity-slider::-webkit-slider-thumb{background:" + T + ";border-color:" + t40 + "}");
        r.push("body.theme-custom .opacity-slider::-ms-thumb{background:" + T + ";border-color:" + t40 + "}");
        r.push("body.theme-custom .opacity-slider::-ms-fill-lower{background:" + t40 + "}");
        r.push("body.theme-custom .opacity-display{color:" + t47 + "}");

        /* ---- Roblox status ---- */
        r.push("body.theme-custom .roblox-status{background:" + t20 + ";box-shadow:none}");
        r.push("body.theme-custom .roblox-status.roblox-on{background:#22C55E;box-shadow:0 0 7px rgba(34,197,94,0.65)}");

        /* ---- Manage Presets button ---- */
        r.push("body.theme-custom .btn-manage-presets{background:" + S + ";color:" + t67 + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .btn-manage-presets:hover{background:" + ra(S,0.95) + ";color:" + T + ";border-color:" + t53 + "}");

        /* ---- TP Manager ---- */
        r.push("body.theme-custom .tp-modal{background:" + S + ";border-color:" + t25 + "}");
        r.push("body.theme-custom .tp-header,body.theme-custom .tp-footer{background:" + ra(S,0.95) + ";border-color:" + t20 + "}");
        r.push("body.theme-custom .tp-title{color:" + T + "}");
        r.push("body.theme-custom .tp-close{color:" + t33 + "}");
        r.push("body.theme-custom .tp-close:hover{background:#1E0A0A;color:#FF7777}");
        r.push("body.theme-custom .btn-tp-save{background:" + A + ";color:" + B + "}");
        r.push("body.theme-custom .btn-tp-save:hover{background:" + ra(A,0.88) + "}");
        r.push("body.theme-custom .btn-tp-close{background:transparent;border-color:" + t25 + ";color:" + t67 + "}");
        r.push("body.theme-custom .btn-tp-close:hover{background:#1E0A0A;border-color:#3A1A1A;color:#FF7777}");

        /* ---- Preset Groups (folders) ---- */
        r.push("body.theme-custom .group-chip{background:" + S + ";border-color:" + a27 + ";color:" + t67 + "}");
        r.push("body.theme-custom .group-chip:hover{border-color:" + t40 + ";color:" + T + "}");
        r.push("body.theme-custom .group-chip-active{background:" + ra(S,0.95) + ";border-color:" + t53 + ";color:" + T + "}");
        r.push("body.theme-custom .group-header:hover{background:" + a10 + "}");
        r.push("body.theme-custom .group-header-name{color:" + t67 + "}");
        r.push("body.theme-custom .group-header-count,body.theme-custom .group-chevron{color:" + t33 + "}");
        r.push("body.theme-custom .pe-group-chip{background:" + ra(S,0.95) + "}");
        r.push("body.theme-custom .grp-modal{background:" + S + ";border-color:" + t25 + "}");
        r.push("body.theme-custom .grp-header{background:" + ra(S,0.95) + ";border-color:" + t20 + "}");
        r.push("body.theme-custom .grp-title{color:" + T + "}");
        r.push("body.theme-custom .grp-close{color:" + t33 + "}");
        r.push("body.theme-custom .grp-close:hover{background:#1E0A0A;color:#FF7777}");
        r.push("body.theme-custom .grp-list{scrollbar-face-color:" + a40 + ";scrollbar-track-color:" + S + ";scrollbar-arrow-color:" + a50 + ";scrollbar-highlight-color:" + S + ";scrollbar-3dlight-color:" + S + ";scrollbar-darkshadow-color:" + S + ";scrollbar-shadow-color:" + a40 + "}");
        r.push("body.theme-custom .grp-row:hover{background:" + a10 + "}");
        r.push("body.theme-custom .grp-row-name{color:" + T + "}");
        r.push("body.theme-custom .grp-row-count{color:" + t33 + "}");
        r.push("body.theme-custom .grp-row-del{color:" + t25 + "}");
        r.push("body.theme-custom .grp-row-del:hover{background:#1E0A0A;color:#FF7777}");
        r.push("body.theme-custom .grp-empty{color:" + t25 + "}");

        /* ---- Export modal ---- */
        r.push("body.theme-custom .export-modal{background:" + S + ";border-color:" + t25 + "}");
        r.push("body.theme-custom .export-header{background:" + ra(S, 0.95) + ";border-color:" + t20 + "}");
        r.push("body.theme-custom .export-title{color:" + T + "}");
        r.push("body.theme-custom .export-close{color:" + t33 + "}");
        r.push("body.theme-custom .export-close:hover{background:#1E0A0A;color:#FF7777}");
        r.push("body.theme-custom .export-select-all{color:" + t67 + "}");
        r.push("body.theme-custom .export-select-all:hover{color:" + T + "}");
        r.push("body.theme-custom .export-selected-count{color:" + t25 + "}");
        r.push("body.theme-custom .export-preset-list{scrollbar-face-color:" + a40 + ";scrollbar-track-color:" + S + ";scrollbar-arrow-color:" + a50 + ";scrollbar-highlight-color:" + S + ";scrollbar-3dlight-color:" + S + ";scrollbar-darkshadow-color:" + S + ";scrollbar-shadow-color:" + a40 + "}");
        r.push("body.theme-custom .export-preset-row:hover{background:" + a10 + "}");
        r.push("body.theme-custom .export-checkbox{background:" + B + ";border-color:" + t25 + "}");
        r.push("body.theme-custom .export-checkbox-on{background:" + A + ";border-color:" + A + "}");
        r.push("body.theme-custom .export-checkbox-on::after{border-color:" + B + "}");
        r.push("body.theme-custom .export-empty{color:" + t25 + "}");
        r.push("body.theme-custom .export-footer{background:" + S + ";border-color:" + t15 + "}");
        r.push("body.theme-custom .grp-rename-inp{background:" + ra(S,0.9) + ";border-color:" + a27 + ";color:" + T + "}");

        /* ---- Settings footer ---- */
        r.push("body.theme-custom .settings-footer{background:" + ra(S,0.95) + ";border-color:" + t20 + "}");

        /* ---- Gradient section ---- */
        r.push("body.theme-custom .gradient-section{border-top-color:" + t15 + "}");
        r.push("body.theme-custom .gradient-label{color:" + t50 + "}");
        r.push("body.theme-custom .angle-input{background:" + S + ";border-color:" + a27 + ";color:" + T + "}");
        r.push("body.theme-custom .preset-dup{border-color:" + t15 + ";color:" + t25 + "}");
        r.push("body.theme-custom .preset-dup:hover{background:" + a15 + ";border-color:" + a27 + ";color:" + A + "}");
        r.push("body.theme-custom .preset-edit-ids{border-color:" + t15 + ";color:" + t25 + "}");
        r.push("body.theme-custom .preset-edit-ids:hover{background:" + a15 + ";border-color:" + a27 + ";color:" + A + "}");
        r.push("body.theme-custom .preset-edit-modal{background:" + S + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .preset-edit-cancel{border-color:" + t15 + ";color:" + t50 + "}");
        /* ---- Bulk edit modal ---- */
        r.push("body.theme-custom .bulk-modal,body.theme-custom .bulk-header,body.theme-custom .bulk-footer,body.theme-custom .bulk-th{background:" + S + "}");
        r.push("body.theme-custom .bulk-modal{border-color:" + a27 + "}");
        r.push("body.theme-custom .bulk-header,body.theme-custom .bulk-footer{border-color:" + t15 + "}");
        r.push("body.theme-custom .bulk-th{border-color:" + t15 + ";color:" + t33 + "}");
        r.push("body.theme-custom .bulk-title{color:" + t50 + "}");
        r.push("body.theme-custom .bulk-name-text{color:" + t67 + "}");
        r.push("body.theme-custom .bulk-inp{background:" + ra(T,0.04) + ";border-color:" + t20 + ";color:" + T + "}");
        r.push("body.theme-custom .bulk-cancel-btn{border-color:" + t15 + ";color:" + t33 + "}");
        /* ---- TP form ---- */
        r.push("body.theme-custom .tp-name-inp{background:" + S + ";border-color:" + a27 + ";color:" + T + "}");
        r.push("body.theme-custom .tp-name-inp:focus{border-color:" + t53 + ";background:" + ra(S,0.95) + "}");

        /* ---- Enhancement: New icon buttons (history, dashboard, backup) ---- */
        r.push("body.theme-custom .btn-history,body.theme-custom .btn-dashboard,body.theme-custom .btn-backup{background:" + S + ";color:" + t50 + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .btn-history:hover,body.theme-custom .btn-dashboard:hover,body.theme-custom .btn-backup:hover{background:" + ra(S,0.95) + ";color:" + T + ";border-color:" + t53 + "}");

        /* ---- Enhancement: Sort bar ---- */
        r.push("body.theme-custom .sort-label{color:" + t50 + "}");
        r.push("body.theme-custom .sort-opt{background:none;border-color:" + a27 + ";color:" + t50 + "}");
        r.push("body.theme-custom .sort-opt:hover{border-color:" + t53 + ";color:" + T + "}");
        r.push("body.theme-custom .sort-opt-active{border-color:" + A + ";color:" + T + ";background:" + a10 + "}");

        /* ---- Enhancement: Status bar ---- */
        r.push("body.theme-custom .status-bar{border-top-color:" + a15 + ";color:" + t47 + "}");
        r.push("body.theme-custom .status-bar-sep{color:" + t25 + "}");

        /* ---- Enhancement: Empty state ---- */
        r.push("body.theme-custom .empty-state-icon{border-color:" + t33 + ";color:" + t50 + "}");
        r.push("body.theme-custom .empty-state-title{color:" + t67 + "}");
        r.push("body.theme-custom .empty-state-hint{color:" + t40 + "}");
        r.push("body.theme-custom .empty-state-hint2{color:" + t33 + "}");

        /* ---- Enhancement: Toast ---- */
        r.push("body.theme-custom .toast{background:" + S + ";border-color:" + a27 + ";color:" + T + ";box-shadow:0 4px 16px rgba(0,0,0,0.6)}");
        r.push("body.theme-custom .toast-action{color:" + A + "}");
        r.push("body.theme-custom .toast-action:hover{background:" + a10 + "}");
        r.push("body.theme-custom .toast-close{color:" + t40 + "}");
        r.push("body.theme-custom .toast-close:hover{color:" + T + "}");

        /* ---- Enhancement: Preset copy button ---- */
        r.push("body.theme-custom .preset-copy{border-color:" + a27 + ";color:" + t50 + "}");
        r.push("body.theme-custom .preset-copy:hover{border-color:" + t53 + ";color:" + T + ";background:" + a10 + "}");

        /* ---- Enhancement: History modal ---- */
        r.push("body.theme-custom .history-modal{background:" + S + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .history-title{color:" + T + "}");
        r.push("body.theme-custom .history-header{background:" + ra(S,0.95) + ";border-bottom-color:" + a15 + "}");
        r.push("body.theme-custom .history-close{color:" + t50 + "}");
        r.push("body.theme-custom .history-close:hover{background:#1E0A0A;color:#FF6666}");
        r.push("body.theme-custom .history-filter-opt{border-color:" + a27 + ";color:" + t50 + "}");
        r.push("body.theme-custom .history-filter-active{border-color:" + A + ";color:" + T + ";background:" + a10 + "}");
        r.push("body.theme-custom .history-th{color:" + t50 + ";border-bottom-color:" + a15 + "}");
        r.push("body.theme-custom .history-table td{color:" + t67 + ";border-bottom-color:" + a10 + "}");
        r.push("body.theme-custom .history-table tr:hover td{color:" + T + "}");
        r.push("body.theme-custom .history-clear-btn{border-color:" + ra("#EF4444",0.3) + ";color:#FF7777}");
        r.push("body.theme-custom .history-clear-btn:hover{background:" + ra("#EF4444",0.15) + "}");

        /* ---- Enhancement: Dashboard modal ---- */
        r.push("body.theme-custom .dashboard-modal{background:" + S + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .dashboard-title{color:" + T + "}");
        r.push("body.theme-custom .dashboard-header{background:" + ra(S,0.95) + ";border-bottom-color:" + a15 + "}");
        r.push("body.theme-custom .dashboard-close{color:" + t50 + "}");
        r.push("body.theme-custom .dashboard-close:hover{background:#1E0A0A;color:#FF6666}");
        r.push("body.theme-custom .dashboard-stat-card{background:" + B + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .dashboard-stat-value{color:" + T + "}");
        r.push("body.theme-custom .dashboard-stat-label{color:" + t50 + "}");
        r.push("body.theme-custom .dashboard-section-title{color:" + t67 + "}");
        r.push("body.theme-custom .dashboard-top-item{color:" + t73 + "}");
        r.push("body.theme-custom .dashboard-top-rank{color:" + t40 + "}");
        r.push("body.theme-custom .dashboard-top-count{color:" + T + "}");
        r.push("body.theme-custom .dashboard-footer{background:" + ra(S,0.95) + ";border-top-color:" + a15 + "}");

        /* ---- Enhancement: Backup modal ---- */
        r.push("body.theme-custom .backup-modal{background:" + S + ";border-color:" + a27 + "}");
        r.push("body.theme-custom .backup-title{color:" + T + "}");
        r.push("body.theme-custom .backup-header{background:" + ra(S,0.95) + ";border-bottom-color:" + a15 + "}");
        r.push("body.theme-custom .backup-close{color:" + t50 + "}");
        r.push("body.theme-custom .backup-close:hover{background:#1E0A0A;color:#FF6666}");
        r.push("body.theme-custom .backup-action{background:" + B + ";border-color:" + a27 + ";color:" + t73 + "}");
        r.push("body.theme-custom .backup-action:hover{border-color:" + t53 + ";background:" + ra(S,0.95) + ";color:" + T + "}");
        r.push("body.theme-custom .backup-hint{color:" + t40 + "}");

        /* ---- Enhancement: Drag overlay ---- */
        r.push("body.theme-custom .drag-overlay{background:" + ra(B, 0.85) + "}");
        r.push("body.theme-custom .drag-overlay-text{color:" + T + ";border-color:" + T + "}");

        /* ---- Enhancement: TP thumbnail ---- */
        r.push("body.theme-custom .tp-thumb{border-color:" + a27 + "}");

        /* ---- Enhancement: Modal visual polish (§modal-visual) ---- */
        /* Export modal */
        r.push("body.theme-custom .export-select-row{border-bottom-color:" + a15 + " !important}");
        r.push("body.theme-custom .export-preset-row:hover{border-color:" + t25 + " !important}");
        r.push("body.theme-custom .export-preset-list{scrollbar-face-color:" + a40 + ";scrollbar-track-color:" + S + " !important}");

        /* Bulk edit modal */
        r.push("body.theme-custom .bulk-table-wrap{border-color:" + a15 + " !important}");
        r.push("body.theme-custom .bulk-th{background:" + ra(S,0.95) + ";border-bottom-color:" + a15 + ";color:" + t50 + " !important}");
        r.push("body.theme-custom .bulk-table tbody tr:hover{background:" + a10 + " !important}");
        r.push("body.theme-custom .bulk-table tbody tr:nth-child(even){background:" + ra(T,0.02) + " !important}");
        r.push("body.theme-custom .bulk-table tbody tr:nth-child(even):hover{background:" + a10 + " !important}");
        r.push("body.theme-custom .bulk-inp-place,body.theme-custom .bulk-inp-link{background:" + B + ";border-color:" + a27 + ";color:" + T + " !important}");
        r.push("body.theme-custom .bulk-inp-place:focus,body.theme-custom .bulk-inp-link:focus{border-color:" + t53 + " !important}");

        /* Groups modal */
        r.push("body.theme-custom .grp-row:hover{border-color:" + t25 + " !important}");
        r.push("body.theme-custom .grp-row-count{background:" + a10 + ";color:" + t50 + " !important}");
        r.push("body.theme-custom .grp-form{border-top-color:" + a15 + " !important}");
        r.push("body.theme-custom .grp-color-swatch{border-color:" + t33 + " !important}");
        r.push("body.theme-custom .grp-color-swatch:hover{border-color:" + t53 + " !important}");
        r.push("body.theme-custom .grp-name-inp{background:" + B + ";border-color:" + a27 + ";color:" + T + " !important}");
        r.push("body.theme-custom .grp-name-inp:focus{border-color:" + t53 + " !important}");
        r.push("body.theme-custom .grp-add-btn{background:" + A + ";color:" + B + " !important}");
        r.push("body.theme-custom .grp-add-btn:hover{background:" + ra(A,0.88) + " !important}");

        /* History modal */
        r.push("body.theme-custom .history-filter-opt{border-color:" + a27 + ";color:" + t50 + " !important}");
        r.push("body.theme-custom .history-filter-opt:hover{border-color:" + t53 + ";color:" + T + " !important}");
        r.push("body.theme-custom .history-filter-active{border-color:" + A + ";color:" + T + ";background:" + a10 + " !important}");
        r.push("body.theme-custom .history-clear-btn{border-color:" + ra("#EF4444",0.3) + ";color:#FF7777 !important}");
        r.push("body.theme-custom .history-clear-btn:hover{background:" + ra("#EF4444",0.15) + ";border-color:" + ra("#EF4444",0.5) + " !important}");
        r.push("body.theme-custom .history-th{background:" + ra(S,0.95) + ";border-bottom-color:" + a15 + ";color:" + t50 + " !important}");
        r.push("body.theme-custom .history-table td{border-bottom-color:" + a10 + " !important}");
        r.push("body.theme-custom .history-table tbody tr:hover{background:" + a10 + " !important}");

        /* Dashboard modal */
        r.push("body.theme-custom .dashboard-stat-card{background:" + B + ";border-color:" + a27 + " !important}");
        r.push("body.theme-custom .dashboard-stat-card:hover{border-color:" + t53 + ";box-shadow:0 6px 20px " + ra(A,0.15) + " !important}");
        r.push("body.theme-custom .dashboard-stat-value{color:" + T + " !important}");
        r.push("body.theme-custom .dashboard-stat-label{color:" + t50 + " !important}");
        r.push("body.theme-custom .dashboard-section-title{color:" + t67 + ";border-bottom-color:" + a15 + " !important}");
        r.push("body.theme-custom .dashboard-top-item{color:" + t73 + ";border-bottom-color:" + a10 + " !important}");
        r.push("body.theme-custom .dashboard-top-item:hover{background:" + a10 + " !important}");
        r.push("body.theme-custom .dashboard-top-rank{background:" + a15 + ";color:" + t50 + " !important}");
        r.push("body.theme-custom .dashboard-top-count{color:" + T + " !important}");
        r.push("body.theme-custom #dashboard-chart{background:" + B + ";border-color:" + a15 + " !important}");

        /* Backup modal */
        r.push("body.theme-custom .backup-action{background:" + B + ";border-color:" + a27 + ";color:" + t73 + " !important}");
        r.push("body.theme-custom .backup-action:hover{border-color:" + t53 + ";background:" + ra(S,0.95) + ";color:" + T + ";box-shadow:0 4px 14px " + ra(A,0.12) + " !important}");
        r.push("body.theme-custom .backup-hint{color:" + t40 + " !important}");

        /* Modal headers/footers backgrounds */
        r.push("body.theme-custom .history-header,body.theme-custom .dashboard-header,body.theme-custom .backup-header,body.theme-custom .export-header,body.theme-custom .bulk-header,body.theme-custom .grp-header{background:" + ra(S,0.95) + ";border-bottom-color:" + a15 + " !important}");
        r.push("body.theme-custom .dashboard-footer,body.theme-custom .backup-footer,body.theme-custom .export-footer,body.theme-custom .bulk-footer{background:" + ra(S,0.95) + ";border-top-color:" + a15 + " !important}");
        r.push("body.theme-custom .history-title,body.theme-custom .dashboard-title,body.theme-custom .backup-title,body.theme-custom .export-title,body.theme-custom .bulk-title,body.theme-custom .grp-title{color:" + T + " !important}");
        r.push("body.theme-custom .history-close,body.theme-custom .dashboard-close,body.theme-custom .backup-close,body.theme-custom .export-close,body.theme-custom .bulk-close,body.theme-custom .grp-close{color:" + t50 + " !important}");
        r.push("body.theme-custom .history-close:hover,body.theme-custom .dashboard-close:hover,body.theme-custom .backup-close:hover,body.theme-custom .export-close:hover,body.theme-custom .bulk-close:hover,body.theme-custom .grp-close:hover{background:#1E0A0A;color:#FF6666 !important}");

        /* Modal backgrounds */
        r.push("body.theme-custom .history-modal,body.theme-custom .dashboard-modal,body.theme-custom .backup-modal,body.theme-custom .export-modal,body.theme-custom .bulk-modal,body.theme-custom .grp-modal{background:" + S + ";border-color:" + a27 + " !important}");

        /* Overlay backgrounds */
        r.push("body.theme-custom .history-overlay,body.theme-custom .dashboard-overlay,body.theme-custom .backup-overlay,body.theme-custom .export-overlay,body.theme-custom .bulk-overlay,body.theme-custom .grp-overlay{background:" + ra(B,0.82) + " !important}");

        /* Enhancement: accent bar in modal headers uses accent color */
        r.push("body.theme-custom .history-header::before,body.theme-custom .dashboard-header::before,body.theme-custom .backup-header::before,body.theme-custom .export-header::before,body.theme-custom .bulk-header::before,body.theme-custom .grp-header::before{background:" + A + " !important;opacity:0.8 !important}");

        /* Enhancement: scrollbar colors in custom theme */
        r.push("body.theme-custom .history-body,body.theme-custom .dashboard-body,body.theme-custom .backup-body,body.theme-custom .export-preset-list,body.theme-custom .bulk-table-wrap,body.theme-custom .grp-list{scrollbar-face-color:" + a40 + " !important;scrollbar-track-color:" + S + " !important;scrollbar-arrow-color:" + a50 + " !important;scrollbar-highlight-color:" + S + " !important;scrollbar-3dlight-color:" + S + " !important;scrollbar-darkshadow-color:" + S + " !important;scrollbar-shadow-color:" + a40 + " !important}");
        r.push("body.theme-custom .history-body::-webkit-scrollbar-thumb,body.theme-custom .dashboard-body::-webkit-scrollbar-thumb,body.theme-custom .export-preset-list::-webkit-scrollbar-thumb,body.theme-custom .bulk-table-wrap::-webkit-scrollbar-thumb,body.theme-custom .grp-list::-webkit-scrollbar-thumb{background:" + a40 + " !important}");
        r.push("body.theme-custom .history-body::-webkit-scrollbar-thumb:hover,body.theme-custom .dashboard-body::-webkit-scrollbar-thumb:hover,body.theme-custom .export-preset-list::-webkit-scrollbar-thumb:hover,body.theme-custom .bulk-table-wrap::-webkit-scrollbar-thumb:hover,body.theme-custom .grp-list::-webkit-scrollbar-thumb:hover{background:" + a50 + " !important}");

        /* Enhancement: dashboard stat card accent line glow */
        r.push("body.theme-custom .dashboard-stat-card::after{background:linear-gradient(to right,transparent," + ra(A,0.3) + ",transparent) !important}");

        /* Enhancement: backup action glow uses accent */
        r.push("body.theme-custom .backup-action:hover::after{box-shadow:0 0 20px 2px " + ra(A,0.1) + " !important}");

        /* Enhancement: context menu, multi-toolbar, view-toggle in custom theme */
        r.push("body.theme-custom .ctx-menu{background:" + S + " !important;border-color:" + a27 + " !important;box-shadow:0 8px 32px rgba(0,0,0,0.7) !important}");
        r.push("body.theme-custom .ctx-item{color:" + t67 + " !important}");
        r.push("body.theme-custom .ctx-item:hover{background:" + a10 + " !important;color:" + T + " !important}");
        r.push("body.theme-custom .ctx-sep{background:" + a15 + " !important}");
        r.push("body.theme-custom .ctx-danger{color:#FF7777 !important}");
        r.push("body.theme-custom .ctx-danger:hover{background:" + ra("#EF4444",0.15) + " !important;color:#FF9999 !important}");
        r.push("body.theme-custom .multi-toolbar{background:" + S + " !important;border-color:" + a27 + " !important;box-shadow:0 6px 24px rgba(0,0,0,0.6) !important}");
        r.push("body.theme-custom .multi-count{color:" + t67 + " !important}");
        r.push("body.theme-custom .multi-btn{border-color:" + a27 + " !important;color:" + t73 + " !important}");
        r.push("body.theme-custom .multi-btn:hover{border-color:" + t53 + " !important;color:" + T + " !important}");
        r.push("body.theme-custom .multi-delete{color:#FF7777 !important;border-color:" + ra("#EF4444",0.3) + " !important}");
        r.push("body.theme-custom .view-btn{border-color:" + a27 + " !important;color:" + t50 + " !important}");
        r.push("body.theme-custom .view-btn:hover{border-color:" + t53 + " !important;color:" + T + " !important}");
        r.push("body.theme-custom .view-active{border-color:" + A + " !important;color:" + T + " !important;background:" + a10 + " !important}");
        r.push("body.theme-custom .tp-chip-active{box-shadow:0 0 0 2px " + A + ",0 0 12px " + ra(A,0.3) + " !important}");

        /* §maket-redesign: custom-theme support for the brand-new
           redesign classes (list/detail/toolbar have no pre-existing
           themed counterpart to inherit from). */
        r.push("body.theme-custom .app-shell,body.theme-custom .hdr,body.theme-custom .input-row,body.theme-custom .toolbar,body.theme-custom .main2,body.theme-custom .statusbar.status-bar{background:" + B + " !important}");
        r.push("body.theme-custom .hdr,body.theme-custom .input-row,body.theme-custom .toolbar,body.theme-custom .statusbar.status-bar{border-color:" + a15 + " !important}");
        r.push("body.theme-custom .plist.presets-scroll{border-right-color:" + a15 + " !important}");
        r.push("body.theme-custom .pdetail{border-left-color:" + a15 + " !important;background:" + ra(S,0.4) + " !important}");
        r.push("body.theme-custom .hdr-logo{color:" + T + " !important}");
        r.push("body.theme-custom .hdr-ver,body.theme-custom .pl-cnt,body.theme-custom .pd-label{color:" + t50 + " !important}");
        r.push("body.theme-custom .hdr-btn.tc-btn{color:" + t67 + " !important}");
        r.push("body.theme-custom .hdr-btn.tc-btn:hover{background:" + t20 + " !important;color:" + T + " !important}");
        r.push("body.theme-custom .hdr-status.roblox-status{color:" + A + " !important;background:" + a10 + " !important}");
        r.push("body.theme-custom .ir-tab.method-tab,body.theme-custom .tb-btn,body.theme-custom .tb-sort.sort-toggle,body.theme-custom .pd-btn,body.theme-custom .btn-tool,body.theme-custom .ir-hk-key.key-box,body.theme-custom .ir-hk-capture.btn-capture{background:" + S + " !important;border-color:" + a27 + " !important;color:" + t67 + " !important}");
        r.push("body.theme-custom .ir-tab.method-tab-active{background:" + A + " !important;color:" + B + " !important}");
        r.push("body.theme-custom .tb-btn:hover,body.theme-custom .tb-btn.view-active,body.theme-custom .tb-sort.sort-toggle:hover,body.theme-custom .pd-btn:hover,body.theme-custom .btn-tool:hover,body.theme-custom .ir-hk-capture.btn-capture:hover{border-color:" + A + " !important;color:" + A + " !important}");
        r.push("body.theme-custom .ir-hk-key.key-box{color:" + A + " !important}");
        r.push("body.theme-custom .ir-sep{background:" + a27 + " !important}");
        r.push("body.theme-custom .ir-hk-chk-txt.chk-txt{color:" + t50 + " !important}");
        r.push("body.theme-custom .tb-add.btn-ghost{background:" + A + " !important;color:" + B + " !important}");
        r.push("body.theme-custom .tb-add.btn-ghost:hover{background:" + ra(A,0.88) + " !important}");
        r.push("body.theme-custom .sort-bar,body.theme-custom .sort-collapsed{background:" + B + " !important;border-color:" + a15 + " !important}");
        r.push("body.theme-custom .sort-bar .sort-toggle,body.theme-custom .sort-collapsed .sort-toggle{background:" + S + " !important;border-color:" + a27 + " !important;color:" + t67 + " !important}");
        r.push("body.theme-custom .sort-bar .sort-toggle:hover,body.theme-custom .sort-collapsed .sort-toggle:hover{border-color:" + A + " !important;color:" + A + " !important}");
        r.push("body.theme-custom .sort-opt{border-color:" + a20 + " !important;color:" + t53 + " !important}");
        r.push("body.theme-custom .sort-opt:hover{border-color:" + a40 + " !important;color:" + T + " !important}");
        r.push("body.theme-custom .sort-opt-active{border-color:" + A + " !important;color:" + A + " !important;background:" + ra(A,0.08) + " !important}");
         r.push("body.theme-custom .sort-label{color:" + t50 + " !important}");
        r.push("body.theme-custom .preset-row.pl-row:hover{background:" + t15 + " !important}");
        r.push("body.theme-custom .preset-row.pl-row.preset-row-active{background:" + a10 + " !important;border-left-color:" + A + " !important}");
        r.push("body.theme-custom .pl-dot{color:" + B + " !important}");
        r.push("body.theme-custom .pl-name{color:" + t80 + " !important}");
        r.push("body.theme-custom .preset-row.pl-row.preset-row-active .pl-name{color:" + T + " !important}");
        r.push("body.theme-custom .pl-hk,body.theme-custom .pd-tag-hk{background:" + a15 + " !important;color:" + A + " !important}");
        r.push("body.theme-custom .pd-empty{color:" + t30 + " !important}");
        r.push("body.theme-custom .pd-icon{background:" + a15 + " !important}");
        r.push("body.theme-custom .pd-name{color:" + T + " !important}");
        r.push("body.theme-custom .pd-row{border-bottom-color:" + t15 + " !important}");
        r.push("body.theme-custom .pd-val{color:" + t80 + " !important}");
        r.push("body.theme-custom .btn-go.btn-primary{background:" + A + " !important;color:" + B + " !important}");
        r.push("body.theme-custom .pl-fav,body.theme-custom .pd-tag-fav,body.theme-custom .pd-tag-grp{color:" + A + " !important}");
        r.push("body.theme-custom .pd-tag-fav,body.theme-custom .pd-tag-grp{background:" + a15 + " !important}");
        r.push("body.theme-custom .pd-val-accent{color:" + A + " !important}");
        r.push("body.theme-custom .pd-fav-on.btn-tool{background:" + A + " !important;color:" + B + " !important;border-color:" + A + " !important}");
        r.push("body.theme-custom .statusbar .green.status-bar-item{color:" + A + " !important}");
        r.push("body.theme-custom .btn-go.btn-primary:hover{background:" + ra(A,0.88) + " !important}");

        css = r.join("");
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
   THEME PRESETS
   ============================================================ */
function applyThemePreset(p) {
    customTheme.bg      = p.bg;
    customTheme.surface = p.surface;
    customTheme.text    = p.text;
    customTheme.accent  = p.accent;
    customTheme.gradientEnabled = !!(p.gradientEnabled);
    customTheme.gradientBg2     = p.gradientBg2 ? normalizeHex(p.gradientBg2, p.bg) : p.bg;
    customTheme.gradientAngle   = p.gradientAngle || 135;
    themeMode = "custom";
    syncThemeControls();
    applyTheme();
    syncColorPickers();
    /* Enhancement: immediately update active state in TP grid */
    renderTPGrid();
}

function syncColorPickers() {
    setCP("cp-bg",      customTheme.bg);
    setCP("cp-surface", customTheme.surface);
    setCP("cp-text",    customTheme.text);
    setCP("cp-accent",  customTheme.accent);
}

function syncGradientUI() {
    var chk = el("chk-gradient");
    var trackEl = el("gradient-track");
    if (chk) chk.checked = !!customTheme.gradientEnabled;
    if (trackEl) trackEl.className = "toggle-track" + (customTheme.gradientEnabled ? " on" : "");
    var wrapEl = el("grad-toggle-wrap");
    if (wrapEl) wrapEl.className = customTheme.gradientEnabled ? "chk-wrap chk-on" : "chk-wrap";
    var gradRow = el("grad-options-row");
    if (gradRow) gradRow.style.display = customTheme.gradientEnabled ? "" : "none";
    var bg2inp = el("theme-grad-bg2");
    if (bg2inp) bg2inp.value = customTheme.gradientBg2 || customTheme.bg;
    var angInp = el("theme-grad-angle");
    if (angInp) angInp.value = (customTheme.gradientAngle || 135).toString();
    var sw2 = el("swatch-grad-bg2");
    if (sw2) sw2.style.backgroundColor = customTheme.gradientBg2 || customTheme.bg;
    syncAngleButtons();
}

function syncAngleButtons() {
    var angles = [45, 90, 135, 180];
    var cur = customTheme.gradientAngle || 135;
    for (var i = 0; i < angles.length; i++) {
        var btn = el("angle-opt-" + angles[i]);
        if (btn) btn.className = (Math.abs(angles[i] - cur) < 1) ? "theme-option active" : "theme-option";
    }
}

function setCP(id, hex) {
    var node = el(id);
    if (node) { try { node.value = hex.toLowerCase(); } catch (x) {} }
}

function supportsColorInput() {
    var input = document.createElement("input");
    input.setAttribute("type", "color");
    return input.type === "color";
}

function bindColorPicker(cpId, textId) {
    var cp  = el(cpId);
    var txt = el(textId);
    var swId = "swatch-" + cpId.replace("cp-", "");
    var sw  = el(swId);
    if (!cp || !txt || !sw) return;

    var colorSupported = supportsColorInput();

    sw.style.position = "relative";
    sw.style.overflow = "hidden";
    sw.style.cursor = "pointer";
    sw.title = "Click to pick color";

    if (colorSupported) {
        if (cp.parentNode !== sw) {
            sw.appendChild(cp);
        }
        cp.style.position = "absolute";
        cp.style.top = "0";
        cp.style.left = "0";
        cp.style.width = "100%";
        cp.style.height = "100%";
        cp.style.padding = "0";
        cp.style.border = "none";
        cp.style.opacity = "0";
        cp.style.cursor = "pointer";

        var onPick = function () {
            var hex = normalizeHex(cp.value, txt.value);
            txt.value = hex;
            syncCustomFromInputs(false);
            updateSwatches();
            if (themeMode === "custom") applyTheme();
        };
        cp.oninput  = onPick;
        cp.onchange = onPick;

        sw.onclick = function(e) {
            try { cp.click(); } catch(x){}
        };
    } else {
        cp.style.display = "none";
        sw.onclick = function(e) {
            cancelEv(e);
            openColorPicker(txt.id, swId);
        };
        var row = sw.parentNode;
        if (row) {
            row.style.cursor = "pointer";
            row.onclick = function(e) {
                var t = e.target || e.srcElement;
                if (t === sw || t === row) {
                    cancelEv(e);
                    openColorPicker(txt.id, swId);
                }
            };
        }
    }
}

/* ============================================================
   COLOR PICKER (Canvas-based for IE11 / Shell.Explorer)
   ============================================================ */
/* Canvas layout (must match #cpicker-canvas width/height in CSS):
   W=260, H=210, PAD=8, HUE_H=18
   SV rect  : x=8   y=8    w=244  h=168
   Hue strip: x=8   y=184  w=244  h=18  */
var CP_PAD   = 8;
var CP_HUE_H = 18;
var CP_W     = 260;
var CP_H     = 210;
var CP_SV_X  = CP_PAD;
var CP_SV_Y  = CP_PAD;
var CP_SV_W  = CP_W - CP_PAD * 2;
var CP_SV_H  = CP_H - CP_PAD * 3 - CP_HUE_H;
var CP_HUE_X = CP_PAD;
var CP_HUE_Y = CP_SV_Y + CP_SV_H + CP_PAD;
var CP_HUE_W = CP_W - CP_PAD * 2;

var cpState = {
    active: false,
    targetTextId: "",
    targetSwatchId: "",
    onApply: null,
    hue: 0,
    sat: 1,
    val: 1,
    draggingHue: false,
    draggingSV: false
};

var cpDocMove = null;
var cpDocUp = null;

function openColorPicker(textId, swatchId, onApply) {
    if (cpState.active) return;
    cpState.active = true;
    cpState.targetTextId = textId;
    cpState.targetSwatchId = swatchId;
    cpState.onApply = onApply || null;

    var hex = normalizeHex(el(textId).value, "#FFFFFF");
    var rgb = hexToRgb(hex);
    var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    cpState.hue = hsv.h;
    cpState.sat = hsv.s;
    cpState.val = hsv.v;

    el("cpicker-hex").value = hex;
    var prevInit = el("cpicker-preview");
    if (prevInit) prevInit.style.background = hex;
    drawCP();
    applyCPThemeStyle();

    var overlay = el("cpicker-overlay");
    overlay.style.display = "flex";
    setTimeout(function () {
        overlay.className = "cpicker-overlay cpicker-overlay-visible";
    }, 10);
}

function closeColorPicker(apply) {
    var overlay = el("cpicker-overlay");
    overlay.className = "cpicker-overlay";
    setTimeout(function () {
        overlay.style.display = "none";
    }, 220);
    cpState.active = false;
    cpState.draggingHue = false;
    cpState.draggingSV = false;
    cpUnbindDocEvents();
    /* Do NOT clear cpicker-theme-style here — clearing it causes a flash of
       the default dark theme during the 220ms close animation.
       It will be overwritten on next open by applyCPThemeStyle().           */

    if (apply) {
        var hex = normalizeHex(el("cpicker-hex").value, "#FFFFFF");
        if (cpState.onApply) {
            cpState.onApply(hex);
        } else {
            el(cpState.targetTextId).value = hex;
            syncCustomFromInputs(false);
            updateSwatches();
            if (themeMode === "custom") applyTheme();
        }
    }
    cpState.onApply = null;
}

function applyCPThemeStyle() {
    var css = "";

    if (themeMode === "custom") {
        var B = customTheme.bg;
        var S = customTheme.surface;
        var T = customTheme.text;
        var A = customTheme.accent;
        function ra(hex, alpha) {
            var r = parseInt(hex.substr(1,2),16);
            var g = parseInt(hex.substr(3,2),16);
            var b = parseInt(hex.substr(5,2),16);
            return "rgba("+r+","+g+","+b+","+alpha+")";
        }
        var t20=ra(T,0.20),t25=ra(T,0.25),t33=ra(T,0.33);
        var t40=ra(T,0.40),t47=ra(T,0.47),t53=ra(T,0.53);
        var t67=ra(T,0.67);
        /* Prefix every rule with body.theme-custom so it only applies in custom mode */
        css += "body.theme-custom .cpicker-modal{background:"+S+" !important;border-color:"+t25+"}";
        css += "body.theme-custom .cpicker-header{background:"+ra(S,0.95)+" !important;border-color:"+t20+"}";
        css += "body.theme-custom .cpicker-footer{background:"+ra(S,0.95)+" !important;border-color:"+t20+"}";
        css += "body.theme-custom #cpicker-canvas{background:"+B+";border-color:"+t20+"}";
        css += "body.theme-custom .cpicker-title{color:"+T+"}";
        css += "body.theme-custom .cpicker-close{color:"+t33+"}";
        css += "body.theme-custom .cpicker-close:hover{background:#1E0A0A;color:#FF7777}";
        css += "body.theme-custom .cpicker-hex-input{background:"+S+";border-color:"+t25+";color:"+T+"}";
        css += "body.theme-custom .cpicker-hex-input:focus{border-color:"+t53+"}";
        css += "body.theme-custom .cpicker-hex-label{color:"+t47+"}";
        css += "body.theme-custom .cpicker-preview-box{border-color:"+t25+"}";
        css += "body.theme-custom .cpicker-preview-label{color:"+t47+"}";
        css += "body.theme-custom .cpicker-modal .btn-tp-save{background:"+A+" !important;color:"+B+" !important}";
        css += "body.theme-custom .cpicker-modal .btn-tp-save:hover{background:"+ra(A,0.88)+" !important}";
        css += "body.theme-custom .cpicker-modal .btn-tp-close{background:transparent;border-color:"+t25+";color:"+t67+"}";
        css += "body.theme-custom .cpicker-modal .btn-tp-close:hover{background:#1E0A0A;border-color:#3A1A1A;color:#FF7777}";
    }
    setStyleText("cpicker-theme-style", css);
}

function cpBindDocEvents() {
    cpDocMove = function(e) {
        e = e || window.event;
        if (cpState.draggingHue) {
            updateCPHueFromEvent(e);
            try { e.preventDefault(); } catch(x){}
            try { e.returnValue = false; } catch(x){}
            return false;
        }
        if (cpState.draggingSV) {
            updateCPSVFromEvent(e);
            try { e.preventDefault(); } catch(x){}
            try { e.returnValue = false; } catch(x){}
            return false;
        }
    };
    cpDocUp = function() {
        cpState.draggingHue = false;
        cpState.draggingSV = false;
        var canvas = el("cpicker-canvas");
        if (canvas && canvas.releaseCapture) {
            try { canvas.releaseCapture(); } catch(x){}
        }
    };
    if (document.addEventListener) {
        document.addEventListener("mousemove", cpDocMove);
        document.addEventListener("mouseup", cpDocUp);
    } else if (document.attachEvent) {
        document.attachEvent("onmousemove", cpDocMove);
        document.attachEvent("onmouseup", cpDocUp);
    }
}

function cpUnbindDocEvents() {
    if (!cpDocMove && !cpDocUp) return;
    if (document.removeEventListener) {
        if (cpDocMove) document.removeEventListener("mousemove", cpDocMove);
        if (cpDocUp) document.removeEventListener("mouseup", cpDocUp);
    } else if (document.detachEvent) {
        if (cpDocMove) document.detachEvent("onmousemove", cpDocMove);
        if (cpDocUp) document.detachEvent("onmouseup", cpDocUp);
    }
    cpDocMove = null;
    cpDocUp = null;
}

var cpDrawTimer = null;
function drawCP() {
    if (cpDrawTimer) return;
    cpDrawTimer = setTimeout(function() {
        cpDrawTimer = null;
        drawCPImpl();
    }, 16);
}

function cpRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,       y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r,   y,         r);
    ctx.closePath();
}

function cpDrawHandle(ctx, x, y, r, colorHex) {
    /* Drop shadow */
    ctx.shadowColor   = "rgba(0,0,0,0.55)";
    ctx.shadowBlur    = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    /* Coloured fill */
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = colorHex || "#FFFFFF";
    ctx.fill();

    ctx.shadowBlur = 0;

    /* White outer ring */
    ctx.beginPath();
    ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Dark border */
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawCPImpl() {
    var canvas = el("cpicker-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width;   /* 260 */
    var H = canvas.height;  /* 210 */

    ctx.clearRect(0, 0, W, H);

    var R = 6; /* corner radius for rects */

    /* ── SV square ───────────────────────────────── */
    var base = hsvToRgb(cpState.hue, 1, 1);

    /* white → pure hue  (horizontal) */
    var grH = ctx.createLinearGradient(CP_SV_X, CP_SV_Y, CP_SV_X + CP_SV_W, CP_SV_Y);
    grH.addColorStop(0, "#FFFFFF");
    grH.addColorStop(1, "rgb(" + base.r + "," + base.g + "," + base.b + ")");
    cpRoundRect(ctx, CP_SV_X, CP_SV_Y, CP_SV_W, CP_SV_H, R);
    ctx.fillStyle = grH;
    ctx.fill();

    /* transparent → black  (vertical) */
    var grV = ctx.createLinearGradient(CP_SV_X, CP_SV_Y, CP_SV_X, CP_SV_Y + CP_SV_H);
    grV.addColorStop(0, "rgba(0,0,0,0)");
    grV.addColorStop(1, "rgba(0,0,0,1)");
    cpRoundRect(ctx, CP_SV_X, CP_SV_Y, CP_SV_W, CP_SV_H, R);
    ctx.fillStyle = grV;
    ctx.fill();

    /* ── Hue strip ───────────────────────────────── */
    var grHue = ctx.createLinearGradient(CP_HUE_X, 0, CP_HUE_X + CP_HUE_W, 0);
    grHue.addColorStop(0,       "#FF0000");
    grHue.addColorStop(1/6,     "#FFFF00");
    grHue.addColorStop(2/6,     "#00FF00");
    grHue.addColorStop(3/6,     "#00FFFF");
    grHue.addColorStop(4/6,     "#0000FF");
    grHue.addColorStop(5/6,     "#FF00FF");
    grHue.addColorStop(1,       "#FF0000");
    cpRoundRect(ctx, CP_HUE_X, CP_HUE_Y, CP_HUE_W, CP_HUE_H, CP_HUE_H / 2);
    ctx.fillStyle = grHue;
    ctx.fill();

    /* ── Hue handle ──────────────────────────────── */
    var huePct = cpState.hue / 360;
    var hueHx  = CP_HUE_X + huePct * CP_HUE_W;
    var hueHy  = CP_HUE_Y + CP_HUE_H / 2;
    cpDrawHandle(ctx, hueHx, hueHy, 8, hsvToHex(cpState.hue, 1, 1));

    /* ── SV handle ───────────────────────────────── */
    var svHx = CP_SV_X + cpState.sat * CP_SV_W;
    var svHy = CP_SV_Y + (1 - cpState.val) * CP_SV_H;
    cpDrawHandle(ctx, svHx, svHy, 7, hsvToHex(cpState.hue, cpState.sat, cpState.val));
}

function cpCanvasCoords(e) {
    var canvas = el("cpicker-canvas");
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width  / (rect.width  || canvas.width);
    var scaleY = canvas.height / (rect.height || canvas.height);
    return {
        x: ((e.clientX || 0) - rect.left) * scaleX,
        y: ((e.clientY || 0) - rect.top)  * scaleY
    };
}

function updateCPHueFromEvent(e) {
    var c = cpCanvasCoords(e);
    /* clamp to hue strip width */
    var pct = Math.max(0, Math.min(1, (c.x - CP_HUE_X) / CP_HUE_W));
    cpState.hue = pct * 360;
    updateCPColor();
}

function updateCPSVFromEvent(e) {
    var c = cpCanvasCoords(e);
    cpState.sat = Math.max(0, Math.min(1, (c.x - CP_SV_X) / CP_SV_W));
    cpState.val = Math.max(0, Math.min(1, 1 - (c.y - CP_SV_Y) / CP_SV_H));
    updateCPColor();
}

function updateCPColor() {
    var hex = hsvToHex(cpState.hue, cpState.sat, cpState.val);
    el("cpicker-hex").value = hex;
    var prev = el("cpicker-preview");
    if (prev) prev.style.background = hex;
    drawCP();
}

function hexToRgb(hex) {
    hex = hex.replace("#", "");
    var bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, v = max;
    var d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return { h: h, s: s, v: v };
}

function hsvToRgb(h, s, v) {
    h /= 360;
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: return { r: Math.round(v * 255), g: Math.round(t * 255), b: Math.round(p * 255) };
        case 1: return { r: Math.round(q * 255), g: Math.round(v * 255), b: Math.round(p * 255) };
        case 2: return { r: Math.round(p * 255), g: Math.round(v * 255), b: Math.round(t * 255) };
        case 3: return { r: Math.round(p * 255), g: Math.round(q * 255), b: Math.round(v * 255) };
        case 4: return { r: Math.round(t * 255), g: Math.round(p * 255), b: Math.round(v * 255) };
        case 5: return { r: Math.round(v * 255), g: Math.round(p * 255), b: Math.round(q * 255) };
    }
    return { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function hsvToHex(h, s, v) {
    var rgb = hsvToRgb(h, s, v);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
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
    sendResize();
}

function closePresetForm() {
    formOpen = false;
    el("preset-form").className = "preset-form";
    sendResize();
}

function confirmNewPreset() {
    var name = trim(el("inp-preset-name").value);
    if (!name) {
        try { el("inp-preset-name").focus(); } catch(e){}
        return;
    }
    var placeId  = trim(el("inp-place").value);
    var linkCode = trim(el("inp-link").value);
    /* Method 2: share code goes into linkCode, placeId is empty.
       Extract just the code from the URL so it matches at launch time. */
    if (currentMethod === 2) {
        placeId  = "";
        linkCode = trim(el("inp-share-code").value);
        /* Strip full URL — extract code value, same as onLaunch does */
        var m2 = linkCode.match(/[?&]code=([A-Za-z0-9]+(?:&type=Server)?)/i);
        if (m2) linkCode = m2[1];
        /* Also handle roblox:// navigation links */
        var m3 = linkCode.match(/code=([A-Za-z0-9]+)/i);
        if (m3 && !m2) linkCode = m3[1];
    }
    var preset = {
        id:       uid(),
        name:     name,
        placeId:  placeId,
        linkCode: linkCode,
        method:   currentMethod
    };
    presets.push(preset);
    renderPresets();
    closePresetForm();
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:save_preset");
}

function loadPreset(id) {
    var p = findPreset(id);
    if (!p) return;
    lastLoadedPresetId = id;
    if (el("__last_loaded_preset_id")) el("__last_loaded_preset_id").value = id;
    var m = p.method || 1;
    switchMethod(m);
    if (m === 2) {
        var scInp = el("inp-share-code");
        if (scInp) scInp.value = p.linkCode || "";
        el("inp-place").value = "";
        el("inp-link").value  = p.linkCode || "";
    } else {
        el("inp-place").value = p.placeId  || "";
        el("inp-link").value  = p.linkCode || "";
    }
    updateActiveRow();
}

/* Switch .preset-row-active on existing rows — no DOM rebuild at all */
function updateActiveRow() {
    var list = el("presets-list");
    if (!list) return;
    var rows = list.childNodes;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row || !row.getAttribute) continue;
        var rowId = row.getAttribute("data-id");
        var cls = (" " + row.className + " ")
                    .replace(/\s+preset-row-active\s+/g, " ")
                    .replace(/^\s+|\s+$/g, "");
        if (rowId === lastLoadedPresetId) cls += " preset-row-active";
        row.className = cls;
    }
    /* Persist so AHK saves it on close */
    var inp = el("__cfg_last_preset");
    if (inp) inp.value = lastLoadedPresetId || "";
}

/* Update only star buttons without rebuilding the list */
function updateFavButtons() {
    var list = el("presets-list");
    if (!list) return;
    var SL = STRINGS[currentLang] || STRINGS.ru;
    var rows = list.childNodes;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row || !row.querySelectorAll) continue;
        var rowId = row.getAttribute("data-id");
        var isFav = false;
        for (var j = 0; j < presets.length; j++) {
            if (presets[j].id === rowId && presets[j].favorite) { isFav = true; break; }
        }
        /* Find the fav button inside this row */
        var btns = row.getElementsByTagName("button");
        for (var k = 0; k < btns.length; k++) {
            if (btns[k].className.indexOf("preset-fav") !== -1) {
                btns[k].className = isFav ? "preset-fav preset-fav-on" : "preset-fav";
                btns[k].setAttribute("data-tooltip", isFav ? SL.favUnsetTip : SL.favSetTip);
                break;
            }
        }
    }
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
    setDirty();
    sendCmd("CMD:del_preset");
}

function renderPresets() {
    clearPendingDel();

    var n = presets.length;
    var sw = el("search-wrap");
    /* Bug 7: auto-show the search field when there are more than 5
       presets (was 4). Threshold raised so the search box only appears
       once scrolling becomes likely, keeping the UI clean for small
       lists. The field can still be focused at any time via the "/"
       keyboard shortcut (see window.onload handler). */
    var showSearch = n > 5;
    if (sw) sw.style.display = showSearch ? "" : "none";

    renderGroupFilterBar();

    var list = el("presets-list");
    list.innerHTML = "";

    if (n === 0) {
        list.style.display = "none";
        updateEmptyState();
        sendResize();
        return;
    }
    list.style.display = "";
    /* Hide empty state when presets exist */
    var emptyEl = el("empty-state");
    if (emptyEl) emptyEl.style.display = "none";

    var rowCount = 0, headerCount = 0, counter = 0;
    var sectioned = groups.length > 0 && activeGroupFilter === "all";

    if (!sectioned) {
        /* Flat list — identical to the original behaviour. If a specific
           group chip is selected, narrow down to that bucket first.      */
        var flatItems = presets;
        if (groups.length > 0 && activeGroupFilter !== "all") {
            flatItems = [];
            for (var fi = 0; fi < presets.length; fi++) {
                var fp = presets[fi];
                var inBucket = (activeGroupFilter === "ungrouped") ? !fp.groupId : (fp.groupId === activeGroupFilter);
                if (inBucket) flatItems.push(fp);
            }
        }
        for (var i = 0; i < flatItems.length; i++) {
            list.appendChild(buildPresetRow(flatItems[i], counter, flatItems, i));
            counter++; rowCount++;
        }
    } else {
        var buckets = getGroupBuckets();
        for (var bi = 0; bi < buckets.length; bi++) {
            var b = buckets[bi];
            if (b.groupId === null && b.items.length === 0) continue; /* no empty "ungrouped" header */
            var bucketKey = b.groupId || "__ungrouped__";
            var collapsed = !!collapsedGroups[bucketKey];
            list.appendChild(buildGroupHeader(b, collapsed));
            headerCount++;
            if (!collapsed) {
                for (var j = 0; j < b.items.length; j++) {
                    list.appendChild(buildPresetRow(b.items[j], counter, b.items, j));
                    counter++; rowCount++;
                }
            }
        }
    }

    var listH = Math.min(rowCount * ROW_H + headerCount * GROUP_HEADER_H, MAX_VISIBLE * ROW_H);
    list.style.height = listH + "px";

    /* Highlight currently loaded row */
    if (lastLoadedPresetId) {
        var rows = list.childNodes;
        for (var ri = 0; ri < rows.length; ri++) {
            var rn = rows[ri];
            if (rn && rn.getAttribute && rn.getAttribute("data-id") === lastLoadedPresetId) {
                rn.className = rn.className + " preset-row-active";
                break;
            }
        }
    }

    var si = el("search-inp");
    if (si && si.value) applyFilterEnhanced(si.value);

    /* Enhancement: update empty state, status bar, sort bar visibility */
    updateEmptyState();
    updateStatusBar();
    syncSortButtons();

    sendResize();
}

function buildGroupHeader(bucket, collapsed) {
    var bucketKey = bucket.groupId || "__ungrouped__";
    var S = STRINGS[currentLang] || STRINGS.ru;

    var hd = document.createElement("div");
    hd.className = "group-header" + (collapsed ? " group-header-collapsed" : "");
    hd.setAttribute("data-group-key", bucketKey);

    var chev = document.createElement("span");
    chev.className = "group-chevron";
    chev.innerHTML = "&#9656;";

    var dot = document.createElement("span");
    dot.className = "group-header-dot";
    dot.style.background = bucket.group ? bucket.group.color : "#5A5A5A";

    var name = document.createElement("span");
    name.className = "group-header-name";
    name.appendChild(document.createTextNode(bucket.group ? bucket.group.name : (S.ungroupedLabel || "Без группы")));

    var cnt = document.createElement("span");
    cnt.className = "group-header-count";
    cnt.appendChild(document.createTextNode(String(bucket.items.length)));

    hd.appendChild(chev);
    hd.appendChild(dot);
    hd.appendChild(name);
    hd.appendChild(cnt);

    hd.onclick = function () {
        if (collapsedGroups[bucketKey]) delete collapsedGroups[bucketKey];
        else collapsedGroups[bucketKey] = true;
        renderPresets();
    };

    return hd;
}

function formatRelativeTime(ts) {
    if (!ts) return "Never";
    var diff  = Date.now() - ts;
    var mins  = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days  = Math.floor(diff / 86400000);
    var S = STRINGS[currentLang] || STRINGS.ru;
    if (mins  <  1) return S.justNow;
    if (mins  < 60) return S.minsAgo(mins);
    if (hours < 24) return S.hoursAgo(hours);
    if (days  < 30) return S.daysAgo(days);
    var d = new Date(ts);
    return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
}

function buildPresetRow(p, dispIdx, bucketItems, posInBucket) {
    var row = document.createElement("div");
    row.className = "preset-row";
    row.setAttribute("data-id", p.id);
    row.setAttribute("data-group", p.groupId || "__ungrouped__");

    var isFirst = posInBucket === 0;
    var isLast  = posInBucket === bucketItems.length - 1;

    var dz = document.createElement("span");
    dz.className = "preset-drag";
    dz.onmousedown = makeDragger(p.id);
    dz.setAttribute("data-tooltip", (STRINGS[currentLang] || STRINGS.ru).dragTip);

    var grip = document.createElement("span");
    grip.className = "preset-grip";

    var arrows = document.createElement("span");
    arrows.className = "preset-arrows";

    var upBtn = document.createElement("span");
    upBtn.className = "preset-arrow preset-up" + (isFirst ? " preset-arrow-dis" : "");
    upBtn.innerHTML = "&#9650;";
    if (!isFirst) upBtn.onclick = makeMover(p.id, -1);
    else upBtn.style.cursor = "default";

    var dnBtn = document.createElement("span");
    dnBtn.className = "preset-arrow preset-dn" + (isLast ? " preset-arrow-dis" : "");
    dnBtn.innerHTML = "&#9660;";
    if (!isLast) dnBtn.onclick = makeMover(p.id, 1);
    else dnBtn.style.cursor = "default";

    arrows.appendChild(upBtn);
    arrows.appendChild(dnBtn);
    dz.appendChild(grip);
    dz.appendChild(arrows);

    var dot = document.createElement("span");
    dot.className = "preset-dot";
    dot.style.background = DOT_COLORS[dispIdx % DOT_COLORS.length];
    dot.appendChild(document.createTextNode(dispIdx + 1));

    var name = document.createElement("span");
    name.className = "preset-name";
    name.appendChild(document.createTextNode(p.name));

    var sub = document.createElement("span");
    sub.className = "preset-sub";
    if ((p.method || 1) === 2) {
        sub.appendChild(document.createTextNode("SC " + abbrev(p.linkCode, 8)));
    } else {
        sub.appendChild(document.createTextNode("ID " + abbrev(p.placeId, 8)));
    }

    var hkEl = document.createElement("span");
    var SL = STRINGS[currentLang] || STRINGS.ru;
    if (capturePresetId === p.id) {
        hkEl.className = "preset-hk preset-hk-capturing";
        hkEl.innerHTML = "&#183;&#183;&#183;";
        hkEl.setAttribute("data-tooltip", "Press any key (Esc to cancel)");
    } else if (p.hotkey) {
        hkEl.className = "preset-hk preset-hk-set";

        var keySpan = document.createElement("span");
        keySpan.className = "preset-hk-key";
        keySpan.setAttribute("data-tooltip", SL.reassignTip);
        keySpan.appendChild(document.createTextNode(p.hotkey));
        keySpan.onclick = makePresetHKStarter(p.id);

        var clrBtn = document.createElement("span");
        clrBtn.className = "preset-hk-clear";
        clrBtn.innerHTML = "&#215;";
        clrBtn.setAttribute("data-tooltip", SL.removeHkTip);
        clrBtn.onclick = makePresetHKClearer(p.id);

        hkEl.appendChild(keySpan);
        hkEl.appendChild(clrBtn);
    } else {
        hkEl.className = "preset-hk preset-hk-add";
        hkEl.innerHTML = "+HK";
        hkEl.setAttribute("data-tooltip", SL.assignHkTip);
        hkEl.onclick   = makePresetHKStarter(p.id);
    }

    var cnt = null;
    if (p.launches > 0) {
        cnt = document.createElement("span");
        cnt.className = "preset-cnt";
        cnt.appendChild(document.createTextNode("\xD7" + p.launches));
        var SL2 = STRINGS[currentLang] || STRINGS.ru;
        var lastStr = p.lastLaunch ? formatRelativeTime(p.lastLaunch) : "—";
        cnt.setAttribute("data-tooltip", SL2.launchCount(p.launches) + " \xB7 " + SL2.lastLabel + ": " + lastStr);
    }

    var load = document.createElement("button");
    load.className = "preset-load";
    load.innerHTML = (STRINGS[currentLang] || STRINGS.ru).loadBtn;
    load.setAttribute("data-pid", p.id);
    load.onclick = makeLoader(p.id);

    var fav = document.createElement("button");
    fav.className = "preset-fav" + (p.favorite ? " preset-fav-on" : "");
    fav.innerHTML = "&#9733;"; /* ★ */
    fav.setAttribute("data-pid", p.id);
    fav.setAttribute("data-tooltip", p.favorite
        ? (SL.favUnsetTip  || "Убрать из избранного")
        : (SL.favSetTip    || "Сделать избранным"));
    fav.onclick = makeFavToggler(p.id);

    var del = document.createElement("button");
    del.className = "preset-del";
    del.innerHTML = "&#215;";
    del.setAttribute("data-pid", p.id);
    del.onclick = makeDeleter(p.id, del);

    /* Duplicate button */
    var dup = document.createElement("button");
    dup.className = "preset-dup";
    dup.innerHTML = "&#10064;";
    dup.setAttribute("data-pid", p.id);
    dup.setAttribute("data-tooltip", (STRINGS[currentLang] || STRINGS.ru).dupTip || "Дублировать");
    dup.onclick = makeDuplicator(p.id);

    /* Duplicate indicator */
    var dupKey = p.placeId + "|" + p.linkCode;
    var dupCount = 0;
    for (var di = 0; di < presets.length; di++) {
        if (presets[di].placeId + "|" + presets[di].linkCode === dupKey) dupCount++;
    }
    var dupInd = null;
    if (dupCount > 1) {
        dupInd = document.createElement("span");
        dupInd.className = "preset-dup-indicator";
        dupInd.innerHTML = "&#215;" + dupCount;
        var SLD = STRINGS[currentLang] || STRINGS.ru;
        dupInd.setAttribute("data-tooltip", SLD.dupIndicatorTip ? SLD.dupIndicatorTip(dupCount) : (dupCount + " дубликата"));
    }

    /* Edit IDs button */
    var editBtn = document.createElement("button");
    editBtn.className = "preset-edit-ids";
    editBtn.innerHTML = "&#9998;";
    editBtn.setAttribute("data-pid", p.id);
    editBtn.setAttribute("data-tooltip", (STRINGS[currentLang] || STRINGS.ru).editPresetTip || "Редактировать");
    editBtn.onclick = makeIdEditor(p.id);

    name.ondblclick = makeRenameStarter(p.id, name);
    /* Rich preview tooltip with Place ID, Link Code, launches, last launch */
    name.setAttribute("data-tooltip-html", buildPresetPreview(p));
    name.removeAttribute("data-tooltip");

    /* Copy link button (enhancement B1) */
    var copyBtn = document.createElement("button");
    copyBtn.className = "preset-copy";
    copyBtn.innerHTML = "&#9998;";
    copyBtn.setAttribute("data-pid", p.id);
    copyBtn.setAttribute("data-tooltip", (STRINGS[currentLang] || STRINGS.ru).copyLinkTip || "Копировать ссылку");
    copyBtn.onclick = makeCopyLinker(p.id);

    row.appendChild(dz);
    row.appendChild(dot);
    row.appendChild(name);
    if (dupInd) row.appendChild(dupInd);
    row.appendChild(sub);
    row.appendChild(hkEl);
    if (cnt) row.appendChild(cnt);
    row.appendChild(load);
    row.appendChild(fav);
    row.appendChild(copyBtn);
    row.appendChild(editBtn);
    row.appendChild(dup);
    row.appendChild(del);

    return row;
}

function makeLoader(id)  { return function () { loadPreset(id); }; }
function makeDuplicator(id) {
    return function (e) { e = e || window.event; cancelEv(e); duplicatePreset(id); };
}
function duplicatePreset(id) {
    var src = findPreset(id);
    if (!src) return;
    var copy = { id:uid(), name:src.name+" (2)", placeId:src.placeId, linkCode:src.linkCode, hotkey:"", launches:0, lastLaunch:0 };
    var idx = -1;
    for (var i = 0; i < presets.length; i++) { if (presets[i].id === id) { idx = i; break; } }
    if (idx >= 0) presets.splice(idx + 1, 0, copy);
    else presets.push(copy);
    flushPresetsOut();
    renderPresets(); /* renderPresets already calls sendResize internally */
}
function makeIdEditor(id) {
    return function (e) { e = e || window.event; cancelEv(e); openPresetEditModal(id); };
}
function makeDeleter(id, btn) {
    return function (e) {
        e = e || window.event;
        cancelEv(e);
        showDeleteConfirm(id, btn);
    };
}
function makeRenameStarter(id, nameSpan) {
    return function (e) {
        e = e || window.event;
        cancelEv(e);
        startRename(id, nameSpan);
    };
}
function makePresetHKStarter(id) {
    return function (e) {
        e = e || window.event;
        cancelEv(e);
        startPresetHKCapture(id);
    };
}
function makePresetHKClearer(id) {
    return function (e) {
        e = e || window.event;
        cancelEv(e);
        clearPresetHK(id);
    };
}

function makeFavToggler(id) {
    return function (e) {
        e = e || window.event;
        cancelEv(e);
        toggleFavorite(id);
    };
}

function toggleFavorite(id) {
    /* Multiple presets can be starred simultaneously */
    var p = findPreset(id);
    if (!p) return;
    if (p.favorite) {
        delete p.favorite;
    } else {
        p.favorite = true;
    }
    /* Sync global favoritePresetId: used for tray / quick-launch.
       Rules: 1 fav → that one. Multiple favs → last loaded among them.
              0 favs → null.                                            */
    var favs = [];
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].favorite) favs.push(presets[i].id);
    }
    if (favs.length === 0) {
        favoritePresetId = null;
    } else if (favs.length === 1) {
        favoritePresetId = favs[0];
    } else {
        /* Keep favoritePresetId pointing to the last loaded fav if it's
           still starred, otherwise fall back to the most-recently-launched */
        var stillFav = false;
        for (var j = 0; j < favs.length; j++) {
            if (favs[j] === favoritePresetId) { stillFav = true; break; }
        }
        if (!stillFav) {
            /* Pick the favourite with the latest lastLaunch timestamp */
            var best = null, bestTs = -1;
            for (var k = 0; k < presets.length; k++) {
                if (presets[k].favorite) {
                    var ts = presets[k].lastLaunch || 0;
                    if (ts > bestTs) { bestTs = ts; best = presets[k].id; }
                }
            }
            favoritePresetId = best;
        }
    }
    updateFavButtons();
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:save_preset");
}

function flushPresetHKMap() {
    var parts = [];
    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        if (p.hotkey) parts.push(p.hotkey + "|" + p.placeId + "|" + p.linkCode + "|" + (p.method || 1) + "|" + p.id);
    }
    el("__preset_hk_map").value = parts.join(";");
}

function startPresetHKCapture(id) {
    if (capturePresetId) return;
    capturePresetId = id;
    el("__preset_hk_pending").value = id;
    renderPresets();
    sendCmd("CMD:capture_preset_hk");
}

function finishPresetHKCapture(keyName) {
    var id = capturePresetId;
    capturePresetId = null;
    el("__preset_hk_pending").value = "";
    if (!id) { renderPresets(); return; }
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) {
            presets[i].hotkey = keyName || "";
            break;
        }
    }
    flushPresetHKMap();
    renderPresets();
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:save_preset");
}

function clearPresetHK(id) {
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) { presets[i].hotkey = ""; break; }
    }
    flushPresetHKMap();
    renderPresets();
    flushPresetsOut();
    sendCmd("CMD:update_preset_hk");
}

function makeMover(id, dir) {
    return function (e) {
        e = e || window.event;
        cancelEv(e);
        movePreset(id, dir);
    };
}
function makeDragger(id) {
    return function (e) {
        e = e || window.event;
        if (e.button !== 0) return;
        var t = e.target || e.srcElement;
        if (t && (hasClass(t, "preset-up") || hasClass(t, "preset-dn"))) return;
        var rowEl = findRowById(id);
        if (!rowEl) return;
        var r = rowEl.getBoundingClientRect();
        drag.pending = true;
        drag.on      = false;
        drag.srcId   = id;
        drag.bucket  = rowEl.getAttribute("data-group") || "__ungrouped__";
        drag.sx      = e.clientX || 0;
        drag.sy      = e.clientY || 0;
        drag.ox      = (e.clientX || 0) - r.left;
        drag.oy      = (e.clientY || 0) - r.top;
        document.onmousemove = onDragMove;
        document.onmouseup   = onDragUp;
    };
}

function showDeleteConfirm(id, btn) {
    if (pendingDelId === id) {
        clearPendingDel();
        deletePresetWithUndo(id);
        return;
    }
    clearPendingDel();
    pendingDelId  = id;
    pendingDelBtn = btn;
    btn.innerHTML = (STRINGS[currentLang] || STRINGS.ru).sureText;
    btn.className = "preset-del preset-del-confirm";

    /* IE11 does not restart ::after animations when className changes.
       Force a reflow by briefly removing and re-adding the class.      */
    btn.className = "preset-del";
    void btn.offsetWidth; /* trigger reflow */
    btn.className = "preset-del preset-del-confirm";

    pendingDelTmr = setTimeout(function () { clearPendingDel(); }, 2500);
}

function clearPendingDel() {
    if (pendingDelTmr) { clearTimeout(pendingDelTmr); pendingDelTmr = null; }
    if (pendingDelBtn) {
        pendingDelBtn.innerHTML = "&#215;";
        pendingDelBtn.className = "preset-del";
        pendingDelBtn = null;
    }
    pendingDelId = null;
}

function startRename(id, nameSpan) {
    if (renamingId) return;
    renamingId = id;
    clearPendingDel();

    var p = findPreset(id);
    var inp = document.createElement("input");
    inp.type       = "text";
    inp.value      = p ? p.name : "";
    inp.className  = "preset-rename-inp";
    inp.maxLength  = 32;
    inp.spellcheck = false;

    inp.onkeydown = function (e) {
        e = e || window.event;
        var k = e.keyCode || e.which;
        if (k === 13) confirmRename(id, inp, nameSpan);
        if (k === 27) cancelRename(inp, nameSpan);
    };
    inp.onblur = function () { confirmRename(id, inp, nameSpan); };

    nameSpan.parentNode.insertBefore(inp, nameSpan);
    nameSpan.style.display = "none";
    try { inp.focus(); inp.select(); } catch (e) {}
}

function confirmRename(id, inp, nameSpan) {
    if (!inp.parentNode) return;
    inp.onblur = null;
    var newName = trim(inp.value);
    inp.parentNode.removeChild(inp);
    nameSpan.style.display = "";
    renamingId = null;
    if (!newName) return;
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) {
            presets[i].name = newName;
            nameSpan.innerHTML = "";
            nameSpan.appendChild(document.createTextNode(newName));
            break;
        }
    }
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:save_preset");
}

function cancelRename(inp, nameSpan) {
    if (!inp.parentNode) return;
    inp.onblur = null;
    inp.parentNode.removeChild(inp);
    nameSpan.style.display = "";
    renamingId = null;
}

function applyFilter(query) {
    var q = trim(query || "").toLowerCase();
    var list = el("presets-list");
    var kids = list.childNodes;
    var visibleCountByGroup = {};
    var i, n;

    for (i = 0; i < kids.length; i++) {
        n = kids[i];
        if (!n || n.nodeType !== 1 || !hasClass(n, "preset-row")) continue;
        var id = n.getAttribute("data-id");
        var p  = findPreset(id);
        var match = !q || (p && p.name.toLowerCase().indexOf(q) >= 0);
        n.style.display = match ? "" : "none";
        if (match) {
            var gk = n.getAttribute("data-group") || "__ungrouped__";
            visibleCountByGroup[gk] = (visibleCountByGroup[gk] || 0) + 1;
        }
    }

    /* Hide section headers with zero matches while searching; collapsed
       headers (rows not rendered) are left alone since we can't verify
       their match-count, and always re-shown once the query is cleared. */
    for (i = 0; i < kids.length; i++) {
        n = kids[i];
        if (!n || n.nodeType !== 1 || !hasClass(n, "group-header")) continue;
        if (hasClass(n, "group-header-collapsed")) { n.style.display = ""; continue; }
        var key = n.getAttribute("data-group-key");
        var show = !q || (visibleCountByGroup[key] > 0);
        n.style.display = show ? "" : "none";
    }
}

function updateRobloxStatus() {
    var val = el("__roblox_status") ? el("__roblox_status").value : "0";
    var dot = el("roblox-status");
    if (!dot) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    if (val === "1") {
        dot.className = "roblox-status roblox-on";
        dot.setAttribute("data-tooltip", S.robloxOn);
    } else {
        dot.className = "roblox-status";
        dot.setAttribute("data-tooltip", S.robloxOff);
    }
}

function importPresetsFromAHK() {
    var raw = el("__import_data").value;
    el("__import_data").value = "";
    if (!raw) return;
    try {
        var imported = JSON.parse(raw);
        if (!isArray(imported) || !imported.length) return;
        presets = imported;
        flushPresetHKMap();
        renderPresets();
        flushPresetsOut();
        setDirty();
        sendCmd("CMD:save_preset");
    } catch (e) { /* invalid JSON – ignore */ }
}

function importThemePresetsFromAHK() {
    var raw = el("__import_theme_data").value;
    el("__import_theme_data").value = "";
    if (!raw) return;
    try {
        var imported = JSON.parse(raw);
        if (!isArray(imported)) return;
        userThemePresets = imported;
        renderTPGrid();
        flushThemePresetsOut();
        sendCmd("CMD:settings_save");
    } catch (e) { /* invalid JSON – ignore */ }
}

function movePreset(id, dir) {
    var buckets = getGroupBuckets();
    for (var bi = 0; bi < buckets.length; bi++) {
        var items = buckets[bi].items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                var j = i + dir;
                if (j < 0 || j >= items.length) return; /* edge of its own group — no-op */
                var ids = [];
                for (var k = 0; k < items.length; k++) ids.push(items[k].id);
                relocateById(id, ids, i, j);
                renderPresets();
                flushPresetsOut();
                setDirty();
                sendCmd("CMD:save_preset");
                return;
            }
        }
    }
}

/* Buckets presets into their group "folders", preserving each bucket's
   relative order. Always returns groups in `groups` array order, with
   the ungrouped bucket last. Recomputed fresh each time — cheap, since
   preset/group counts are small.                                       */
function getGroupBuckets() {
    var buckets = [];
    var byId = {};
    for (var gi = 0; gi < groups.length; gi++) {
        var b = { groupId: groups[gi].id, group: groups[gi], items: [] };
        buckets.push(b);
        byId[groups[gi].id] = b;
    }
    var ungrouped = { groupId: null, group: null, items: [] };
    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        var b = (p.groupId && byId[p.groupId]) ? byId[p.groupId] : ungrouped;
        b.items.push(p);
    }
    buckets.push(ungrouped);
    return buckets;
}

function findGroup(id) {
    for (var i = 0; i < groups.length; i++) {
        if (groups[i].id === id) return groups[i];
    }
    return null;
}

function hasClass(node, cls) {
    return node.className && node.className.indexOf(cls) >= 0;
}

function getPresetRows() {
    var list = el("presets-list");
    var kids = list.childNodes;
    var rows = [];
    for (var i = 0; i < kids.length; i++) {
        var n = kids[i];
        if (n.nodeType === 1 && hasClass(n, "preset-row") &&
            !hasClass(n, "preset-ghost") && !hasClass(n, "preset-dropline")) {
            rows.push(n);
        }
    }
    return rows;
}

function findRowById(id) {
    var rows = getPresetRows();
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].getAttribute("data-id") === id) return rows[i];
    }
    return null;
}

/* Rows belonging to the same group "bucket" as the dragged item — keeps
   reordering scoped to one folder/section at a time, so a drag can never
   silently re-parent a preset into a different group.                  */
function getBucketRows(bucketKey) {
    var rows = getPresetRows();
    var out = [];
    for (var i = 0; i < rows.length; i++) {
        var k = rows[i].getAttribute("data-group") || "__ungrouped__";
        if (k === bucketKey) out.push(rows[i]);
    }
    return out;
}

function getDropIdx(clientY, bucketKey) {
    var rows = getBucketRows(bucketKey);
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i].getBoundingClientRect();
        if (clientY < r.top + r.height / 2) return i;
    }
    return rows.length;
}

function activateDrag() {
    var srcRow = findRowById(drag.srcId);
    if (!srcRow) return;
    var list = el("presets-list");

    var nameEls  = srcRow.getElementsByClassName("preset-name");
    var nameText = nameEls.length ? nameEls[0].innerHTML : "";

    var g = document.createElement("div");
    g.className    = "preset-ghost";
    g.style.width  = srcRow.offsetWidth + "px";
    g.style.left   = (drag.sx - drag.ox) + "px";
    g.style.top    = (drag.sy - drag.oy) + "px";
    g.innerHTML    = '<span style="font-size:11.5px;color:#CCCCCC;padding:0 14px;">' + nameText + '</span>';
    document.body.appendChild(g);

    var ln = document.createElement("div");
    ln.className     = "preset-dropline";
    ln.style.display = "none";
    list.appendChild(ln);

    drag.ghost = g;
    drag.line  = ln;
    srcRow.className = "preset-row pl-row preset-row-dragging";
}

function onDragMove(e) {
    e = e || window.event;
    var cx = e.clientX || 0;
    var cy = e.clientY || 0;

    if (!drag.on && drag.pending) {
        if (Math.abs(cx - drag.sx) > DRAG_THRESH || Math.abs(cy - drag.sy) > DRAG_THRESH) {
            drag.on      = true;
            drag.pending = false;
            activateDrag();
        }
    }

    if (drag.on) {
        drag.ghost.style.left = (cx - drag.ox) + "px";
        drag.ghost.style.top  = (cy - drag.oy) + "px";

        /* Drop targets are constrained to the dragged preset's own group
           bucket — the line clamps to that section's edges rather than
           ever crossing into a different group's rows.                 */
        var ti   = getDropIdx(cy, drag.bucket);
        var rows = getBucketRows(drag.bucket);
        var list = el("presets-list");
        var lr   = list.getBoundingClientRect();
        var lineY;

        if (rows.length === 0) {
            lineY = 0;
        } else if (ti < rows.length) {
            lineY = rows[ti].getBoundingClientRect().top - lr.top + list.scrollTop;
        } else {
            var last = rows[rows.length - 1].getBoundingClientRect();
            lineY = last.bottom - lr.top + list.scrollTop;
        }
        drag.line.style.display = "block";
        drag.line.style.top     = (lineY - 1) + "px";

        return cancelEv(e);
    }
}

function onDragUp(e) {
    e = e || window.event;
    document.onmousemove = null;
    document.onmouseup   = null;

    if (drag.on) {
        var rows = getBucketRows(drag.bucket);
        var ti   = getDropIdx(e.clientY || 0, drag.bucket);

        if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
        if (drag.line  && drag.line.parentNode)  drag.line.parentNode.removeChild(drag.line);
        drag.ghost = null;
        drag.line  = null;

        var si = -1;
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].getAttribute("data-id") === drag.srcId) { si = i; break; }
        }
        var di = (si !== -1 && ti > si) ? ti - 1 : ti;

        if (si !== -1 && di !== si) {
            relocateWithinBucket(drag.srcId, rows, si, di);
            flushPresetsOut();
            setDirty();
            sendCmd("CMD:save_preset");
        }
        renderPresets();
    }

    drag.on = false; drag.pending = false; drag.srcId = null; drag.bucket = null;
}

/* ── Id-based relocation core ─────────────────────────────────
   Moves preset `srcId` to position `di` within the ordered id list
   `ids` (its current display bucket, where it currently sits at `si`),
   then re-splices it into the *real* presets array right next to the
   same neighbour — regardless of how other groups' presets are
   interleaved in that real array. This is what makes reordering safe
   inside grouped/sectioned views. (Verified against unit tests covering
   interior/edge/single-item-bucket moves before being wired in here.)  */
function relocateById(srcId, ids, si, di) {
    if (si === di) return;
    var newIds = ids.slice();
    var moved = newIds.splice(si, 1)[0];
    newIds.splice(di, 0, moved);

    var idxInIds = newIds.indexOf(srcId);
    var beforeId = (idxInIds + 1 < newIds.length) ? newIds[idxInIds + 1] : null;
    var afterAnchorId = (idxInIds > 0) ? newIds[idxInIds - 1] : null;

    var srcIdx = -1, k;
    for (k = 0; k < presets.length; k++) if (presets[k].id === srcId) { srcIdx = k; break; }
    if (srcIdx === -1) return;
    var item = presets.splice(srcIdx, 1)[0];

    if (beforeId) {
        var beforeIdx = -1;
        for (k = 0; k < presets.length; k++) if (presets[k].id === beforeId) { beforeIdx = k; break; }
        presets.splice(beforeIdx === -1 ? presets.length : beforeIdx, 0, item);
    } else if (afterAnchorId) {
        var afterIdx = -1;
        for (k = 0; k < presets.length; k++) if (presets[k].id === afterAnchorId) { afterIdx = k; break; }
        presets.splice(afterIdx === -1 ? presets.length : afterIdx + 1, 0, item);
    } else {
        presets.push(item); /* only item in its bucket */
    }
}

function relocateWithinBucket(srcId, bucketRowEls, si, di) {
    var ids = [];
    for (var i = 0; i < bucketRowEls.length; i++) ids.push(bucketRowEls[i].getAttribute("data-id"));
    relocateById(srcId, ids, si, di);
}

/* ============================================================
   HOTKEY CAPTURE
   ============================================================ */
function startCapture() {
    if (capturingKey) return;
    capturingKey = true;

    var btn = el("btn-capture");
    btn.innerHTML = '<span class="ir-hk-capture-ring"></span>';
    btn.className = "btn-capture ir-hk-capture capturing";

    sendCmd("CMD:capture_start");
}

function stopCaptureExternal(keyName) {
    capturingKey = false;
    var btn = el("btn-capture");
    btn.innerHTML = '<span class="ir-hk-capture-ring"></span>';
    btn.className = "btn-capture ir-hk-capture";

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
    var wrap = track.parentNode;
    if (wrap) wrap.className = on ? "chk-wrap chk-on" : "chk-wrap";
}

/* ============================================================
   TOOLTIPS
   ============================================================ */
var _tipOver = null;
var _tipOut  = null;
var _tipCurrentTarget = null;

function initTooltips() {
    var tooltip = el("app-tooltip");
    if (!tooltip) return;

    // Strip native title='' so browser doesn't show its own box
    var all = document.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) {
        if (all[i].getAttribute && all[i].getAttribute("data-tooltip") && all[i].getAttribute("title")) {
            all[i].removeAttribute("title");
        }
    }

    var arrow   = tooltip.querySelector(".tooltip-arrow");
    var content = el("tooltip-content") || tooltip;

    _tipOver = function (e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        var from   = e.relatedTarget || e.fromElement;

        var tipEl = null, tipText = "", tipHtml = "";
        var node = target;
        while (node && node !== document.body) {
            tipText = getTooltipText(node);
            tipHtml = getTooltipHtml(node);
            if (tipText || tipHtml) { tipEl = node; break; }
            node = node.parentNode;
        }
        if (!tipEl) return;
        if (from && contains(tipEl, from)) return;

        _tipCurrentTarget = tipEl;
        /* Use HTML content if available (rich preview), else escaped text */
        if (tipHtml) {
            content.innerHTML = tipHtml;
            tooltip.className = "app-tooltip visible preset-preview-tip";
        } else {
            content.innerHTML = htmlEscape(tipText);
            tooltip.className = "app-tooltip visible";
        }

        /* getBoundingClientRect gives real screen position even inside
           scrolled containers. Divide by uiScale to get body-local px. */
        var bodyRect = document.body.getBoundingClientRect();
        var elRect   = tipEl.getBoundingClientRect();
        var sc       = 1 / (uiScale || 1);

        var elL      = (elRect.left  - bodyRect.left) * sc;
        var elT      = (elRect.top   - bodyRect.top)  * sc;
        var elW      = elRect.width  * sc;
        var elH      = elRect.height * sc;

        var tipW     = tooltip.offsetWidth || 130;
        var bodyW    = BASE_W;
        var bodyH    = document.body.offsetHeight || bodyRect.height * sc;
        var elCenter = elL + elW / 2;
        var left     = elCenter - tipW / 2;

        if (left + tipW > bodyW - 10) left = bodyW - tipW - 10;
        if (left < 6) left = 6;

        var top      = elT + elH + 6;
        var tipH     = tooltip.offsetHeight || 40;
        var flipped  = false;
        if (top + tipH > bodyH - 6) {
            top = elT - tipH - 6; /* flip above when there's no room below */
            if (top < 6) top = 6;
            flipped = true;
        }

        tooltip.style.left = left + "px";
        tooltip.style.top  = top + "px";

        if (arrow) {
            arrow.style.left       = (elCenter - left - 4) + "px";
            arrow.style.marginLeft = "0";
            if (flipped) {
                arrow.style.top            = "auto";
                arrow.style.bottom         = "-5px";
                arrow.style.transform      = "rotate(225deg)";
                arrow.style.msTransform    = "rotate(225deg)";
            } else {
                arrow.style.top            = "-5px";
                arrow.style.bottom         = "auto";
                arrow.style.transform      = "rotate(45deg)";
                arrow.style.msTransform    = "rotate(45deg)";
            }
        }
    };

    _tipOut = function (e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        var to     = e.relatedTarget || e.toElement;

        if (!_tipCurrentTarget) return;
        if (target !== _tipCurrentTarget && !contains(_tipCurrentTarget, target)) return;
        if (to && contains(_tipCurrentTarget, to)) return;

        tooltip.className   = "app-tooltip";
        _tipCurrentTarget   = null;
    };
    if (tooltipsEnabled) bindTooltipHandlers();
}

function bindTooltipHandlers() {
    if (!_tipOver) return;
    if (document.addEventListener) {
        document.addEventListener("mouseover", _tipOver, false);
        document.addEventListener("mouseout",  _tipOut,  false);
    } else if (document.attachEvent) {
        document.attachEvent("onmouseover", _tipOver);
        document.attachEvent("onmouseout",  _tipOut);
    }
}

function unbindTooltipHandlers() {
    if (!_tipOver) return;
    if (document.removeEventListener) {
        document.removeEventListener("mouseover", _tipOver, false);
        document.removeEventListener("mouseout",  _tipOut,  false);
    } else if (document.detachEvent) {
        document.detachEvent("onmouseover", _tipOver);
        document.detachEvent("onmouseout",  _tipOut);
    }
    // hide any visible tip
    var tooltip = el("app-tooltip");
    if (tooltip) tooltip.className = "app-tooltip";
    _tipCurrentTarget = null;
}

function getTooltipText(el) {
    if (!el || !el.getAttribute) return "";
    return el.getAttribute("data-tooltip") || "";
}

function getTooltipHtml(el) {
    if (!el || !el.getAttribute) return "";
    return el.getAttribute("data-tooltip-html") || "";
}

function getAbsPos(el) {
    var x = 0, y = 0;
    while (el) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent;
    }
    return {x: x, y: y};
}

function contains(parent, child) {
    if (!parent || !child) return false;
    while (child) {
        if (child === parent) return true;
        child = child.parentNode;
    }
    return false;
}

function htmlEscape(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ============================================================
   AHK BRIDGE HELPERS
   ============================================================ */
function flushPresetsOut() {
    try {
        el("__presets_out").value = JSON.stringify(presets);
    } catch (e) {}
}

function flushThemePresetsOut() {
    try {
        el("__theme_presets_out").value = JSON.stringify(userThemePresets);
    } catch (e) {}
}

function flushGroupsOut() {
    try {
        el("__preset_groups_out").value = JSON.stringify(groups);
    } catch (e) {}
}

function sendCmd(cmd) {
    /* Push command into the queue hidden input. AHK drains the queue
       every tick (50ms) and processes each line. This replaces the old
       document.title approach which lost commands fired within the same
       50ms polling window (e.g. CMD:save_preset immediately followed by
       CMD:hotkey_update). The queue is newline-delimited; AHK splits on
       \n and processes each non-empty line. */
    try {
        var q = el("__cmd_queue");
        if (!q) {
            /* Fallback: if bridge input missing, use title (legacy mode) */
            document.title = cmd;
            return;
        }
        var cur = q.value || "";
        if (cur.length > 0 && cur.charAt(cur.length - 1) !== "\n") {
            cur += "\n";
        }
        q.value = cur + cmd + "\n";
        /* Keep the legacy title bridge alive as well. This lets a newer UI
           talk to an older RVL.ahk binary during the first self-update. */
        document.title = cmd;
    } catch (e) {
        /* Last-resort fallback: title-based signalling */
        document.title = cmd;
    }
}

/* ============================================================
   TITLEBAR METRICS — JS reports actual rendered titlebar height
   and control-zone width so AHK's WM_NCHITTEST can compute the
   draggable region correctly at any scale factor.
   ============================================================ */
function publishTitlebarMetrics() {
    try {
        var tb = el("titlebar");
        if (tb) {
            var h = tb.offsetHeight || 46;
            var th = el("__titlebar_h");
            if (th) th.value = String(h);
        }
        var ctrls = document.getElementById("titlebar");
        if (ctrls) {
            /* Measure the right-side control cluster width.
               We approximate by querying the tb-controls element. */
            var tc = ctrls.querySelector(".tb-controls");
            if (tc) {
                var w = tc.offsetWidth || 100;
                /* Add right padding of titlebar (6px) + small margin */
                var cw = el("__ctrl_zone_w");
                if (cw) cw.value = String(w + 12);
            }
        }
    } catch (e) { /* metrics are best-effort; defaults remain */ }
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

function ra_hex(hex, alpha) {
    hex = (hex || "FFFFFF").replace("#", "");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var rv = parseInt(hex.substr(0,2), 16);
    var gv = parseInt(hex.substr(2,2), 16);
    var bv = parseInt(hex.substr(4,2), 16);
    return "rgba(" + rv + "," + gv + "," + bv + "," + alpha + ")";
}

function onFactoryResetClick() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var confirmMsg = S.factoryResetConfirm || "Сбросить всё к заводским настройкам?";
    var btn = el("btn-factory-reset");
    if (btn.getAttribute("data-confirm") === "1") {
        /* Second click — do it */
        btn.removeAttribute("data-confirm");
        btn.className = "btn-factory-reset";
        sendCmd("CMD:factory_reset");
    } else {
        /* First click — ask confirmation inline */
        btn.setAttribute("data-confirm", "1");
        btn.className = "btn-factory-reset btn-factory-confirm";
        var confirmText = S.factoryResetConfirmBtn || "Да, сбросить";
        setText("btn-factory-reset", confirmText);
        /* Auto-cancel after 4s */
        setTimeout(function () {
            if (!btn) return;
            btn.removeAttribute("data-confirm");
            btn.className = "btn-factory-reset";
            setText("btn-factory-reset", S.factoryResetBtn || "Сбросить к заводским");
        }, 4000);
    }
}


function cancelFactoryConfirm() {
    var btn = el("btn-factory-reset");
    if (!btn) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    btn.removeAttribute("data-confirm");
    btn.className = "btn-factory-reset";
    setText("btn-factory-reset", S.factoryResetBtn || "Сбросить к заводским");
}

/* Returns inline style objects matching the current theme for the edit modal.
   Inline styles are used (instead of class + CSS) so the modal matches the
   active theme reliably inside IE's WebBrowser control, where class-based
   cascade can break for dynamically-appended elements.                       */
function getPresetEditTheme() {
    if (themeMode === "custom") {
        var B = customTheme.bg || "#0A0A0A";
        var SR = customTheme.surface || "#111111";
        var T  = customTheme.text   || "#E8E8E8";
        var A  = customTheme.accent || "#FFFFFF";
        return {
            modal:  { background: SR, borderColor: ra_hex(A, 0.27) },
            title:  { color: ra_hex(T, 0.55) },
            label:  { color: ra_hex(T, 0.40) },
            inp:    { background: B, borderColor: ra_hex(A, 0.22), color: T },
            saveBg: A, saveColor: B,
            cancel: { borderColor: ra_hex(T, 0.20), color: ra_hex(T, 0.45) }
        };
    } else if (themeMode === "light") {
        return {
            modal:  { background: "#FFFFFF", borderColor: "#DDDDE8" },
            title:  { color: "#666677" },
            label:  { color: "#999999" },
            inp:    { background: "#F5F5FA", borderColor: "#DDDDE8", color: "#222233" },
            saveBg: "#111111", saveColor: "#FFFFFF",
            cancel: { borderColor: "#CCCCDD", color: "#888899" }
        };
    } else {
        /* dark (default) */
        return {
            modal:  { background: "#0F0F0F", borderColor: "#252525" },
            title:  { color: "#777788" },
            label:  { color: "#444455" },
            inp:    { background: "#111111", borderColor: "#252525", color: "#E8E8E8" },
            saveBg: "#FFFFFF", saveColor: "#000000",
            cancel: { borderColor: "#252525", color: "#555566" }
        };
    }
}

function applyStyleObj(el, styleObj) {
    for (var k in styleObj) {
        if (styleObj.hasOwnProperty(k)) el.style[k] = styleObj[k];
    }
}

function openPresetEditModal(id) {
    if (editingPresetId) closePresetEditModal();
    editingPresetId = id;
    var p = findPreset(id);
    if (!p) return;

    /* The whole modal used to be built and inserted synchronously inside
       the same click that opened it, then immediately grabbed focus. The
       very first time this ran in a session, the embedded IE control
       seemed to "eat" the next click on Cancel (worked fine on the 2nd
       press, and every open after that). Pushing the entire build to a
       fresh tick — so none of it shares a call stack with the opening
       click — avoids whatever race that was. */
    setTimeout(function () { buildPresetEditModal(id, p); }, 0);
}

function buildPresetEditModal(id, p) {
    if (editingPresetId !== id) return; /* superseded by a newer open/close before this tick ran */
    var S  = STRINGS[currentLang] || STRINGS.ru;
    var TH = getPresetEditTheme();

    var overlay = document.createElement("div");
    overlay.id = "preset-edit-overlay";
    overlay.className = "preset-edit-overlay";

    var modal = document.createElement("div");
    modal.className = "preset-edit-modal";
    applyStyleObj(modal, TH.modal);

    var title = document.createElement("div");
    title.className = "preset-edit-title";
    applyStyleObj(title, TH.title);
    title.appendChild(document.createTextNode(S.editPresetTitle || "Редактировать пресет"));

    var placeLabel = document.createElement("div");
    placeLabel.className = "preset-edit-label";
    applyStyleObj(placeLabel, TH.label);
    placeLabel.appendChild(document.createTextNode(S.editPlaceLabel || "PLACE ID"));

    var placeInp = document.createElement("input");
    placeInp.type = "text";
    placeInp.id = "preset-edit-place";
    placeInp.className = "field-input preset-edit-inp";
    placeInp.value = p.placeId || "";
    placeInp.maxLength = 64;
    placeInp.spellcheck = false;
    applyStyleObj(placeInp, TH.inp);

    var linkLabel = document.createElement("div");
    linkLabel.className = "preset-edit-label";
    applyStyleObj(linkLabel, TH.label);
    linkLabel.appendChild(document.createTextNode(S.editLinkLabel || "LINK CODE"));

    var linkInp = document.createElement("input");
    linkInp.type = "text";
    linkInp.id = "preset-edit-link";
    linkInp.className = "field-input preset-edit-inp";
    linkInp.value = p.linkCode || "";
    linkInp.maxLength = 64;
    linkInp.spellcheck = false;
    applyStyleObj(linkInp, TH.inp);

    var groupLabel = null, groupRow = null;
    if (groups.length > 0) {
        groupLabel = document.createElement("div");
        groupLabel.className = "preset-edit-label";
        applyStyleObj(groupLabel, TH.label);
        groupLabel.appendChild(document.createTextNode(S.editGroupLabel || "ГРУППА"));

        groupRow = document.createElement("div");
        groupRow.className = "pe-group-row";
        renderPresetEditGroupChips(groupRow, p);
    }

    var btnRow = document.createElement("div");
    btnRow.className = "preset-edit-btnrow";

    /* Enhancement: Name field */
    var nameLabel = document.createElement("div");
    nameLabel.className = "preset-edit-label";
    applyStyleObj(nameLabel, TH.label);
    nameLabel.appendChild(document.createTextNode(S.labelPresets ? S.labelPresets.replace("S","") : "НАЗВАНИЕ"));

    var nameInp = document.createElement("input");
    nameInp.type = "text";
    nameInp.id = "preset-edit-name";
    nameInp.className = "field-input preset-edit-inp";
    nameInp.value = p.name || "";
    nameInp.maxLength = 32;
    nameInp.spellcheck = false;
    applyStyleObj(nameInp, TH.inp);

    /* Enhancement: Icon selector (emoji) */
    var iconLabel = document.createElement("div");
    iconLabel.className = "preset-edit-label";
    applyStyleObj(iconLabel, TH.label);
    iconLabel.appendChild(document.createTextNode(S.presetIcon || "Иконка"));

    var iconRow = document.createElement("div");
    iconRow.className = "pe-icon-row";
    var EMOJIS = ["","🎮","🏆","⭐","🔥","💎","🎯","🚀","⚔️","🛡️","🏰","👑","🌟","💣","🗡️","🏹","⚡","🎁","💰","🔮"];
    for (var ei = 0; ei < EMOJIS.length; ei++) {
        (function(emoji){
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "pe-icon-btn" + (p.icon === emoji ? " pe-icon-active" : "");
            btn.appendChild(document.createTextNode(emoji || "✕"));
            btn.setAttribute("data-emoji", emoji);
            btn.onclick = function() {
                var btns = iconRow.querySelectorAll(".pe-icon-btn");
                for (var bi = 0; bi < btns.length; bi++) btns[bi].className = "pe-icon-btn";
                this.className = "pe-icon-btn pe-icon-active";
            };
            iconRow.appendChild(btn);
        })(EMOJIS[ei]);
    }

    /* Enhancement: Color selector */
    var colorLabel = document.createElement("div");
    colorLabel.className = "preset-edit-label";
    applyStyleObj(colorLabel, TH.label);
    colorLabel.appendChild(document.createTextNode(S.presetColor || "Цвет"));

    var colorRow = document.createElement("div");
    colorRow.className = "pe-color-row";
    var COLORS = ["", "#EF4444","#F59E0B","#22C55E","#06B6D4","#6366F1","#8B5CF6","#EC4899","#6B7280"];
    for (var ci = 0; ci < COLORS.length; ci++) {
        (function(color){
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "pe-color-btn" + (p.color === color ? " pe-color-active" : "");
            if (color) {
                btn.style.background = color;
            } else {
                btn.className = "pe-color-btn pe-color-none" + (p.color === color ? " pe-color-active" : "");
                btn.appendChild(document.createTextNode("✕"));
            }
            btn.setAttribute("data-color", color);
            btn.onclick = function() {
                var btns = colorRow.querySelectorAll(".pe-color-btn");
                for (var bi = 0; bi < btns.length; bi++) btns[bi].className = btns[bi].className.replace(/\s*pe-color-active\s*/g, " ");
                this.className = this.className + " pe-color-active";
            };
            colorRow.appendChild(btn);
        })(COLORS[ci]);
    }

    var saveBtn = document.createElement("button");
    saveBtn.className = "btn-primary preset-edit-save";
    saveBtn.style.background = TH.saveBg;
    saveBtn.style.color = TH.saveColor;
    saveBtn.style.borderColor = TH.saveBg;
    saveBtn.appendChild(document.createTextNode(S.editSaveBtn || "Сохранить"));

    var cancelBtn = document.createElement("button");
    cancelBtn.className = "btn-secondary preset-edit-cancel";
    applyStyleObj(cancelBtn, TH.cancel);
    cancelBtn.style.background = "transparent";
    cancelBtn.appendChild(document.createTextNode(S.editCancelBtn || "Отмена"));
    /* Bound on both mousedown and click — belt-and-suspenders against
       whatever swallowed the bare click the first time. closePresetEditModal
       is a no-op once the overlay is already gone, so firing twice is safe. */
    cancelBtn.onmousedown = closePresetEditModal;
    cancelBtn.onclick = closePresetEditModal;

    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);

    modal.appendChild(title);

    if ((p.method || 1) === 2) {
        /* Method 2: show only SHARE CODE field */
        var scLabel = document.createElement("div");
        scLabel.className = "preset-edit-label";
        applyStyleObj(scLabel, TH.label);
        scLabel.appendChild(document.createTextNode(S.shareCodeLabel || "SHARE CODE"));

        var scInp = document.createElement("input");
        scInp.type = "text";
        scInp.id = "preset-edit-sc";
        scInp.className = "field-input preset-edit-inp";
        scInp.value = p.linkCode || "";
        scInp.maxLength = 128;
        scInp.spellcheck = false;
        applyStyleObj(scInp, TH.inp);

        saveBtn.onclick = function () { confirmPresetEditM2(id, scInp); };
        scInp.onkeydown = function (e) {
            e = e || window.event;
            var k = e.keyCode || e.which;
            if (k === 13) confirmPresetEditM2(id, scInp);
            if (k === 27) closePresetEditModal();
        };

        modal.appendChild(title);
        modal.appendChild(nameLabel);
        modal.appendChild(nameInp);
        modal.appendChild(scLabel);
        modal.appendChild(scInp);
        modal.appendChild(iconLabel);
        modal.appendChild(iconRow);
        modal.appendChild(colorLabel);
        modal.appendChild(colorRow);
        if (groupLabel) { modal.appendChild(groupLabel); modal.appendChild(groupRow); }
        modal.appendChild(btnRow);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        try { setTimeout(function () { nameInp.focus(); nameInp.select(); }, 0); } catch(e) {}
    } else {
        /* Method 1: Place ID + Link Code */
        saveBtn.onclick = function () { confirmPresetEdit(id, placeInp, linkInp); };
        placeInp.onkeydown = linkInp.onkeydown = function (e) {
            e = e || window.event;
            var k = e.keyCode || e.which;
            if (k === 13) confirmPresetEdit(id, placeInp, linkInp);
            if (k === 27) closePresetEditModal();
        };

        modal.appendChild(title);
        modal.appendChild(nameLabel);
        modal.appendChild(nameInp);
        modal.appendChild(placeLabel);
        modal.appendChild(placeInp);
        modal.appendChild(linkLabel);
        modal.appendChild(linkInp);
        modal.appendChild(iconLabel);
        modal.appendChild(iconRow);
        modal.appendChild(colorLabel);
        modal.appendChild(colorRow);
        if (groupLabel) { modal.appendChild(groupLabel); modal.appendChild(groupRow); }
        modal.appendChild(btnRow);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        try { setTimeout(function () { nameInp.focus(); nameInp.select(); }, 0); } catch(e) {}
    }

    overlay.onclick = function (e) {
        if ((e || window.event).target === overlay) closePresetEditModal();
    };
}

function closePresetEditModal() {
    var ov = el("preset-edit-overlay");
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    editingPresetId = null;
}

function renderPresetEditGroupChips(container, p) {
    container.innerHTML = "";
    var S = STRINGS[currentLang] || STRINGS.ru;
    container.appendChild(buildPresetEditGroupChip(null, S.ungroupedLabel || "Без группы", !p.groupId, p, container));
    for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        container.appendChild(buildPresetEditGroupChip(g, g.name, p.groupId === g.id, p, container));
    }
}

function buildPresetEditGroupChip(g, label, active, p, container) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "group-chip pe-group-chip" + (active ? " group-chip-active" : "");
    if (g) {
        var dot = document.createElement("span");
        dot.className = "group-chip-dot";
        dot.style.background = g.color;
        chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(label));
    chip.onclick = function () {
        p.groupId = g ? g.id : null;
        flushPresetsOut();
        setDirty();
        sendCmd("CMD:save_preset");
        renderPresetEditGroupChips(container, p);
        renderPresets();
    };
    return chip;
}

function confirmPresetEdit(id, placeInp, linkInp) {
    var newPlace = trim(placeInp.value);
    var newLink  = trim(linkInp.value);
    if (!newPlace || !newLink) return;
    /* Get name, icon, color from edit modal */
    var newName = "";
    var nameEl = el("preset-edit-name");
    if (nameEl) newName = trim(nameEl.value);
    var newIcon = getSelectedEditIcon();
    var newColor = getSelectedEditColor();
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) {
            presets[i].placeId  = newPlace;
            presets[i].linkCode = newLink;
            if (newName) presets[i].name = newName;
            if (newIcon) presets[i].icon = newIcon; else delete presets[i].icon;
            if (newColor) presets[i].color = newColor; else delete presets[i].color;
            break;
        }
    }
    closePresetEditModal();
    flushPresetsOut();
    renderPresets();
    setDirty();
    sendCmd("CMD:save_preset");
}

function confirmPresetEditM2(id, scInp) {
    var newSC = trim(scInp.value);
    if (!newSC) return;
    /* Strip full URL if pasted */
    var m = newSC.match(/[?&]code=([A-Za-z0-9]+(?:&type=Server)?)/i);
    if (m) newSC = m[1];
    /* Get name, icon, color from edit modal */
    var newName = "";
    var nameEl = el("preset-edit-name");
    if (nameEl) newName = trim(nameEl.value);
    var newIcon = getSelectedEditIcon();
    var newColor = getSelectedEditColor();
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) {
            presets[i].linkCode = newSC;
            presets[i].placeId  = "";
            if (newName) presets[i].name = newName;
            if (newIcon) presets[i].icon = newIcon; else delete presets[i].icon;
            if (newColor) presets[i].color = newColor; else delete presets[i].color;
            break;
        }
    }
    closePresetEditModal();
    flushPresetsOut();
    renderPresets();
    setDirty();
    sendCmd("CMD:save_preset");
}

/* Helper: get selected icon from edit modal */
function getSelectedEditIcon() {
    var btns = document.querySelectorAll(".pe-icon-btn.pe-icon-active");
    if (btns.length > 0) return btns[0].getAttribute("data-emoji") || "";
    return "";
}

/* Helper: get selected color from edit modal */
function getSelectedEditColor() {
    var btns = document.querySelectorAll(".pe-color-btn.pe-color-active");
    if (btns.length > 0) return btns[0].getAttribute("data-color") || "";
    return "";
}

var currentBulkTheme = null;

function applyBulkTheme() {
    var ov = el("bulk-overlay");
    if (!ov) return;

    var bg, headerBg, bgBase, border, divider, sbThumb, inpBg, inpBorder, inpColor,
        textColor, titleColor, closeColor, thColor, cancelColor, rowBorder, saveBg, saveColor;

    if (themeMode === "custom") {
        bg         = customTheme.surface || customTheme.bg || "#111118";
        headerBg   = bg;
        bgBase     = customTheme.bg || "#05050F";
        border     = ra_hex(customTheme.accent || "#FFFFFF", 0.27);
        divider    = ra_hex(customTheme.text || "#FFFFFF", 0.10);
        sbThumb    = ra_hex(customTheme.text || "#FFFFFF", 0.18);
        /* Use bg (slightly lighter than bgBase) for inputs — solid hex */
        inpBg      = bg;
        inpBorder  = ra_hex(customTheme.text || "#FFFFFF", 0.20);
        inpColor   = customTheme.text || "#CCCCFF";
        textColor  = customTheme.text || "#CCCCFF";
        titleColor = ra_hex(customTheme.text || "#FFFFFF", 0.45);
        closeColor = titleColor;
        thColor    = titleColor;
        cancelColor= titleColor;
        rowBorder  = ra_hex(customTheme.text || "#FFFFFF", 0.07);
        saveBg     = customTheme.accent || "#6366F1";
        saveColor  = customTheme.bg || "#FFFFFF";
    } else if (themeMode === "light") {
        bg = bgBase = headerBg = "#FFFFFF";
        border     = "#DDDDE8";
        divider    = "#EBEBF0";
        sbThumb    = "#CCCCDD";
        inpBg      = "#F5F5FA";
        inpBorder  = "#DDDDE8";
        inpColor   = "#222233";
        textColor  = "#222233";
        titleColor = "#999999";
        closeColor = titleColor;
        thColor    = titleColor;
        cancelColor= titleColor;
        rowBorder  = "#F2F2F7";
        saveBg     = "#111111";
        saveColor  = "#FFFFFF";
    } else {
        /* dark — matches the neutral onyx palette used by .tp-modal /
           .settings-modal (was previously a mismatched bluish-navy tone) */
        bg         = "#0F0F0F";
        headerBg   = "#0D0D0D";
        bgBase     = "#0F0F0F";
        border     = "#252525";
        divider    = "#1A1A1A";
        sbThumb    = "#333333";
        inpBg      = "#111111";
        inpBorder  = "#222222";
        inpColor   = "#E8E8E8";
        textColor  = "#CCCCCC";
        titleColor = "#FFFFFF";
        closeColor = "#333333";
        thColor    = "#444444";
        cancelColor= "#555555";
        rowBorder  = "#1A1A1A";
        saveBg     = "#FFFFFF";
        saveColor  = "#000000";
    }

    currentBulkTheme = { bg:bg, headerBg:headerBg, bgBase:bgBase, border:border, divider:divider,
        inpBg:inpBg, inpBorder:inpBorder, inpColor:inpColor,
        textColor:textColor, titleColor:titleColor, rowBorder:rowBorder,
        saveBg:saveBg, saveColor:saveColor, sbThumb:sbThumb };

    /* Inject a <style> tag inside the overlay — works reliably in IE WebBrowser */
    var styleId = "bulk-theme-style";
    var existing = el(styleId);
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var css = [
        ".bulk-modal { background:" + bg + " !important; border:1px solid " + border + " !important; }",
        ".bulk-header { background:" + headerBg + " !important; border-bottom:1px solid " + divider + " !important; }",
        ".bulk-footer { background:" + headerBg + " !important; border-top:1px solid " + divider + " !important; }",
        ".bulk-body { background:" + bgBase + " !important; scrollbar-face-color:" + sbThumb + "; scrollbar-track-color:" + bgBase + "; scrollbar-arrow-color:" + bgBase + "; scrollbar-shadow-color:" + sbThumb + "; }",
        ".bulk-table { background:" + bgBase + " !important; }",
        "table.bulk-table { background:" + bgBase + " !important; }",
        ".bulk-table tbody { background:" + bgBase + " !important; }",
        ".bulk-table tr.bulk-row { background:" + bgBase + " !important; border-bottom:1px solid " + rowBorder + " !important; }",
        ".bulk-table tr.bulk-row td.bulk-td { background:" + bgBase + " !important; }",
        ".bulk-th { background:" + headerBg + " !important; border-bottom:1px solid " + divider + " !important; color:" + thColor + " !important; }",
        "th.bulk-th { background:" + headerBg + " !important; color:" + thColor + " !important; }",
        ".bulk-title { color:" + titleColor + " !important; }",
        ".bulk-close { color:" + closeColor + " !important; }",
        ".bulk-name-text { color:" + textColor + " !important; }",
        "input.bulk-inp { background-color:" + inpBg + " !important; border:1px solid " + inpBorder + " !important; color:" + inpColor + " !important; }",
        "input.bulk-inp-place { background-color:" + inpBg + " !important; border:1px solid " + inpBorder + " !important; color:" + inpColor + " !important; }",
        "input.bulk-inp-link  { background-color:" + inpBg + " !important; border:1px solid " + inpBorder + " !important; color:" + inpColor + " !important; }",
        ".bulk-cancel-btn { background:transparent !important; border:1px solid " + inpBorder + " !important; color:" + cancelColor + " !important; }",
        /* !important on the base color above would otherwise out-rank the
           non-important :hover rule in style.css, killing the hover state —
           restate the hover here so the cancel button stays interactive.   */
        ".bulk-cancel-btn:hover { background:#1E0A0A !important; border-color:#3A1A1A !important; color:#FF7777 !important; }",
        "button.bulk-save { background:" + saveBg + " !important; color:" + saveColor + " !important; border:none !important; }"
    ].join("\n");

    var styleEl = document.createElement("style");
    styleEl.id = styleId;
    if (styleEl.styleSheet) {
        styleEl.styleSheet.cssText = css;
    } else {
        styleEl.appendChild(document.createTextNode(css));
    }
    /* Append to document head so it applies globally with high specificity */
    document.getElementsByTagName("head")[0].appendChild(styleEl);
}

function openBulkEdit() {
    var ov = el("bulk-overlay");
    if (!ov) return;

    ov.style.display = "block";

    /* Center modal via JS for IE WebBrowser compatibility */
    var modal = ov.querySelector ? ov.querySelector(".bulk-modal") : null;
    if (modal) {
        var ww = document.documentElement.clientWidth  || document.body.clientWidth  || 420;
        var wh = document.documentElement.clientHeight || document.body.clientHeight || 500;
        var mw = 370; var mh = 440;
        modal.style.position = "absolute";
        modal.style.left = Math.max(0, Math.round((ww - mw) / 2)) + "px";
        modal.style.top  = Math.max(0, Math.round((wh - mh) / 2)) + "px";
        modal.style.width  = mw + "px";
        modal.style.height = mh + "px";
    }

    applyBulkTheme();
    buildBulkTable();
    applyBulkLanguage();

    /* Enhancement: add visible class for modal animation */
    setTimeout(function () {
        ov.className = "bulk-overlay bulk-overlay-visible";
        var first = ov.querySelector ? ov.querySelector(".bulk-inp-place") : null;
        if (first) try { first.focus(); } catch(e) {}
    }, 10);
}


function closeBulkEdit() {
    var ov = el("bulk-overlay");
    if (ov) {
        ov.className = "bulk-overlay";
        setTimeout(function () { ov.style.display = "none"; }, 200);
    }
    var st = el("bulk-theme-style");
    if (st && st.parentNode) st.parentNode.removeChild(st);
}

function buildBulkTable() {
    var tbody = el("bulk-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!presets || presets.length === 0) {
        var S = STRINGS[currentLang] || STRINGS.ru;
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.colSpan = 3;
        td.className = "bulk-empty";
        td.appendChild(document.createTextNode(S.bulkNoPresets || "Нет пресетов"));
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        var tr = document.createElement("tr");
        tr.className = "bulk-row";
        tr.setAttribute("data-pid", p.id);

        /* Name cell — readonly label */
        var tdName = document.createElement("td");
        tdName.className = "bulk-td bulk-td-name";
        if (currentBulkTheme) tdName.style.background = currentBulkTheme.bgBase;
        var dot = document.createElement("span");
        dot.className = "bulk-dot";
        dot.style.background = DOT_COLORS[i % DOT_COLORS.length];
        dot.appendChild(document.createTextNode(i + 1));
        var nameText = document.createElement("span");
        nameText.className = "bulk-name-text";
        nameText.appendChild(document.createTextNode(p.name || ""));
        if (currentBulkTheme) nameText.style.color = currentBulkTheme.textColor;
        tdName.appendChild(dot);
        tdName.appendChild(nameText);
        tr.appendChild(tdName);

        if ((p.method || 1) === 2) {
            /* Method 2: Place ID cell = dash placeholder, Link Code cell = share code */
            var tdDash = document.createElement("td");
            tdDash.className = "bulk-td bulk-td-place";
            if (currentBulkTheme) tdDash.style.background = currentBulkTheme.bgBase;
            var dashSpan = document.createElement("span");
            dashSpan.className = "bulk-m2-dash";
            dashSpan.appendChild(document.createTextNode("SC"));
            if (currentBulkTheme) dashSpan.style.color = currentBulkTheme.thColor;
            tdDash.appendChild(dashSpan);
            tr.appendChild(tdDash);

            var tdSC = document.createElement("td");
            tdSC.className = "bulk-td bulk-td-link";
            if (currentBulkTheme) tdSC.style.background = currentBulkTheme.bgBase;
            var scInp = document.createElement("input");
            scInp.type = "text";
            scInp.className = "bulk-inp bulk-inp-link";
            scInp.value = p.linkCode || "";
            scInp.maxLength = 128;
            scInp.placeholder = "Share Code";
            scInp.spellcheck = false;
            scInp.setAttribute("data-pid", p.id);
            scInp.setAttribute("data-field", "linkCode");
            scInp.onchange = onBulkInputChange;
            scInp.onkeydown = onBulkKeyDown;
            if (currentBulkTheme) {
                scInp.style.background  = currentBulkTheme.inpBg;
                scInp.style.borderColor = currentBulkTheme.inpBorder;
                scInp.style.color       = currentBulkTheme.inpColor;
            }
            tdSC.appendChild(scInp);
            tr.appendChild(tdSC);
        } else {
            /* Method 1: Place ID + Link Code cells */
            var tdPlace = document.createElement("td");
            tdPlace.className = "bulk-td bulk-td-place";
            if (currentBulkTheme) tdPlace.style.background = currentBulkTheme.bgBase;
            var placeInp = document.createElement("input");
            placeInp.type = "text";
            placeInp.className = "bulk-inp bulk-inp-place";
            placeInp.value = p.placeId || "";
            placeInp.maxLength = 64;
            placeInp.spellcheck = false;
            placeInp.setAttribute("data-pid", p.id);
            placeInp.setAttribute("data-field", "placeId");
            placeInp.onchange = onBulkInputChange;
            placeInp.onkeydown = onBulkKeyDown;
            if (currentBulkTheme) {
                placeInp.style.background  = currentBulkTheme.inpBg;
                placeInp.style.borderColor = currentBulkTheme.inpBorder;
                placeInp.style.color       = currentBulkTheme.inpColor;
            }
            tdPlace.appendChild(placeInp);
            tr.appendChild(tdPlace);

            var tdLink = document.createElement("td");
            tdLink.className = "bulk-td bulk-td-link";
            if (currentBulkTheme) tdLink.style.background = currentBulkTheme.bgBase;
            var linkInp = document.createElement("input");
            linkInp.type = "text";
            linkInp.className = "bulk-inp bulk-inp-link";
            linkInp.value = p.linkCode || "";
            linkInp.maxLength = 64;
            linkInp.spellcheck = false;
            linkInp.setAttribute("data-pid", p.id);
            linkInp.setAttribute("data-field", "linkCode");
            linkInp.onchange = onBulkInputChange;
            linkInp.onkeydown = onBulkKeyDown;
            if (currentBulkTheme) {
                linkInp.style.background  = currentBulkTheme.inpBg;
                linkInp.style.borderColor = currentBulkTheme.inpBorder;
                linkInp.style.color       = currentBulkTheme.inpColor;
            }
            tdLink.appendChild(linkInp);
            tr.appendChild(tdLink);
        }

        tbody.appendChild(tr);
    }
}

function onBulkInputChange() {
    /* Live highlight changed rows */
    var row = this.parentNode && this.parentNode.parentNode;
    if (row) row.className = "bulk-row bulk-row-dirty";
}

function onBulkKeyDown(e) {
    e = e || window.event;
    var k = e.keyCode || e.which;
    if (k === 27) { closeBulkEdit(); return; }
    if (k === 13) {
        /* Move to next input */
        var inputs = el("bulk-tbody").querySelectorAll(".bulk-inp");
        for (var i = 0; i < inputs.length - 1; i++) {
            if (inputs[i] === this) { try { inputs[i+1].focus(); inputs[i+1].select(); } catch(ex) {} break; }
        }
    }
    if (k === 9) return; /* allow natural Tab */
}

function saveBulkEdit() {
    var inputs = el("bulk-tbody").querySelectorAll(".bulk-inp");
    var changed = 0;
    for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        var pid   = inp.getAttribute("data-pid");
        var field = inp.getAttribute("data-field");
        var val   = trim(inp.value);
        if (!val) continue;
        for (var j = 0; j < presets.length; j++) {
            if (presets[j].id === pid) {
                if (presets[j][field] !== val) {
                    presets[j][field] = val;
                    changed++;
                }
                break;
            }
        }
    }
    closeBulkEdit();
    if (changed > 0) {
        flushPresetsOut();
        renderPresets();
        setDirty();
        sendCmd("CMD:save_preset");
    }
}

function applyBulkLanguage() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    setText("bulk-title",      S.bulkEditTitle  || "Массовое редактирование");
    setText("bulk-col-name",   S.bulkColName    || "Название");
    setText("bulk-col-place",  S.bulkColPlace   || "Place ID");
    setText("bulk-col-link",   S.bulkColLink    || "Link Code");
    setText("bulk-save",       S.bulkSaveBtn    || "Сохранить");
    setText("bulk-cancel",     S.bulkCancelBtn  || "Отмена");
    var bbtn = el("btn-bulk-edit");
    if (bbtn) bbtn.setAttribute("data-tooltip", S.bulkEditTooltip || "Массовое редактирование");
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
    try { e.cancelBubble = true; } catch(x){}
    try { e.returnValue = false; } catch(x){}
    return false;
}

/* ============================================================
   §enhancements · NEW FEATURES IMPLEMENTATION
   Groups A–G: toast, copy link, sort, undo, drag-drop, search,
   compact mode, status bar, history, dashboard, backup, etc.
   ============================================================ */

/* ── §A1 · Toast notification system ─────────────────────── */
function showToast(message, actionLabel, actionFn, duration) {
    var S = STRINGS[currentLang] || STRINGS.ru;
    if (!toastContainer) toastContainer = el("toast-container");
    if (!toastContainer) return;

    var t = document.createElement("div");
    t.className = "toast";

    var msg = document.createElement("span");
    msg.className = "toast-msg";
    msg.appendChild(document.createTextNode(message));
    t.appendChild(msg);

    if (actionLabel && actionFn) {
        var btn = document.createElement("button");
        btn.className = "toast-action";
        btn.appendChild(document.createTextNode(actionLabel));
        btn.onclick = function () {
            try { actionFn(); } catch(e){}
            removeToast(t);
        };
        t.appendChild(btn);
    }

    var close = document.createElement("button");
    close.className = "toast-close";
    close.innerHTML = "&#215;";
    close.appendChild(document.createTextNode("\u00d7"));
    close.innerHTML = "\u00d7";
    close.onclick = function () { removeToast(t); };
    t.appendChild(close);

    toastContainer.appendChild(t);

    var dur = duration || 4000;
    var tmr = setTimeout(function () { removeToast(t); }, dur);
    t._tmr = tmr;
}

function removeToast(t) {
    if (!t || !t.parentNode) return;
    if (t._tmr) { clearTimeout(t._tmr); t._tmr = null; }
    t.className = "toast toast-out";
    setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
    }, 200);
}

/* ── §B1 · Copy link to clipboard ────────────────────────── */
function copyPresetLink(id) {
    var p = findPreset(id);
    if (!p) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    var link = "";
    if ((p.method || 1) === 2) {
        link = "https://www.roblox.com/share?code=" + (p.linkCode || "") + "&type=Server";
    } else {
        link = "https://www.roblox.com/games/" + (p.placeId || "") + "?privateServerLinkCode=" + (p.linkCode || "");
    }
    /* Use the AHK clipboard bridge — IE11 in Shell.Explorer can't
       access the clipboard directly due to security restrictions. */
    try {
        el("__clipboard_data").value = link;
        sendCmd("CMD:copy_clipboard");
        showToast(S.copyLinkDone, null, null, 2500);
    } catch (e) {
        showToast(S.copyLinkFail, null, null, 3000);
    }
}

function makeCopyLinker(id) {
    return function (e) {
        e = e || window.event;
        cancelEv(e);
        copyPresetLink(id);
    };
}

/* ── §B2 · Extended search (all fields) ──────────────────── */
function applyFilterEnhanced(query) {
    var q = trim(query || "").toLowerCase();
    var list = el("presets-list");
    if (!list) return;
    var kids = list.childNodes;
    var visibleCountByGroup = {};
    var i, n;

    for (i = 0; i < kids.length; i++) {
        n = kids[i];
        if (!n || n.nodeType !== 1 || !hasClass(n, "preset-row")) continue;
        var id = n.getAttribute("data-id");
        var p  = findPreset(id);
        var match = !q;
        if (p && q) {
            /* Search across name, placeId, linkCode, group name */
            var nameMatch = (p.name || "").toLowerCase().indexOf(q) >= 0;
            var placeMatch = (p.placeId || "").toLowerCase().indexOf(q) >= 0;
            var linkMatch = (p.linkCode || "").toLowerCase().indexOf(q) >= 0;
            var groupName = "";
            if (p.groupId) {
                for (var gi = 0; gi < groups.length; gi++) {
                    if (groups[gi].id === p.groupId) { groupName = groups[gi].name || ""; break; }
                }
            }
            var groupMatch = groupName.toLowerCase().indexOf(q) >= 0;
            match = nameMatch || placeMatch || linkMatch || groupMatch;
        }
        n.style.display = match ? "" : "none";
        if (match) {
            var gk = n.getAttribute("data-group") || "__ungrouped__";
            visibleCountByGroup[gk] = (visibleCountByGroup[gk] || 0) + 1;
        }

        /* Enhancement: apply search highlight to preset name */
        var nameEl = n.querySelector ? n.querySelector(".preset-name") : null;
        if (nameEl) {
            if (q && p) {
                nameEl.innerHTML = highlightSearchText(p.name || "", q);
            } else if (p) {
                /* No query — restore original name text */
                nameEl.innerHTML = "";
                nameEl.appendChild(document.createTextNode(p.name || ""));
            }
        }
    }
    /* Hide section headers with zero matches */
    for (i = 0; i < kids.length; i++) {
        n = kids[i];
        if (!n || n.nodeType !== 1 || !hasClass(n, "group-header")) continue;
        if (hasClass(n, "group-header-collapsed")) { n.style.display = ""; continue; }
        var key = n.getAttribute("data-group-key");
        var show = !q || (visibleCountByGroup[key] > 0);
        n.style.display = show ? "" : "none";
    }
}

/* ── §B3 · Sort presets ──────────────────────────────────── */
function applySort(mode) {
    sortMode = mode;
    var cfgSort = el("__cfg_sort_mode");
    if (cfgSort) cfgSort.value = mode;
    syncSortButtons();

    if (mode === "manual") {
        renderPresets();
        return;
    }

    /* Work on a copy, preserve original order for manual restore */
    var sorted = [];
    for (var i = 0; i < presets.length; i++) sorted.push(presets[i]);

    if (mode === "name") {
        sorted.sort(function (a, b) {
            return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
        });
    } else if (mode === "date") {
        sorted.sort(function (a, b) {
            return (b.lastLaunch || 0) - (a.lastLaunch || 0);
        });
    } else if (mode === "launches") {
        sorted.sort(function (a, b) {
            return (b.launches || 0) - (a.launches || 0);
        });
    } else if (mode === "fav") {
        sorted.sort(function (a, b) {
            if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1;
            return (b.lastLaunch || 0) - (a.lastLaunch || 0);
        });
    }

    /* Replace presets array in-place */
    presets.length = 0;
    for (var j = 0; j < sorted.length; j++) presets.push(sorted[j]);

    flushPresetsOut();
    renderPresets();
    setDirty();
}

function syncSortButtons() {
    var opts = [
        {id:"sort-manual",  val:"manual"},
        {id:"sort-name",    val:"name"},
        {id:"sort-date",    val:"date"},
        {id:"sort-launches",val:"launches"},
        {id:"sort-fav",     val:"fav"}
    ];
    for (var i = 0; i < opts.length; i++) {
        var btn = el(opts[i].id);
        if (!btn) continue;
        btn.className = (sortMode === opts[i].val)
            ? "sort-opt sort-opt-active" : "sort-opt";
    }
    /* Show sort bar when there are >1 presets */
    var sb = el("sort-bar");
    var sc = el("sort-collapsed");
    if (sb) sb.style.display = (presets.length > 1 && !sortBarCollapsed) ? "" : "none";
    if (sc) sc.style.display = (presets.length > 1 && sortBarCollapsed) ? "" : "none";
}

/* Enhancement: collapse/expand sort bar to save space */
var sortBarCollapsed = false;
function toggleSortBar() {
    sortBarCollapsed = !sortBarCollapsed;
    syncSortButtons();
    sendResize();
}

/* ── §B4 · Undo delete (1-step) ──────────────────────────── */
function deletePresetWithUndo(id) {
    var idx = -1;
    var presetCopy = null;
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) {
            idx = i;
            /* Deep copy for undo */
            presetCopy = JSON.parse(JSON.stringify(presets[i]));
            break;
        }
    }
    if (idx < 0) return;
    var S = STRINGS[currentLang] || STRINGS.ru;

    /* Remove */
    presets.splice(idx, 1);
    undoStack = [{ type: "delete", data: presetCopy, prevIndex: idx }];
    renderPresets();
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:del_preset");
    setDirty();

    /* Show undo toast */
    showToast(S.undoDelete, S.undoBtn, function () {
        undoDelete();
    }, 5000);
}

function undoDelete() {
    if (undoStack.length === 0) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    var action = undoStack.pop();
    if (action.type === "delete" && action.data) {
        var idx = action.prevIndex;
        if (idx > presets.length) idx = presets.length;
        presets.splice(idx, 0, action.data);
        renderPresets();
        flushPresetsOut();
        setDirty();
        sendCmd("CMD:save_preset");
        showToast(S.undoRestored, null, null, 2500);
    }
}

/* ── §B5 · Drag-and-drop file import ─────────────────────── */
function initDragDrop() {
    var overlay = el("drag-overlay");
    var dragText = el("drag-overlay-text");
    if (!overlay) return;

    var dragCounter = 0;

    /* Helper: check if this drag is a file/URL import (not a preset row drag) */
    function isFileOrUrlDrag(e) {
        var dt = e.dataTransfer;
        if (!dt || !dt.types) return false;
        for (var i = 0; i < dt.types.length; i++) {
            var t = dt.types[i];
            /* "Files" = file drag, "text/uri-list" = URL drag, "DownloadURL" = link drag */
            if (t === "Files" || t === "text/uri-list" || t === "DownloadURL") return true;
        }
        /* "Text" alone = preset row drag (our own dragstart uses setData("Text", p.id)) */
        return false;
    }

    document.ondragenter = function (e) {
        e = e || window.event;
        /* Only handle file/URL drags, not preset row drags */
        if (!isFileOrUrlDrag(e)) return true;
        cancelEv(e);
        dragCounter++;
        var dt = e.dataTransfer;
        var hasFiles = false;
        if (dt && dt.types) {
            for (var i = 0; i < dt.types.length; i++) {
                if (dt.types[i] === "Files") hasFiles = true;
            }
        }
        var S = STRINGS[currentLang] || STRINGS.ru;
        if (dragText) dragText.textContent = hasFiles ? S.dragImportJson : S.dragImportLink;
        overlay.style.display = "";
    };

    document.ondragleave = function (e) {
        e = e || window.event;
        if (!isFileOrUrlDrag(e)) return true;
        cancelEv(e);
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            overlay.style.display = "none";
        }
    };

    document.ondragover = function (e) {
        e = e || window.event;
        /* Only handle file/URL drags, let preset drags bubble to group chips */
        if (!isFileOrUrlDrag(e)) return true;
        cancelEv(e);
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        return false;
    };

    document.ondrop = function (e) {
        e = e || window.event;
        /* Only handle file/URL drops, not preset row drops */
        if (!isFileOrUrlDrag(e)) return true;
        cancelEv(e);
        dragCounter = 0;
        overlay.style.display = "none";

        var dt = e.dataTransfer;
        if (!dt) return;

        /* Check for files first */
        if (dt.files && dt.files.length > 0) {
            var file = dt.files[0];
            if (file.name && file.name.toLowerCase().indexOf(".json") >= 0) {
                var reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        el("__import_data").value = ev.target.result;
                        importPresetsFromAHK();
                        var S = STRINGS[currentLang] || STRINGS.ru;
                        showToast(S.undoRestored || "Импортировано", null, null, 2500);
                    } catch (err) {
                        showToast("Import failed", null, null, 3000);
                    }
                };
                reader.readAsText(file);
            }
            return;
        }

        /* Check for URL/text data (Roblox link) */
        var urlData = dt.getData("Text") || dt.getData("text/uri-list") || dt.getData("text/plain");
        if (urlData) {
            handleDroppedLink(urlData);
        }
    };
}

function handleDroppedLink(rawUrl) {
    /* Parse Roblox URL and auto-fill fields */
    var url = trim(rawUrl);
    if (!url) return;

    /* Method 1: privateServerLinkCode */
    var m1 = url.match(/roblox\.com\/games\/(\d+)[^\s]*[?&]privateServerLinkCode=([0-9]+)/i);
    if (m1) {
        switchMethod(1);
        el("inp-place").value = m1[1];
        el("inp-link").value  = m1[2];
        var S = STRINGS[currentLang] || STRINGS.ru;
        showToast("Place ID + Link Code", null, null, 2500);
        return;
    }

    /* Method 2: share code */
    var m2 = url.match(/roblox\.com\/share\?code=([^&]+)/i);
    if (m2) {
        switchMethod(2);
        var scInp = el("inp-share-code");
        if (scInp) scInp.value = url;
        el("inp-link").value = m2[1];
        showToast("Share Code", null, null, 2500);
        return;
    }

    /* Method 2: roblox:// protocol */
    var m3 = url.match(/code=([^&\s]+)/i);
    if (m3) {
        switchMethod(2);
        var scInp2 = el("inp-share-code");
        if (scInp2) scInp2.value = url;
        el("inp-link").value = m3[1];
        showToast("Share Code", null, null, 2500);
        return;
    }

    showToast("Unrecognized link format", null, null, 3000);
}

/* ── §C1 · Compact mode ──────────────────────────────────── */
function toggleCompactMode() {
    compactMode = !compactMode;
    applyCompactMode();
    var cm = el("__cfg_compact_mode");
    if (cm) cm.value = compactMode ? "1" : "0";
    /* Delay resize so the DOM has time to apply compact-mode CSS
       before liveHeight() measures the new element sizes. */
    setTimeout(function () { sendResize(); }, 50);
}

function applyCompactMode() {
    var cls = document.body.className || "";
    /* Remove existing compact-mode class, preserve other classes (theme-*) */
    cls = cls.replace(/\s*compact-mode\s*/g, " ").replace(/^\s+|\s+$/g, "");
    if (compactMode) {
        cls = (cls ? cls + " " : "") + "compact-mode";
    }
    document.body.className = cls;
    /* Also set on documentElement for CSS selectors that target html */
    var hcls = document.documentElement.className || "";
    hcls = hcls.replace(/\s*compact-mode\s*/g, " ").replace(/^\s+|\s+$/g, "");
    if (compactMode) {
        hcls = (hcls ? hcls + " " : "") + "compact-mode";
    }
    document.documentElement.className = hcls;
    /* Sync toggle */
    var track = el("compact-track");
    var chk = el("chk-compact-mode");
    if (track) track.className = "toggle-track" + (compactMode ? " on" : "");
    if (chk) chk.checked = compactMode;
}

function syncCompactToggle() {
    applyCompactMode();
}

/* ── §C2 · (removed — magnetic snap feature deleted) ────── */

/* ── §C3 · Status bar update ─────────────────────────────── */
function updateStatusBar() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var countEl = el("status-count");
    var lastEl = el("status-last");
    var n = presets.length;
    if (countEl) {
        countEl.textContent = n + " " + S.statusBarPresets;
    }
    if (lastEl) {
        var lastTs = 0;
        var lastName = "";
        for (var i = 0; i < presets.length; i++) {
            if ((presets[i].lastLaunch || 0) > lastTs) {
                lastTs = presets[i].lastLaunch;
                lastName = presets[i].name || "";
            }
        }
        if (lastTs > 0) {
            lastEl.textContent = S.statusBarLast + " " + formatRelativeTime(lastTs);
        } else {
            lastEl.textContent = S.statusBarLast + " " + S.statusBarNever;
        }
    }
}

/* ── §C4 · Empty state ───────────────────────────────────── */
function updateEmptyState() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var empty = el("empty-state");
    var list = el("presets-list");
    if (!empty || !list) return;
    if (presets.length === 0) {
        empty.style.display = "";
        list.style.display = "none";
        setText("empty-state-title", S.emptyPresets);
        setText("empty-state-hint", S.emptyPresetsHint);
        setText("empty-state-hint2", S.emptyPresetsHint2);
    } else {
        empty.style.display = "none";
        list.style.display = "";
    }
}

/* ── §D1 · Dirty state tracking ──────────────────────────── */
function setDirty() {
    dirtyState = true;
    var d = el("__dirty_state");
    if (d) d.value = "1";
}

function clearDirty() {
    dirtyState = false;
    var d = el("__dirty_state");
    if (d) d.value = "0";
}

/* ── §D2 · Exit confirmation ─────────────────────────────── */
function requestExit() {
    if (!dirtyState) {
        sendCmd("CMD:close");
        return;
    }
    var S = STRINGS[currentLang] || STRINGS.ru;
    showToast(S.exitConfirmMsg, S.exitConfirmYes, function () {
        sendCmd("CMD:close");
    }, 6000);
}

/* ── §F1 · History modal ─────────────────────────────────── */
var historyFilter = "all";

function openHistory() {
    var overlay = el("history-overlay");
    if (!overlay) return;
    overlay.style.display = "flex";
    setTimeout(function () { overlay.className = "history-overlay history-overlay-visible"; }, 10);
    sendCmd("CMD:load_history");
    /* History data will be injected by AHK into __history_data */
    setTimeout(function () { renderHistory(); }, 200);
}

function closeHistory() {
    var overlay = el("history-overlay");
    if (!overlay) return;
    overlay.className = "history-overlay";
    setTimeout(function () { overlay.style.display = "none"; }, 200);
}

function renderHistory() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var tbody = el("history-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    var raw = el("__history_data") ? el("__history_data").value : "";
    var entries = [];
    if (raw) {
        try { entries = JSON.parse(raw); } catch(e) { entries = []; }
    }

    /* Filter */
    var now = Date.now();
    var filtered = [];
    for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (historyFilter === "today") {
            if (now - (e.ts || 0) > 86400000) continue;
        } else if (historyFilter === "week") {
            if (now - (e.ts || 0) > 604800000) continue;
        }
        filtered.push(e);
    }

    if (filtered.length === 0) {
        var tr = document.createElement("tr");
        tr.className = "history-empty-row";
        var td = document.createElement("td");
        td.colSpan = 4;
        td.appendChild(document.createTextNode(S.historyEmpty));
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    for (var j = 0; j < filtered.length; j++) {
        var entry = filtered[j];
        var row = document.createElement("tr");
        var c1 = document.createElement("td");
        c1.appendChild(document.createTextNode(entry.name || "—"));
        var c2 = document.createElement("td");
        c2.appendChild(document.createTextNode(formatHistoryDate(entry.ts)));
        var c3 = document.createElement("td");
        c3.className = entry.ok ? "history-status-ok" : "history-status-fail";
        c3.appendChild(document.createTextNode(entry.ok ? S.statSuccess : S.statFail));
        var c4 = document.createElement("td");
        var codeVal = entry.placeId || "";
        c4.appendChild(document.createTextNode(abbrev(codeVal, 14)));
        row.appendChild(c1);
        row.appendChild(c2);
        row.appendChild(c3);
        row.appendChild(c4);
        tbody.appendChild(row);
    }
}

function formatHistoryDate(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    var dd = d.getDate();
    var mm = d.getMonth() + 1;
    var hh = d.getHours();
    var mi = d.getMinutes();
    return dd + "." + mm + " " + hh + ":" + (mi < 10 ? "0" : "") + mi;
}

/* ── §F2 · Dashboard modal ───────────────────────────────── */
function openDashboard() {
    var overlay = el("dashboard-overlay");
    if (!overlay) return;
    overlay.style.display = "flex";
    setTimeout(function () { overlay.className = "dashboard-overlay dashboard-overlay-visible"; }, 10);
    /* Request fresh history data from AHK for the chart, then render */
    sendCmd("CMD:load_history");
    setTimeout(function () { renderDashboard(); }, 200);
}

function closeDashboard() {
    var overlay = el("dashboard-overlay");
    if (!overlay) return;
    overlay.className = "dashboard-overlay";
    setTimeout(function () { overlay.style.display = "none"; }, 200);
}

function renderDashboard() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var total = 0;
    var weekCount = 0;
    var now = Date.now();
    var launches = [];

    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        var lc = p.launches || 0;
        total += lc;
        if (lc > 0) launches.push({ name: p.name, count: lc, last: p.lastLaunch || 0 });
        if ((p.lastLaunch || 0) > now - 604800000) weekCount++;
    }

    setText("dash-total-label", S.dashboardTotalLaunches);
    setText("dash-week-label", S.dashboardThisWeek);
    setText("dash-interval-label", S.dashboardAvgInterval);
    setText("dash-top-title", S.dashboardTopPresets);

    var totalEl = el("dash-total");
    if (totalEl) totalEl.textContent = String(total);
    var weekEl = el("dash-week");
    if (weekEl) weekEl.textContent = String(weekCount);

    /* Avg interval */
    var intervalEl = el("dash-interval");
    if (intervalEl) {
        var allTimes = [];
        for (var j = 0; j < presets.length; j++) {
            if (presets[j].lastLaunch) allTimes.push(presets[j].lastLaunch);
        }
        if (allTimes.length > 1) {
            allTimes.sort(function (a, b) { return a - b; });
            var totalGap = 0;
            for (var k = 1; k < allTimes.length; k++) {
                totalGap += (allTimes[k] - allTimes[k - 1]);
            }
            var avg = totalGap / (allTimes.length - 1);
            var hrs = Math.floor(avg / 3600000);
            if (hrs >= 1) intervalEl.textContent = hrs + "h";
            else intervalEl.textContent = Math.floor(avg / 60000) + "m";
        } else {
            intervalEl.textContent = "—";
        }
    }

    /* Top presets */
    launches.sort(function (a, b) { return b.count - a.count; });
    var topList = el("dashboard-top-list");
    if (topList) {
        topList.innerHTML = "";
        var topN = Math.min(5, launches.length);
        if (topN === 0) {
            var empty = document.createElement("div");
            empty.style.color = "#444444";
            empty.style.fontSize = "11px";
            empty.style.padding = "8px 0";
            empty.appendChild(document.createTextNode(S.dashboardNoData));
            topList.appendChild(empty);
        } else {
            for (var r = 0; r < topN; r++) {
                var item = document.createElement("div");
                item.className = "dashboard-top-item";
                var rank = document.createElement("span");
                rank.className = "dashboard-top-rank";
                rank.appendChild(document.createTextNode(String(r + 1)));
                /* Use preset color if available */
                var presetObj = null;
                for (var pi = 0; pi < presets.length; pi++) {
                    if (presets[pi].name === launches[r].name) { presetObj = presets[pi]; break; }
                }
                if (presetObj && presetObj.color) {
                    rank.style.background = presetObj.color;
                    rank.style.borderColor = presetObj.color;
                }
                var name = document.createElement("span");
                name.className = "dashboard-top-name";
                name.appendChild(document.createTextNode(launches[r].name));
                var cnt = document.createElement("span");
                cnt.className = "dashboard-top-count";
                cnt.appendChild(document.createTextNode("\u00d7" + launches[r].count));
                item.appendChild(rank);
                item.appendChild(name);
                item.appendChild(cnt);
                topList.appendChild(item);
            }
        }
    }

    /* Draw 7-day chart */
    drawDashboardChart();
}

function drawDashboardChart() {
    var canvas = el("dashboard-chart");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    /* Gather last 7 days of launches from history */
    var raw = el("__history_data") ? el("__history_data").value : "";
    var entries = [];
    if (raw) { try { entries = JSON.parse(raw); } catch(e) {} }

    var now = new Date();
    var days = [];
    for (var d = 6; d >= 0; d--) {
        var date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);
        days.push({ ts: date.getTime(), count: 0 });
    }
    for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.ts) continue;
        var ed = new Date(e.ts);
        ed.setHours(0, 0, 0, 0);
        for (var j = 0; j < days.length; j++) {
            if (days[j].ts === ed.getTime()) { days[j].count++; break; }
        }
    }

    var maxVal = 1;
    for (var k = 0; k < days.length; k++) {
        if (days[k].count > maxVal) maxVal = days[k].count;
    }

    var barW = (W - 20) / 7;
    var barH = H - 24;
    ctx.fillStyle = "#333333";
    for (var b = 0; b < days.length; b++) {
        var h = (days[b].count / maxVal) * barH;
        var x = 10 + b * barW + 4;
        var y = H - 14 - h;
        var w = barW - 8;
        if (h > 0) {
            ctx.fillStyle = "#E8E8E8";
            ctx.fillRect(x, y, w, h);
        }
        /* Label */
        ctx.fillStyle = "#555555";
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        var dl = new Date(days[b].ts);
        ctx.fillText(String(dl.getDate()) + "." + String(dl.getMonth() + 1), x + w / 2, H - 2);
    }
}

/* ── §F3 · Export statistics ─────────────────────────────── */
function exportStatsCSV() {
    var lines = ["Preset,Launches,LastLaunch,PlaceId,LinkCode"];
    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        var last = p.lastLaunch ? new Date(p.lastLaunch).toISOString() : "";
        lines.push('"' + (p.name || "").replace(/"/g, '""') + '",' +
                   (p.launches || 0) + ',' + last + ',"' + (p.placeId || "") + '","' + (p.linkCode || "") + '"');
    }
    var csv = lines.join("\n");
    el("__dash_export_req").value = "csv:" + encodeURIComponent(csv);
    sendCmd("CMD:export_stats");
}

function exportStatsJSON() {
    var data = [];
    for (var i = 0; i < presets.length; i++) {
        var p = presets[i];
        data.push({
            name: p.name || "",
            placeId: p.placeId || "",
            linkCode: p.linkCode || "",
            launches: p.launches || 0,
            lastLaunch: p.lastLaunch || 0,
            favorite: !!p.favorite,
            method: p.method || 1
        });
    }
    el("__dash_export_req").value = "json:" + encodeURIComponent(JSON.stringify(data, null, 2));
    sendCmd("CMD:export_stats");
}

/* ── §G1 · Backup / restore ──────────────────────────────── */
function openBackup() {
    var overlay = el("backup-overlay");
    if (!overlay) return;
    overlay.style.display = "flex";
    setTimeout(function () { overlay.className = "backup-overlay backup-overlay-visible"; }, 10);
}

function closeBackup() {
    var overlay = el("backup-overlay");
    if (!overlay) return;
    overlay.className = "backup-overlay";
    setTimeout(function () { overlay.style.display = "none"; }, 200);
}

function createBackup() {
    sendCmd("CMD:backup_create");
    closeBackup();
    var S = STRINGS[currentLang] || STRINGS.ru;
    setTimeout(function () { showToast(S.backupDone, null, null, 3000); }, 300);
}

function restoreBackup() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    showToast(S.backupRestoreConfirm, S.exitConfirmYes, function () {
        sendCmd("CMD:backup_restore");
        closeBackup();
        setTimeout(function () {
            /* Reload state from AHK */
            sendCmd("CMD:reload_state");
        }, 500);
    }, 8000);
}

/* ── §A4 · SVG icon helpers (data-URI based) ─────────────── */
var SVG_ICONS = {
    copy:  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    history: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    chart: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    backup: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

/* ── §E1 · Theme preset thumbnail builder ────────────────── */
function buildTPThumb(p) {
    var thumb = document.createElement("div");
    thumb.className = "tp-thumb";
    thumb.style.background = p.bg || "#0A0A0A";

    var surf = document.createElement("div");
    surf.className = "tp-thumb-surface";
    surf.style.background = p.surface || "#111111";
    thumb.appendChild(surf);

    var acc = document.createElement("div");
    acc.className = "tp-thumb-accent";
    acc.style.background = p.accent || "#FFFFFF";
    thumb.appendChild(acc);

    var txt = document.createElement("div");
    txt.className = "tp-thumb-text";
    txt.style.color = p.text || "#E8E8E8";
    txt.appendChild(document.createTextNode(p.name || ""));
    thumb.appendChild(txt);

    return thumb;
}

/* ── §enhancements · Wire up all new event handlers ──────── */
function initEnhancements() {
    /* History button */
    var bh = el("btn-history");
    if (bh) bh.onclick = function () { openHistory(); };
    var hc = el("history-close");
    if (hc) hc.onclick = closeHistory;

    /* Dashboard button */
    var bd = el("btn-dashboard");
    if (bd) bd.onclick = function () { openDashboard(); };
    var dc = el("dashboard-close");
    if (dc) dc.onclick = closeDashboard;
    var dcancel = el("dashboard-cancel");
    if (dcancel) dcancel.onclick = closeDashboard;

    /* Dashboard export */
    var dcsv = el("btn-dash-csv");
    if (dcsv) dcsv.onclick = exportStatsCSV;
    var djson = el("btn-dash-json");
    if (djson) djson.onclick = exportStatsJSON;

    /* Backup button */
    var bb = el("btn-backup");
    if (bb) bb.onclick = function () { openBackup(); };
    var bc = el("backup-close");
    if (bc) bc.onclick = closeBackup;
    var bcreate = el("btn-backup-create");
    if (bcreate) bcreate.onclick = createBackup;
    var brestore = el("btn-backup-restore");
    if (brestore) brestore.onclick = restoreBackup;

    /* Sort buttons */
    var sortBtns = ["sort-manual", "sort-name", "sort-date", "sort-launches", "sort-fav"];
    var sortVals = ["manual", "name", "date", "launches", "fav"];
    for (var si = 0; si < sortBtns.length; si++) {
        var sbtn = el(sortBtns[si]);
        if (sbtn) {
            sbtn.onclick = (function (v) { return function () { applySort(v); }; })(sortVals[si]);
        }
    }

    /* Sort bar collapse/expand toggle */
    var sortToggle = el("sort-toggle");
    if (sortToggle) sortToggle.onclick = function () { toggleSortBar(); };
    var sortShow = el("sort-show");
    if (sortShow) sortShow.onclick = function () { toggleSortBar(); };

    /* Compact mode toggle */
    var compactTrack = el("compact-track");
    if (compactTrack) compactTrack.onclick = function () { toggleCompactMode(); };

    /* History filters */
    var hfa = el("hist-filter-all");
    if (hfa) hfa.onclick = function () { setHistoryFilter("all"); };
    var hft = el("hist-filter-today");
    if (hft) hft.onclick = function () { setHistoryFilter("today"); };
    var hfw = el("hist-filter-week");
    if (hfw) hfw.onclick = function () { setHistoryFilter("week"); };

    /* History clear */
    var hclr = el("btn-history-clear");
    if (hclr) hclr.onclick = function () {
        sendCmd("CMD:clear_history");
        setTimeout(function () { renderHistory(); }, 200);
    };

    /* Close overlays on background click */
    var histOv = el("history-overlay");
    if (histOv) histOv.onclick = function (e) {
        e = e || window.event;
        if (e.target === histOv) closeHistory();
    };
    var dashOv = el("dashboard-overlay");
    if (dashOv) dashOv.onclick = function (e) {
        e = e || window.event;
        if (e.target === dashOv) closeDashboard();
    };
    var bkOv = el("backup-overlay");
    if (bkOv) bkOv.onclick = function (e) {
        e = e || window.event;
        if (e.target === bkOv) closeBackup();
    };

    /* Override close button to check dirty state */
    var closeBtn = el("btn-close");
    if (closeBtn) closeBtn.onclick = function () { requestExit(); };

    /* Initialize drag-and-drop */
    initDragDrop();
}

function setHistoryFilter(mode) {
    historyFilter = mode;
    var opts = [
        {id:"hist-filter-all",   val:"all"},
        {id:"hist-filter-today", val:"today"},
        {id:"hist-filter-week",  val:"week"}
    ];
    for (var i = 0; i < opts.length; i++) {
        var btn = el(opts[i].id);
        if (!btn) continue;
        btn.className = (mode === opts[i].val)
            ? "history-filter-opt history-filter-active" : "history-filter-opt";
    }
    renderHistory();
}

/* ── §enhancements · Apply language to new UI elements ──── */
function applyEnhancementLanguage() {
    var S = STRINGS[currentLang] || STRINGS.ru;

    /* Sort bar labels */
    setText("lbl-sort", S.sortLabel);
    setText("sort-manual", S.sortManual);
    setText("sort-name", S.sortName);
    setText("sort-date", S.sortDate);
    setText("sort-launches", S.sortLaunches);
    setText("sort-fav", S.sortFav);

    /* Status bar */
    setText("chk-txt-compact", S.compactMode);

    /* History modal */
    setText("history-title-text", S.historyTitle);
    setText("hist-th-preset", S.historyColPreset);
    setText("hist-th-date", S.historyColDate);
    setText("hist-th-status", S.historyColStatus);
    setText("hist-th-place", S.historyColPlaceId);
    setText("hist-filter-all", S.historyFilterAll);
    setText("hist-filter-today", S.historyFilterToday);
    setText("hist-filter-week", S.historyFilterWeek);
    setText("btn-history-clear", S.historyClear);

    /* Dashboard modal */
    setText("dashboard-title-text", S.dashboardTitle);
    setText("btn-dash-csv", S.dashboardExportCsv);
    setText("btn-dash-json", S.dashboardExportJson);

    /* Backup modal */
    setText("backup-title-text", S.backupTitle);
    setText("btn-backup-create", S.backupCreate);
    setText("btn-backup-restore", S.backupRestore);

    /* Search placeholder */
    var si = el("search-inp");
    if (si) si.setAttribute("placeholder", S.searchAllFields);

    /* Update status bar */
    updateStatusBar();
    updateEmptyState();
}
/* ============================================================
   §v17 · NEW FEATURES IMPLEMENTATION
   Context menu, multi-select, grid view, recent, color labels,
   preset icons, preview tooltip, undo rename/move, search highlight,
   Roblox notifications, window position, method persistence
   ============================================================ */

/* ── 1. Context menu (right-click on preset) ─────────────── */
var ctxPresetId = null;
var ctxPresetEl = null;
var ctxActionId = null;  /* saved ID for action execution after menu hide */

function showContextMenu(e, presetId) {
    e = e || window.event;
    if (!e) return;
    cancelEv(e);
    var menu = el("ctx-menu");
    if (!menu) return;
    ctxPresetId = presetId;
    ctxActionId = presetId;  /* save for action */
    var S = STRINGS[currentLang] || STRINGS.ru;
    setText("ctx-launch-text", S.ctxLaunch);
    setText("ctx-copy-text", S.ctxCopyLink);
    setText("ctx-dup-text", S.ctxDuplicate);
    setText("ctx-edit-text", S.ctxEdit);
    setText("ctx-color-text", S.ctxSetColor);
    setText("ctx-icon-text", S.ctxSetIcon);
    setText("ctx-del-text", S.ctxDelete);
    var x = e.clientX || 0;
    var y = e.clientY || 0;
    menu.style.display = "block";
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    var mw = menu.offsetWidth || 160;
    var mh = menu.offsetHeight || 200;
    var ww = document.documentElement.clientWidth || 420;
    var wh = document.documentElement.clientHeight || 600;
    if (x + mw > ww) menu.style.left = (ww - mw - 4) + "px";
    if (y + mh > wh) menu.style.top = (wh - mh - 4) + "px";
}

function hideContextMenu() {
    var menu = el("ctx-menu");
    if (menu) menu.style.display = "none";
    /* Don't clear ctxPresetId here — it's cleared after action runs.
       Use ctxActionId for actions so they work even after hide. */
}

function initContextMenu() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var items = [
        {id:"ctx-launch", fn:function(){ if(ctxActionId){loadPreset(ctxActionId); sendCmd("CMD:launch");} ctxActionId=null; }},
        {id:"ctx-copy", fn:function(){ if(ctxActionId) copyPresetLink(ctxActionId); ctxActionId=null; }},
        {id:"ctx-duplicate", fn:function(){ if(ctxActionId) duplicatePreset(ctxActionId); ctxActionId=null; }},
        {id:"ctx-edit", fn:function(){ if(ctxActionId) openPresetEditModal(ctxActionId); ctxActionId=null; }},
        {id:"ctx-color", fn:function(){ if(ctxActionId) openPresetColorPicker(ctxActionId); ctxActionId=null; }},
        {id:"ctx-icon", fn:function(){ if(ctxActionId) openPresetIconEditor(ctxActionId); ctxActionId=null; }},
        {id:"ctx-delete", fn:function(){ if(ctxActionId) { deletePresetWithUndo(ctxActionId); } ctxActionId=null; }}
    ];
    for (var i = 0; i < items.length; i++) {
        var elItem = el(items[i].id);
        if (elItem) {
            (function(fn){
                elItem.onmousedown = function(e) {
                    e = e || window.event;
                    if (e.stopPropagation) e.stopPropagation();
                    try { e.cancelBubble = true; } catch(x){}
                };
                elItem.onclick = function(e){
                    e = e || window.event;
                    cancelEv(e);
                    if (e.stopPropagation) e.stopPropagation();
                    try { e.cancelBubble = true; } catch(x){}
                    hideContextMenu();
                    fn();
                };
            })(items[i].fn);
        }
    }
    /* Close menu on outside click */
    var menuEl = el("ctx-menu");
    document.onmousedown = function(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        if (menuEl && menuEl.style.display !== "none") {
            var inside = false;
            var node = target;
            while (node) {
                if (node === menuEl) { inside = true; break; }
                node = node.parentNode;
            }
            if (!inside) { hideContextMenu(); ctxActionId = null; }
        }
    };
    /* Esc-to-close is handled centrally in window.onload's document.onkeydown */
}

/* ── 2. Mouse wheel scroll on presets list ───────────────── */
function initMouseWheel() {
    var list = el("presets-list");
    if (!list) return;
    /* IE11 supports onmousewheel */
    list.onmousewheel = function(e) {
        e = e || window.event;
        /* Let the browser handle it naturally — the list has overflow:auto */
        return true;
    };
    /* Ensure focus so wheel works */
    list.onmouseenter = function() { try { list.focus(); } catch(x){} };
}

/* ── 3. Recent section (last 3 launched) ─────────────────── */
function buildRecentHeader() {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var hd = document.createElement("div");
    hd.className = "recent-header";
    var txt = document.createElement("span");
    txt.className = "recent-header-text";
    txt.appendChild(document.createTextNode(S.recentSection));
    var line = document.createElement("span");
    line.className = "recent-header-line";
    hd.appendChild(txt);
    hd.appendChild(line);
    return hd;
}

function getRecentPresets() {
    var recent = [];
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].lastLaunch && presets[i].lastLaunch > 0) {
            recent.push(presets[i]);
        }
    }
    recent.sort(function(a, b) { return (b.lastLaunch||0) - (a.lastLaunch||0); });
    return recent.slice(0, 3);
}

/* ── 4. Enhanced active preset indicator ─────────────────── */
function updateActiveRowIndicator() {
    var list = el("presets-list");
    if (!list) return;
    var rows = list.childNodes;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row || !row.getAttribute) continue;
        var rowId = row.getAttribute("data-id");
        if (rowId === lastLoadedPresetId) {
            /* Already has preset-row-active from renderPresets */
            row.className = row.className + " preset-row-enhanced-active";
        } else {
            row.className = (" " + row.className + " ").replace(/\s*preset-row-enhanced-active\s+/g, " ").replace(/^\s+|\s+$/g, "");
        }
    }
}

/* ── 5. Multi-select with Ctrl+click ─────────────────────── */
function togglePresetSelection(id) {
    if (selectedPresets[id]) {
        delete selectedPresets[id];
    } else {
        selectedPresets[id] = true;
    }
    updateMultiSelectUI();
    renderPresets();
}

function clearMultiSelect() {
    selectedPresets = {};
    updateMultiSelectUI();
    renderPresets();
}

function updateMultiSelectUI() {
    var count = 0;
    for (var k in selectedPresets) { if (selectedPresets[k]) count++; }
    var tb = el("multi-toolbar");
    if (!tb) return;
    if (count > 0) {
        tb.style.display = "-ms-flexbox";
        tb.style.display = "flex";
        var S = STRINGS[currentLang] || STRINGS.ru;
        setText("multi-count", count + " " + S.multiSelected);
    } else {
        tb.style.display = "none";
    }
}

function deleteSelectedPresets() {
    var count = 0;
    var S = STRINGS[currentLang] || STRINGS.ru;
    for (var k in selectedPresets) {
        if (selectedPresets[k]) {
            for (var i = presets.length - 1; i >= 0; i--) {
                if (presets[i].id === k) {
                    presets.splice(i, 1);
                    count++;
                    break;
                }
            }
        }
    }
    selectedPresets = {};
    updateMultiSelectUI();
    renderPresets();
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:del_preset");
    showToast(count + " " + (count === 1 ? S.ctxDelete : S.ctxDelete), null, null, 2500);
}

function exportSelectedPresets() {
    /* Open export modal and pre-select */
    openExportModal();
    /* Select all that are in selectedPresets */
    setTimeout(function() {
        var checkboxes = document.querySelectorAll(".export-checkbox");
        for (var i = 0; i < checkboxes.length; i++) {
            var pid = checkboxes[i].getAttribute("data-pid");
            if (pid && selectedPresets[pid]) {
                checkboxes[i].className = "export-checkbox export-checkbox-on";
            }
        }
        selectedPresets = {};
        updateMultiSelectUI();
    }, 100);
}

/* ── 6. Drag presets between groups ──────────────────────── */
function initGroupDropZones() {
    var chips = document.querySelectorAll(".group-chip");
    for (var i = 0; i < chips.length; i++) {
        var chip = chips[i];
        chip.ondragover = function(e) {
            e = e || window.event;
            cancelEv(e);
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
            this.className = this.className + " group-chip-drop";
            return false;
        };
        chip.ondragleave = function() {
            this.className = this.className.replace(/\s*group-chip-drop\s*/g, " ");
        };
        chip.ondrop = (function(chipEl) {
            return function(e) {
                e = e || window.event;
                cancelEv(e);
                chipEl.className = chipEl.className.replace(/\s*group-chip-drop\s*/g, " ");
                var pid = e.dataTransfer ? e.dataTransfer.getData("Text") : "";
                if (!pid) return;
                var groupKey = chipEl.getAttribute("data-filter");
                var targetGroupId = (groupKey === "ungrouped" || groupKey === "all") ? "" : groupKey;
                var p = findPreset(pid);
                if (p) {
                    var oldGroup = p.groupId || "";
                    p.groupId = targetGroupId;
                    flushPresetsOut();
                    renderPresets();
                    setDirty();
                    sendCmd("CMD:save_preset");
                    var S = STRINGS[currentLang] || STRINGS.ru;
                    showToast(S.undoMove, S.undoBtn, function() {
                        p.groupId = oldGroup;
                        flushPresetsOut();
                        renderPresets();
                        sendCmd("CMD:save_preset");
                    }, 4000);
                }
            };
        })(chip);
    }
}

/* ── 7. Undo for rename ──────────────────────────────────── */
var undoRenameData = null;
function recordRename(id, oldName, newName) {
    undoRenameData = { id: id, oldName: oldName, newName: newName };
    var S = STRINGS[currentLang] || STRINGS.ru;
    showToast(S.undoRename, S.undoBtn, function() {
        if (!undoRenameData) return;
        var p = findPreset(undoRenameData.id);
        if (p) {
            p.name = undoRenameData.oldName;
            flushPresetsOut();
            renderPresets();
            sendCmd("CMD:save_preset");
        }
        undoRenameData = null;
    }, 5000);
}

/* ── 8. Search with highlight ────────────────────────────── */
function highlightSearchText(text, query) {
    if (!query) return text;
    var q = trim(query).toLowerCase();
    if (!q) return text;
    var lower = text.toLowerCase();
    var idx = lower.indexOf(q);
    if (idx < 0) return text;
    var before = text.substring(0, idx);
    var match = text.substring(idx, idx + q.length);
    var after = text.substring(idx + q.length);
    return before + '<span class="search-hl">' + match + '</span>' + after;
}

/* ── 9. Preset color label ───────────────────────────────── */
var PRESET_COLORS = ["#EF4444","#F59E0B","#22C55E","#06B6D4","#6366F1","#8B5CF6","#EC4899","#6B7280"];

function openPresetColorPicker(id) {
    var p = findPreset(id);
    if (!p) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    /* Simple color selection via prompt-like UI using existing color picker */
    /* For simplicity, cycle through colors or use native color input */
    var currentColor = p.color || "";
    var idx = currentColor ? PRESET_COLORS.indexOf(currentColor) : -1;
    var nextIdx = (idx + 1) % (PRESET_COLORS.length + 1);
    if (nextIdx === PRESET_COLORS.length) {
        /* Clear color */
        delete p.color;
        showToast(S.ctxClearColor, null, null, 2000);
    } else {
        p.color = PRESET_COLORS[nextIdx];
    }
    flushPresetsOut();
    renderPresets();
    setDirty();
    sendCmd("CMD:save_preset");
}

/* ── 10. Preset icon (emoji) ─────────────────────────────── */
function openPresetIconEditor(id) {
    var p = findPreset(id);
    if (!p) return;
    var S = STRINGS[currentLang] || STRINGS.ru;
    /* Use a simple inline input in the row for now */
    var icon = window.prompt ? null : null; /* IE11 may not have prompt in Shell.Explorer */
    /* Use the color picker approach — cycle through common emojis */
    var EMOJIS = ["🎮","🏆","⭐","🔥","💎","🎯","🚀","⚔️","🛡️","🏰","👑","🌟"];
    var currentIcon = p.icon || "";
    var idx = currentIcon ? EMOJIS.indexOf(currentIcon) : -1;
    var nextIdx = (idx + 1) % (EMOJIS.length + 1);
    if (nextIdx === EMOJIS.length) {
        delete p.icon;
    } else {
        p.icon = EMOJIS[nextIdx];
    }
    flushPresetsOut();
    renderPresets();
    setDirty();
    sendCmd("CMD:save_preset");
}

/* ── 11. Preview tooltip (rich) ──────────────────────────── */
function buildPresetPreview(p) {
    var S = STRINGS[currentLang] || STRINGS.ru;
    var tip = document.createElement("div");
    tip.className = "preset-preview-tip";
    var rows = [
        { label: S.labelPresets || "Preset", value: p.name || "—" },
        { label: S.previewPlaceId, value: p.placeId || "—" },
        { label: S.previewLinkCode, value: abbrev(p.linkCode || "", 20) },
        { label: S.previewLaunches, value: String(p.launches || 0) },
        { label: S.previewLast, value: p.lastLaunch ? formatRelativeTime(p.lastLaunch) : S.statusBarNever }
    ];
    for (var i = 0; i < rows.length; i++) {
        var row = document.createElement("div");
        row.className = "pv-row";
        var lab = document.createElement("span");
        lab.className = "pv-label";
        lab.appendChild(document.createTextNode(rows[i].label));
        var val = document.createElement("span");
        val.className = "pv-value";
        val.appendChild(document.createTextNode(rows[i].value));
        row.appendChild(lab);
        row.appendChild(val);
        tip.appendChild(row);
    }
    return tip.innerHTML;
}

/* ── 12. Grid view toggle ────────────────────────────────── */
function toggleGridView() {
    gridViewMode = !gridViewMode;
    var list = el("presets-list");
    if (list) {
        if (gridViewMode) list.className = (list.className || "") + " grid-view";
        else list.className = (list.className || "").replace(/\s*grid-view\s*/g, " ");
    }
    /* Sync buttons */
    var vl = el("view-list");
    var vg = el("view-grid");
    if (vl) vl.className = gridViewMode ? "view-btn" : "view-btn view-active";
    if (vg) vg.className = gridViewMode ? "view-btn view-active" : "view-btn";
    /* Re-render presets so rows are rebuilt for grid/list mode */
    renderPresets();
    sendResize();
}

/* ── 13. Roblox start/stop notifications ─────────────────── */
function checkRobloxNotification() {
    var val = el("__roblox_status") ? el("__roblox_status").value : "0";
    var S = STRINGS[currentLang] || STRINGS.ru;
    if (val === "1" && prevRobloxStatus !== "1") {
        showToast(S.robloxStarted, null, null, 3000);
    } else if (val !== "1" && prevRobloxStatus === "1") {
        showToast(S.robloxClosed, null, null, 3000);
    }
    prevRobloxStatus = val;
}

/* ── 14. Window position persistence ─────────────────────── */
function saveWindowPosition() {
    /* Ask AHK to save current window position */
    sendCmd("CMD:save_window_pos");
}

/* ── 15. Method persistence ──────────────────────────────── */
function loadSavedMethod() {
    var saved = el("__cfg_method") ? el("__cfg_method").value : "1";
    if (saved === "2") switchMethod(2);
    else switchMethod(1);
}

/* ── Wire up all new features ────────────────────────────── */
function initV17Features() {
    /* Context menu */
    initContextMenu();

    /* Mouse wheel */
    initMouseWheel();

    /* View toggle */
    var vl = el("view-list");
    if (vl) vl.onclick = function() { if (gridViewMode) toggleGridView(); };
    var vg = el("view-grid");
    if (vg) vg.onclick = function() { if (!gridViewMode) toggleGridView(); };

    /* Multi-select toolbar buttons */
    var md = el("multi-delete-btn");
    if (md) md.onclick = deleteSelectedPresets;
    var me = el("multi-export-btn");
    if (me) me.onclick = exportSelectedPresets;
    var mc = el("multi-clear-btn");
    if (mc) mc.onclick = clearMultiSelect;

    /* Roblox status poll for notifications */
    setInterval(checkRobloxNotification, 3000);

    /* Save window position on minimize/close */
    var btnMin = el("btn-min");
    if (btnMin) {
        var prevMin = btnMin.onclick;
        btnMin.onclick = function(e) { saveWindowPosition(); if (prevMin) try { prevMin(e); } catch(x){} };
    }
    var btnSave = el("btn-save");
    if (btnSave) {
        var prevSave = btnSave.onclick;
        btnSave.onclick = function(e) { saveWindowPosition(); if (prevSave) try { prevSave(e); } catch(x){} };
    }

    /* Group drop zones (re-init after each render) */
    setTimeout(function() { initGroupDropZones(); }, 500);
}

/* Override buildPresetRow to add new features + grid rebuild */
var origBuildPresetRow = buildPresetRow;
buildPresetRow = function(p, dispIdx, bucketItems, posInBucket) {
    var row = origBuildPresetRow(p, dispIdx, bucketItems, posInBucket);

    /* Add selected state */
    if (selectedPresets[p.id]) {
        row.className = row.className + " preset-selected";
    }

    /* Add color bar if preset has color */
    if (p.color) {
        var cbar = document.createElement("span");
        cbar.className = "preset-color-bar";
        cbar.style.background = p.color;
        row.insertBefore(cbar, row.firstChild);
    }

    /* Add emoji icon if preset has icon */
    if (p.icon) {
        var emoji = document.createElement("span");
        emoji.className = "preset-emoji";
        emoji.appendChild(document.createTextNode(p.icon));
        var dot = row.querySelector(".preset-dot");
        if (dot && dot.nextSibling) {
            row.insertBefore(emoji, dot.nextSibling);
        } else {
            row.insertBefore(emoji, row.firstChild);
        }
    }

    /* Right-click context menu */
    row.oncontextmenu = function(e) {
        e = e || window.event;
        showContextMenu(e, p.id);
        return false;
    };

    /* Ctrl+click for multi-select */
    var origClick = row.onclick;
    row.onclick = function(e) {
        e = e || window.event;
        if (e.ctrlKey || e.metaKey) {
            cancelEv(e);
            togglePresetSelection(p.id);
            return false;
        }
        if (origClick) try { origClick(e); } catch(x){}
    };

    /* Rich preview tooltip */
    var nameEl = row.querySelector(".preset-name");
    if (nameEl) {
        nameEl.setAttribute("data-tooltip-html", buildPresetPreview(p));
    }

    /* Make row draggable for group assignment */
    row.setAttribute("draggable", "true");
    row.ondragstart = function(e) {
        e = e || window.event;
        if (e.dataTransfer) {
            e.dataTransfer.setData("Text", p.id);
            e.dataTransfer.effectAllowed = "move";
        }
    };

    /* If grid mode is active, rebuild row content for grid layout */
    if (gridViewMode) {
        p._dispIdx = dispIdx;
        rebuildRowForGrid(row, p);
    }

    return row;
};

/* Rebuild a preset row's content for grid view — clean, no flex conflicts */
function rebuildRowForGrid(row, p) {
    /* Clear all existing children */
    row.innerHTML = "";

    /* Set inline styles on row — highest specificity, overrides all CSS */
    row.style.cssText = 
        "width: 48% !important;" +
        "float: left !important;" +
        "display: block !important;" +
        "height: 56px !important;" +
        "min-height: 56px !important;" +
        "max-height: 56px !important;" +
        "padding: 6px 8px 6px 12px !important;" +
        "border: 1px solid #1E1E1E !important;" +
        "border-radius: 8px !important;" +
        "margin: 0 1% 5px 1% !important;" +
        "box-sizing: border-box !important;" +
        "position: relative !important;" +
        "overflow: hidden !important;" +
        "vertical-align: top !important;";

    /* Color bar (left accent) */
    if (p.color) {
        var cbar = document.createElement("span");
        cbar.style.cssText = "width:3px;height:100%;position:absolute;left:0;top:0;border-radius:8px 0 0 8px;background:" + p.color + ";";
        cbar.className = "preset-color-bar";
        row.appendChild(cbar);
    }

    /* Dot */
    var dot = document.createElement("span");
    dot.style.cssText = "width:14px;height:10px;font-size:7px;margin-right:4px;border-radius:3px;display:inline-block;vertical-align:middle;background:" + DOT_COLORS[(p._dispIdx || 0) % DOT_COLORS.length] + ";color:#fff;text-align:center;line-height:10px;font-weight:700;";
    dot.appendChild(document.createTextNode(String((p._dispIdx || 0) + 1)));
    row.appendChild(dot);

    /* Emoji icon */
    if (p.icon) {
        var emoji = document.createElement("span");
        emoji.style.cssText = "width:14px;height:14px;font-size:10px;line-height:14px;margin-right:4px;display:inline-block;vertical-align:middle;";
        emoji.appendChild(document.createTextNode(p.icon));
        row.appendChild(emoji);
    }

    /* Name */
    var name = document.createElement("span");
    name.style.cssText = "font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;display:inline-block;vertical-align:middle;max-width:100px;font-weight:600;color:#AAAAAA;";
    name.className = "preset-name";
    name.appendChild(document.createTextNode(p.name));
    name.setAttribute("data-tooltip-html", buildPresetPreview(p));
    row.appendChild(name);

    /* Launch count badge (top-right) */
    if (p.launches > 0) {
        var cnt = document.createElement("span");
        cnt.style.cssText = "font-size:8px;padding:1px 5px;border-radius:5px;background:#1A1A1A;font-weight:700;position:absolute;top:5px;right:7px;color:#888;";
        cnt.appendChild(document.createTextNode("\u00d7" + p.launches));
        row.appendChild(cnt);
    }

    /* Load button (bottom-right) */
    var load = document.createElement("button");
    load.style.cssText = "font-size:7px;padding:2px 8px;margin:0;border:1px solid #2A2A2A;border-radius:4px;background:none;color:#888;cursor:pointer;position:absolute;bottom:5px;right:7px;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;";
    load.innerHTML = (STRINGS[currentLang] || STRINGS.ru).loadBtn;
    load.setAttribute("data-pid", p.id);
    load.onclick = makeLoader(p.id);
    row.appendChild(load);

    /* Re-attach context menu */
    row.oncontextmenu = function(e) {
        e = e || window.event;
        showContextMenu(e, p.id);
        return false;
    };

    /* Re-attach ctrl+click */
    row.onclick = function(e) {
        e = e || window.event;
        if (e.ctrlKey || e.metaKey) {
            cancelEv(e);
            togglePresetSelection(p.id);
            return false;
        }
    };

    /* Re-attach draggable */
    row.setAttribute("draggable", "true");
    row.ondragstart = function(e) {
        e = e || window.event;
        if (e.dataTransfer) {
            e.dataTransfer.setData("Text", p.id);
            e.dataTransfer.effectAllowed = "move";
        }
    };

    /* Selected state */
    if (selectedPresets[p.id]) {
        row.style.background = "rgba(34,197,94,0.08)";
        row.style.borderColor = "rgba(34,197,94,0.5)";
    }
}

/* Override renderPresets to add recent section */
var origRenderPresets = renderPresets;
renderPresets = function() {
    origRenderPresets();
    /* Add recent section if there are recent presets and no active filter */
    if (presets.length > 3 && activeGroupFilter === "all" && !el("search-inp").value) {
        var recent = getRecentPresets();
        if (recent.length >= 2) {
            var list = el("presets-list");
            if (list && list.childNodes.length > 3) {
                /* Insert recent header after 3rd row */
                if (list.childNodes[3] && list.childNodes[3].className !== "recent-header") {
                    list.insertBefore(buildRecentHeader(), list.childNodes[3]);
                }
            }
        }
    }
    /* Re-init group drop zones after render */
    setTimeout(function() { initGroupDropZones(); }, 50);
    /* Update active row indicator */
    updateActiveRowIndicator();
    /* Apply search highlight */
    var si = el("search-inp");
    if (si && si.value) {
        var q = si.value;
        var names = document.querySelectorAll(".preset-name");
        for (var i = 0; i < names.length; i++) {
            var text = names[i].textContent || names[i].innerText || "";
            names[i].innerHTML = highlightSearchText(text, q);
        }
    }
};

/* Override confirmRename to record undo */
var origConfirmRename = confirmRename;
confirmRename = function(id, inp, nameSpan) {
    if (!inp.parentNode) return;
    inp.onblur = null;
    var newName = trim(inp.value);
    var oldName = "";
    for (var i = 0; i < presets.length; i++) {
        if (presets[i].id === id) { oldName = presets[i].name; break; }
    }
    inp.parentNode.removeChild(inp);
    nameSpan.style.display = "";
    renamingId = null;
    if (!newName) return;
    for (var j = 0; j < presets.length; j++) {
        if (presets[j].id === id) {
            presets[j].name = newName;
            nameSpan.innerHTML = "";
            nameSpan.appendChild(document.createTextNode(newName));
            break;
        }
    }
    flushPresetsOut();
    setDirty();
    sendCmd("CMD:save_preset");
    /* Record for undo */
    if (oldName !== newName) {
        recordRename(id, oldName, newName);
    }
};

/* ============================================================
   §maket-redesign · RVL v2.0 layout wiring
   Appended override — runs after all legacy code above, so it can
   safely reuse every existing function (loadPreset, onLaunch,
   openPresetEditModal, toggleFavorite, duplicatePreset,
   deletePresetWithUndo, startPresetHKCapture, copyPresetLink, ...)
   without touching their original definitions.
   ============================================================ */

/* New fixed-size layout: window no longer grows with the number of
   presets — the list scrolls internally instead (matches maket). */
BASE_W = 560;
var REDESIGN_FIXED_H = 402; /* fallback before layout has rendered */
var REDESIGN_MAIN_H  = 270; /* .main2 is a hard fixed height in CSS */

/* IE11's flex-grow has proven unreliable for the input-row's field
   group across several fix attempts. Bypass it entirely: measure the
   row and every fixed-width sibling in JS, then set the field group's
   width in pixels directly. Pixel arithmetic can't misbehave. */
function enforceHotkeyToggleVisibility() {
    var chk = el("toggle-track") ? el("toggle-track").parentNode : document.querySelector(".ir-hk-chk");
    if (!chk) return;
    chk.style.position   = "absolute";
    chk.style.right      = "10px";
    chk.style.top        = "50%";
    chk.style.marginTop  = "-13px";
    chk.style.marginLeft = "0";
    chk.style.width      = "78px";
    chk.style.maxWidth   = "78px";
    chk.style.minWidth   = "78px";
    chk.style.height     = "26px";
    chk.style.display    = "-ms-flexbox";
    chk.style.display    = "flex";
    chk.style.zIndex     = "5";
    chk.style.visibility = "visible";
    chk.style.opacity    = "1";
}

function layoutInputRow() {
    var row = el("input-row");
    var panel = el("method-tab-1") && el("method-tab-1").parentNode ? null : null;
    if (!row) return;
    var totalW = row.offsetWidth;
    if (!totalW) return;

    var fixedW = 0;
    var fixedIds = ["method-tabs", "ir-sep-hk"];
    var tabs = el("method-tabs");
    if (tabs) fixedW += tabs.offsetWidth;

    var sepEls = row.getElementsByClassName ? null : null;
    var seps = row.querySelectorAll(".ir-sep");
    for (var i = 0; i < seps.length; i++) fixedW += seps[i].offsetWidth;

    var key = el("inp-key");
    if (key) fixedW += key.offsetWidth;

    var cap = el("btn-capture");
    if (cap) fixedW += cap.offsetWidth;

    /* margins added between children via CSS (adjacent-sibling, 5px each) —
       one fewer now that chk-wrap is absolutely positioned (out of flow) */
    var childCount = row.children.length - 1;
    fixedW += Math.max(0, childCount - 1) * 5;

    var panel1 = el("method-panel-1");
    var panel2 = el("method-panel-2");
    var activePanel = (panel1 && panel1.style.display !== "none") ? panel1 : panel2;
    if (!activePanel) return;

    var padding = 10 + 96; /* input-row: 10px left + 96px right (reserved for the absolutely-positioned hotkey toggle) */
    var freeW = totalW - fixedW - padding;
    if (freeW < 60) freeW = 60;
    activePanel.style.width = freeW + "px";
    activePanel.style.msFlex = "0 0 " + freeW + "px";
    activePanel.style.flex = "0 0 " + freeW + "px";
}
calcWindowHeight = function () {
    var shell = el("app-shell");
    if (shell) {
        var h = shell.offsetHeight;
        if (h > 0) return h + 2; /* +2 px safety fudge for border rounding */
    }
    /* Fallback (shell not yet in DOM / zero height): sum known sections */
    var hdrH   = liveHeight("titlebar")  || 33;
    var irH    = liveHeight("input-row") || 37;
    var tbH    = liveHeight("toolbar")   || 37;
    var srtH   = liveHeight("sort-bar") || liveHeight("sort-collapsed") || 0;
    var grpH   = liveHeight("group-filter-bar") || 0;
    var stH    = liveHeight("status-bar")|| 19;
    var mainH  = document.body.className.indexOf("compact-mode") !== -1 ? 220 : REDESIGN_MAIN_H;
    var h2 = hdrH + irH + tbH + srtH + grpH + mainH + stH + 6;
    return h2 > 0 ? h2 : REDESIGN_FIXED_H;
};

/* The legacy openSettings() computed the modal's height by subtracting
   the (variable, content-driven) preset-list/search/sort row heights
   from the total window height — appropriate for the old "window grows
   with content" layout. In the redesign the window height is fixed and
   those rows no longer exist the same way, so that subtraction could
   collapse modalH to near zero. Simplify: let the modal fill the fixed
   overlay height directly (CSS max-height + the settings-body flex-fix
   below still apply on top of this). */
openSettings = function () {
    syncThemeControls();
    syncLangButtons();

    var winH = calcWindowHeight();
    var modalH = winH - 40; /* 20px overlay padding top+bottom */

    var modal = el("settings-modal");
    var sb    = modal ? modal.querySelector(".settings-body")   : null;
    var ftrEl = modal ? modal.querySelector(".settings-footer") : null;

    if (modal) {
        modal.style.maxHeight = "";
        modal.style.height    = modalH + "px";
        modal.style.position  = "";
    }
    if (ftrEl) {
        ftrEl.style.position = "";
        ftrEl.style.bottom   = "";
        ftrEl.style.left     = "";
        ftrEl.style.right    = "";
    }
    if (sb) {
        sb.style.height              = "";
        sb.style.maxHeight           = "";
        sb.style.msFlexPositive      = "1";
        sb.style.msFlexNegative      = "1";
        sb.style.msFlexPreferredSize = "0px";
        sb.style.flexGrow            = "1";
        sb.style.flexShrink          = "1";
        sb.style.flexBasis           = "0px";
    }

    var overlay = el("settings-overlay");
    overlay.style.height  = winH + "px";
    overlay.style.display = "flex";
    setTimeout(function () {
        overlay.className = "settings-overlay settings-overlay-visible";
    }, 10);
};

/* Compact tab labels — the legacy strings ("СПОСОБ 1"/"METHOD 1") are
   too wide for the single-row input bar in the redesigned layout. */
if (STRINGS.ru) { STRINGS.ru.methodTab1 = "СП 1"; STRINGS.ru.methodTab2 = "СП 2"; }
if (STRINGS.en) { STRINGS.en.methodTab1 = "M1";   STRINGS.en.methodTab2 = "M2"; }

/* "Недавние" (recent-launches) section removed per request. */
getRecentPresets = function () { return []; };

var detailPresetId = null;
var linkRevealed = false;

/* ── Compact list row (dot + name + hotkey + count + fav) ─── */
buildPresetRow = function (p, dispIdx, bucketItems, posInBucket) {
    p._dispIdx = dispIdx;
    var row = document.createElement("div");
    row.className = "preset-row pl-row" + (selectedPresets[p.id] ? " preset-selected" : "");
    row.setAttribute("data-id", p.id);
    row.setAttribute("data-group", p.groupId || "__ungrouped__");

    var dot = document.createElement("span");
    dot.className = "pl-dot";
    var dotColor = p.color || DOT_COLORS[dispIdx % DOT_COLORS.length];
    dot.style.background = dotColor;
    dot.appendChild(document.createTextNode(p.icon ? p.icon : String(dispIdx + 1)));

    var name = document.createElement("span");
    name.className = "pl-name";
    name.appendChild(document.createTextNode(p.name));
    name.setAttribute("data-tooltip-html", buildPresetPreview(p));

    row.appendChild(dot);
    row.appendChild(name);

    if (p.hotkey) {
        var hk = document.createElement("span");
        hk.className = "pl-hk";
        hk.appendChild(document.createTextNode(p.hotkey));
        row.appendChild(hk);
    }

    if (p.launches > 0) {
        var cnt = document.createElement("span");
        cnt.className = "pl-cnt";
        cnt.appendChild(document.createTextNode("\xD7" + p.launches));
        row.appendChild(cnt);
    }

    if (p.favorite) {
        var fav = document.createElement("span");
        fav.className = "pl-fav";
        fav.innerHTML = "&#9733;";
        row.appendChild(fav);
    }

    /* Click = select (load fields + populate detail panel) */
    row.onclick = function (e) {
        e = e || window.event;
        if (e.ctrlKey || e.metaKey) { cancelEv(e); togglePresetSelection(p.id); return false; }
        selectPresetDetail(p.id);
    };

    /* Double-click = launch immediately */
    row.ondblclick = function (e) {
        e = e || window.event;
        cancelEv(e);
        selectPresetDetail(p.id);
        onLaunch();
    };

    /* Right-click = existing context menu (launch/copy/dup/edit/color/icon/delete) */
    row.oncontextmenu = function (e) {
        e = e || window.event;
        showContextMenu(e, p.id);
        return false;
    };

    /* Drag = existing manual reorder (mousedown starts pending drag; a
       simple click without movement still fires row.onclick normally) */
    row.onmousedown = makeDragger(p.id);

    return row;
};

function selectPresetDetail(id) {
    loadPreset(id);
    detailPresetId = id;
    linkRevealed = false;
    renderDetailPanel(id);
}

function copyFieldToClipboard(text) {
    var S = STRINGS[currentLang] || STRINGS.ru;
    try {
        el("__clipboard_data").value = text || "";
        sendCmd("CMD:copy_clipboard");
        showToast(S.copyLinkDone, null, null, 2000);
    } catch (e) {}
}

function renderDetailPanel(id) {
    var p = findPreset(id);
    var emptyEl = el("pd-empty");
    var contentEl = el("pd-content");
    if (!p) {
        if (emptyEl) emptyEl.style.display = "";
        if (contentEl) contentEl.style.display = "none";
        return;
    }
    if (emptyEl) emptyEl.style.display = "none";
    if (contentEl) contentEl.style.display = "";

    el("pd-icon").innerHTML = p.icon ? p.icon : String((p._dispIdx || 0) + 1);
    var pdDotColor = p.color || DOT_COLORS[(p._dispIdx || 0) % DOT_COLORS.length];
    el("pd-icon").style.background = pdDotColor + "33";

    var nameEl = el("pd-name");
    nameEl.innerHTML = "";
    nameEl.appendChild(document.createTextNode(p.name));

    /* Tags: hotkey / favorite / group */
    var tags = el("pd-tags");
    tags.innerHTML = "";
    if (p.hotkey) {
        var t1 = document.createElement("span");
        t1.className = "pd-tag pd-tag-hk";
        t1.appendChild(document.createTextNode(p.hotkey));
        tags.appendChild(t1);
    }
    if (p.favorite) {
        var t2 = document.createElement("span");
        t2.className = "pd-tag pd-tag-fav";
        t2.innerHTML = "&#9733; Избранный";
        tags.appendChild(t2);
    }
    if (p.groupId) {
        var g = findGroup(p.groupId);
        if (g) {
            var t3 = document.createElement("span");
            t3.className = "pd-tag pd-tag-grp";
            t3.appendChild(document.createTextNode(g.name));
            tags.appendChild(t3);
        }
    }

    var isM2 = (p.method || 1) === 2;
    el("pd-lbl-place").innerHTML = isM2 ? "SHARE" : "PLACE ID";
    el("pd-val-place").innerHTML = "";
    el("pd-val-place").appendChild(document.createTextNode(isM2 ? "—" : (p.placeId || "—")));
    el("pd-copy-place").onclick = function () { copyFieldToClipboard(p.placeId || ""); };
    el("pd-copy-place").parentNode.parentNode.style.display = isM2 ? "none" : "";

    el("pd-lbl-link").innerHTML = isM2 ? "SHARE CODE" : "LINK CODE";
    var linkVal = el("pd-val-link");
    linkVal.innerHTML = "";
    linkVal.appendChild(document.createTextNode(linkRevealed ? (p.linkCode || "—") : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"));
    el("pd-copy-link").onclick = function () { copyFieldToClipboard(p.linkCode || ""); };
    el("pd-eye-link").onclick = function () { linkRevealed = !linkRevealed; renderDetailPanel(id); };

    el("pd-val-launches").innerHTML = "";
    el("pd-val-launches").appendChild(document.createTextNode(String(p.launches || 0)));

    el("pd-val-last").innerHTML = "";
    el("pd-val-last").appendChild(document.createTextNode(p.lastLaunch ? formatRelativeTime(p.lastLaunch) : "\u2014"));

    var hkRow = el("pd-row-hk");
    var hkVal = el("pd-val-hk");
    hkVal.innerHTML = "";
    hkVal.appendChild(document.createTextNode(p.hotkey || "\u2014"));
    if (hkRow) hkRow.style.display = "";
    el("pd-hk-assign").onclick = function () { startPresetHKCapture(id); };

    /* Footer actions */
    var favBtn = el("pd-fav");
    favBtn.className = "btn-tool" + (p.favorite ? " pd-fav-on" : "");
    favBtn.onclick = function () { toggleFavorite(id); renderDetailPanel(id); };
    el("pd-edit").onclick = function () { openPresetEditModal(id); };
    var dupBtn = el("pd-dup"); if (dupBtn) dupBtn.onclick = function () { duplicatePreset(id); };
    el("pd-del").onclick  = function () {
        deletePresetWithUndo(id);
        detailPresetId = null;
        renderDetailPanel(null);
    };
}

/* Re-apply compact icon-only labels after legacy applyLanguage() writes
   its full-text strings into the same elements (now repurposed as
   small icon buttons in the redesigned layout). */
var __origApplyLanguage = applyLanguage;
applyLanguage = function () {
    __origApplyLanguage();
    var lb = el("btn-launch"); if (lb) lb.innerHTML = "&#9654; ЗАПУСТИТЬ";
    var sb = el("btn-save");   if (sb) sb.innerHTML = "&#128190;";
    var cb = el("btn-capture"); if (cb && !capturingKey) cb.innerHTML = '<span class="ir-hk-capture-ring"></span>';
    var ht = el("chk-txt-hotkey"); if (ht) ht.innerHTML = "HK";
};

/* The original updateFavButtons() patches an old .preset-fav <button>
   in-place for performance — the compact row has no such button (the
   star is a plain conditional <span>), so favoriting never visibly
   updated. Rebuilding the list is cheap enough here; just re-render. */
updateFavButtons = function () {
    renderPresets();
};

/* Keep the detail panel in sync whenever the list is rebuilt
   (rename, favorite toggle from elsewhere, edit-modal save, etc.) */
var __origRenderPresets = renderPresets;
renderPresets = function () {
    __origRenderPresets();
    if (detailPresetId) renderDetailPanel(detailPresetId);
};

var __origSwitchMethod = switchMethod;
switchMethod = function (n) {
    __origSwitchMethod(n);
    layoutInputRow();
};

/* Wire up once the document + legacy init has run */
window.addEventListener("load", function () {
    var lastHkPing = "";
    setInterval(function () {
        var pingEl = el("__hotkey_launch_ping");
        if (!pingEl) return;
        var v = pingEl.value;
        if (v && v !== lastHkPing) {
            lastHkPing = v;
            var pid = v.split("|")[0];
            if (pid && findPreset(pid)) creditPresetLaunch(pid);
        }
    }, 250);

    layoutInputRow();
    enforceHotkeyToggleVisibility();
    window.addEventListener("resize", function () { layoutInputRow(); enforceHotkeyToggleVisibility(); });
    setInterval(enforceHotkeyToggleVisibility, 1000);
    /* Restore last-loaded preset (if any) into the detail panel on start */
    setTimeout(function () {
        if (lastLoadedPresetId) selectPresetDetail(lastLoadedPresetId);
        else if (presets.length > 0) renderDetailPanel(null);
        /* Force the window to the redesigned fixed size — overrides any
           stale width/height saved by AHK from before the redesign. */
        sendResize();
    }, 80);
});

/* ============================================================
   §updater · GitHub update bridge + startup splash
   The native host does all network/file work. The UI only publishes
   the user's intent and renders the current state from hidden inputs.
   ============================================================ */
var UPDATE_TEXT = {
    ru: {
        label: "ОБНОВЛЕНИЕ",
        title: "RVL всегда актуален",
        hint: "Проверка файлов приложения через GitHub",
        check: "ПРОВЕРИТЬ",
        checking: "Проверяю...",
        latest: "АКТУАЛЬНАЯ ВЕРСИЯ",
        available: "УСТАНОВИТЬ",
        ready: "Готово к обновлению",
        downloading: "ОБНОВЛЕНИЕ...",
        done: "Обновление завершено",
        boot: "Проверка локальных данных",
        startupChecking: "Проверяем версию RVL",
        startupLatest: "Установлена последняя версия",
        startupAvailable: "Доступно обновление",
        startupError: "Не удалось проверить обновления",
        promptTitle: "Доступно обновление",
        promptText: function(v) { return "Найдена новая версия RVL" + (v ? " · " + v : ""); },
        promptLater: "ПОЗЖЕ",
        promptInstall: "ОБНОВИТЬ"
    },
    en: {
        label: "UPDATE",
        title: "RVL is up to date",
        hint: "Check application files through GitHub",
        check: "CHECK",
        checking: "CHECKING...",
        latest: "UP TO DATE",
        available: "INSTALL",
        ready: "Ready to update",
        downloading: "UPDATING...",
        done: "Update complete",
        boot: "Checking local data",
        startupChecking: "Checking RVL version",
        startupLatest: "You have the latest version",
        startupAvailable: "An update is available",
        startupError: "Unable to check for updates",
        promptTitle: "Update available",
        promptText: function(v) { return "A new RVL version is available" + (v ? " · " + v : ""); },
        promptLater: "LATER",
        promptInstall: "UPDATE"
    }
};
var lastRenderedUpdateState = "";

function updateText() { return UPDATE_TEXT[currentLang] || UPDATE_TEXT.ru; }

function refreshUpdateLanguage() {
    var U = updateText();
    var label = el("lbl-update");
    var title = el("update-card-title");
    var hint = el("update-card-hint");
    if (label) label.innerHTML = U.label;
    if (title) title.innerHTML = U.title;
    if (hint) hint.innerHTML = U.hint;
    refreshUpdateBridge();
}

function hideUpdateScreen() {
    var overlay = el("update-screen-overlay");
    if (overlay) overlay.style.display = "none";
    window.__rvlInstallScreenRequested = false;
}

function retryUpdateFromScreen() {
    hideUpdateScreen();
    var stateEl = el("__update_state");
    if (stateEl) stateEl.value = "idle";
    sendCmd("CMD:check_update");
}

function renderUpdateScreen(state, version, message, progress) {
    var overlay = el("update-screen-overlay");
    if (!overlay) return;

    var requested = !!window.__rvlInstallScreenRequested;
    var visible = state === "downloading" || state === "installing" || (state === "error" && requested);
    if (!visible) {
        overlay.style.display = "none";
        return;
    }
    overlay.style.display = "-ms-flexbox";
    overlay.style.display = "flex";
    overlay.className = "update-screen-overlay" + (state === "error" ? " update-screen-error" : "") + (state === "installing" ? " update-screen-installing" : "");

    progress = Math.max(0, Math.min(100, parseInt(progress, 10) || 0));
    var ring = el("update-ring-fill");
    if (ring) ring.setAttribute("stroke-dashoffset", String(320.44 * (1 - progress / 100)));
    var percent = el("update-screen-percent");
    if (percent) percent.innerHTML = progress + "%";
    var ver = el("update-screen-version");
    if (ver && version) ver.innerHTML = "v" + version;

    var title = el("update-screen-title");
    var status = el("update-screen-status");
    var badge = el("update-screen-badge");
    var footer = el("update-screen-footer-text");
    var size = el("update-screen-size");
    var speed = el("update-screen-speed");
    var dismiss = el("update-screen-dismiss");
    if (state === "error") {
        if (title) title.innerHTML = "Не удалось обновить RVL";
        if (badge) badge.innerHTML = "ОШИБКА";
        if (status) status.innerHTML = message || "Попробуйте повторить попытку";
        if (footer) footer.innerHTML = "Файлы приложения не изменены";
        if (size) size.innerHTML = "Можно повторить обновление";
        if (speed) speed.innerHTML = "";
        if (dismiss) {
            dismiss.innerHTML = "ПОВТОРИТЬ";
            dismiss.style.display = "block";
        }
    } else if (state === "installing") {
        if (title) title.innerHTML = "Перезапускаем RVL";
        if (badge) badge.innerHTML = "ГОТОВО";
        if (status) status.innerHTML = message || "Файлы готовы к установке...";
        if (footer) footer.innerHTML = "Приложение запустится автоматически";
        if (size) size.innerHTML = "Обновление загружено";
        if (speed) speed.innerHTML = "Почти готово";
        if (dismiss) dismiss.style.display = "none";
    } else {
        if (title) title.innerHTML = progress > 3 ? "Скачиваем новую версию" : "Проверяем обновление";
        if (badge) badge.innerHTML = "ОБНОВЛЕНИЕ";
        if (status) status.innerHTML = message || "Подключаемся к GitHub...";
        if (footer) footer.innerHTML = "Не закрывайте окно — RVL перезапустится автоматически";
        if (size) size.innerHTML = progress > 0 ? "Загрузка файлов" : "Подготовка загрузки";
        if (speed) speed.innerHTML = "Идёт скачивание";
        if (dismiss) dismiss.style.display = "none";
    }

    var stepDownload = el("update-step-download");
    var stepInstall = el("update-step-install");
    var stepRestart = el("update-step-restart");
    if (stepDownload) stepDownload.className = "update-screen-step" + (progress < 100 ? " active" : " done");
    if (stepInstall) stepInstall.className = "update-screen-step" + (state === "installing" ? " active" : (progress >= 100 ? " done" : ""));
    if (stepRestart) stepRestart.className = "update-screen-step" + (state === "installing" ? " active" : "");
    var line = el("update-screen-line-fill");
    if (line) line.style.width = progress + "%";
}

function refreshUpdateBridge() {
    var stateEl = el("__update_state");
    var state = stateEl ? (stateEl.value || "idle") : "idle";
    var version = el("__update_version") ? el("__update_version").value : "";
    var message = el("__update_message") ? el("__update_message").value : "";
    var progress = parseInt(el("__update_progress") ? el("__update_progress").value : "0", 10);
    if (isNaN(progress)) progress = 0;

    var button = el("btn-check-update");
    var wrap = el("update-progress-wrap");
    var fill = el("update-progress-fill");
    var status = el("update-status");
    if (!button) return;

    button.disabled = state === "checking" || state === "downloading" || state === "installing";
    if (state === "available") {
        button.innerHTML = updateText().available + (version ? " " + version : "");
    } else if (state === "latest") {
        button.innerHTML = updateText().latest;
    } else if (state === "checking") {
        button.innerHTML = updateText().checking;
    } else if (state === "downloading") {
        button.innerHTML = updateText().downloading;
    } else if (state === "installing") {
        button.innerHTML = updateText().downloading;
    } else {
        button.innerHTML = updateText().check;
    }

    if (wrap) wrap.style.display = (state === "checking" || state === "available" || state === "downloading" || state === "error") ? "block" : "none";
    if (fill) fill.style.width = Math.max(0, Math.min(100, progress)) + "%";
    if (status) {
        var U = updateText();
        var text = message || (state === "available" ? U.ready : "");
        if (state === "checking") text = U.checking;
        else if (state === "available") text = U.ready;
        else if (state === "downloading") text = U.downloading;
        else if (state === "latest") text = U.title;
        status.innerHTML = text;
    }

    renderUpdateScreen(state, version, message, progress);

    /* Make failures and the actual start of installation visible even when
       the settings panel is closed behind the startup prompt. */
    if (state !== lastRenderedUpdateState) {
        if (state === "error" && !window.__rvlInstallScreenRequested && typeof showToast === "function") {
            /* AHK v1 builds made from an ANSI script can return mojibake.
               The external updater shows the detailed error; keep this
               compact toast localized and readable. */
            showToast(updateText().startupError, null, null, 6500);
        }
        lastRenderedUpdateState = state;
    }
}

function hideStartupScreen(resultState) {
    var splash = el("startup-screen");
    if (!splash) return;
    var status = el("startup-status");
    var notice = el("__update_notice") ? trim(el("__update_notice").value) : "";
    var version = el("__update_version") ? trim(el("__update_version").value) : "";
    var U = updateText();
    if (status) {
        if (notice) status.innerHTML = U.done;
        else if (resultState === "available") status.innerHTML = U.startupAvailable + (version ? " · " + version : "");
        else if (resultState === "latest") status.innerHTML = U.startupLatest;
        else if (resultState === "error") status.innerHTML = U.startupError;
        else status.innerHTML = U.boot;
    }
    var fill = el("startup-progress-fill");
    if (fill) {
        fill.style.width = "100%";
        fill.style.marginLeft = "0";
    }
    setTimeout(function () { splash.className = "startup-screen startup-screen-out"; }, notice ? 680 : 430);
    if (resultState === "available" && !notice) {
        setTimeout(function () { openUpdatePrompt(); }, 920);
    }
}

function openUpdatePrompt() {
    if (window.__rvlUpdatePromptShown) return;
    var state = el("__update_state") ? el("__update_state").value : "";
    if (state !== "available") return;
    window.__rvlUpdatePromptShown = true;
    var U = updateText();
    var version = el("__update_version") ? trim(el("__update_version").value) : "";
    var title = el("update-prompt-title");
    var copy = el("update-prompt-text");
    var later = el("update-prompt-later");
    var install = el("update-prompt-install");
    if (title) title.innerHTML = U.promptTitle;
    if (copy) copy.innerHTML = U.promptText(version);
    if (later) later.innerHTML = U.promptLater;
    if (install) install.innerHTML = U.promptInstall;
    var overlay = el("update-prompt-overlay");
    if (overlay) overlay.style.display = "-ms-flexbox";
    if (overlay) overlay.style.display = "flex";
}

function closeUpdatePrompt() {
    var overlay = el("update-prompt-overlay");
    if (overlay) overlay.style.display = "none";
}

function installUpdate() {
    /* Give immediate feedback before the modal disappears. This is useful
       with the legacy WebBrowser control where a click can otherwise look
       like a no-op while AHK is starting the downloader. */
    window.__rvlInstallScreenRequested = true;
    var installVersion = el("__update_version") ? el("__update_version").value : "";
    renderUpdateScreen("downloading", installVersion, "Подключаемся к GitHub...", 0);
    closeUpdatePrompt();
    var status = el("update-status");
    if (status) status.innerHTML = updateText().downloading;
    /* Direct bridge fallback for old IE/WebBrowser builds where a queued
       click command may be swallowed while the modal is closing. */
    var request = el("__update_install_req");
    if (request) request.value = "1";
    /* Same lightweight bridge as Mmacro: AHK polls one command property.
       Keep the hidden flag too, so both current and older builds work. */
    try { window.ahkCmd = "CMD:install_update"; } catch (e) {}
    sendCmd("CMD:install_update");
}

function handleUpdateButton() {
    var state = el("__update_state") ? el("__update_state").value : "idle";
    /* The settings button is an explicit install action once a version was
       found. The startup dialog still offers the separate LATER choice. */
    if (state === "available") installUpdate();
    else sendCmd("CMD:check_update");
    refreshUpdateBridge();
}

function startStartupVersionCheck() {
    if (window.__rvlStartupCheckStarted) return;
    window.__rvlStartupCheckStarted = true;
    var status = el("startup-status");
    if (status) status.innerHTML = updateText().startupChecking;
    sendCmd("CMD:check_update");

    var startedAt = new Date().getTime();
    function waitForResult() {
        var state = el("__update_state") ? (el("__update_state").value || "idle") : "idle";
        if (state === "latest" || state === "available" || state === "error") {
            hideStartupScreen(state);
            return;
        }
        /* Do not leave the user behind a splash forever if GitHub is offline. */
        if (new Date().getTime() - startedAt > 15000) {
            hideStartupScreen("error");
            return;
        }
        setTimeout(waitForResult, 120);
    }
    setTimeout(waitForResult, 120);
}

/* initApp is called by AHK after the saved state is injected. Wrapping it
   keeps the legacy initialization intact while giving startup a graceful exit. */
var __rvlInitApp = initApp;
initApp = function () {
    __rvlInitApp();
    refreshUpdateLanguage();
    startStartupVersionCheck();
};

/* Keep update labels in sync with the existing language switcher. */
var __rvlApplyLanguage = applyLanguage;
applyLanguage = function () {
    __rvlApplyLanguage();
    refreshUpdateLanguage();
};

window.addEventListener("load", function () {
    var updateButton = el("btn-check-update");
    if (updateButton) {
        updateButton.onclick = handleUpdateButton;
    }
    var laterButton = el("update-prompt-later");
    var installButton = el("update-prompt-install");
    if (laterButton) laterButton.onclick = closeUpdatePrompt;
    if (installButton) installButton.onclick = installUpdate;
    refreshUpdateLanguage();
    setInterval(refreshUpdateBridge, 250);
});
