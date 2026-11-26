"use strict";

const P = api.path;

const $ = s => document.querySelector(s);

const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
}[c]));

let monaco = null;

let editor = null;

let settings = {};

let settingsDefaults = {};

const LANGUAGE_OPTIONS = [ [ "en", "English" ], [ "pt-BR", "Português (Brasil)" ], [ "pt-PT", "Português (Portugal)" ], [ "zh-CN", "简体中文" ], [ "zh-TW", "繁體中文" ], [ "ru", "Русский" ], [ "es", "Español" ], [ "fr", "Français" ], [ "de", "Deutsch" ], [ "ja", "日本語" ], [ "ko", "한국어" ], [ "it", "Italiano" ] ];

const UI_TRANSLATIONS = {
    en: {
        SettingCount: "Setting",
        SettingsCount: "Settings",
        Found: "Found"
    },
    "pt-BR": {
        Language: "Idioma",
        "Display Language": "Idioma da interface",
        "Choose the language used by the Codec interface.": "Escolha o idioma da interface do Codec.",
        Explorer: "Explorador",
        Search: "Pesquisar",
        Extensions: "Extensões",
        Manage: "Gerenciar",
        "NO FOLDER OPENED": "NENHUMA PASTA ABERTA",
        "You have not yet opened a folder.": "Você ainda não abriu uma pasta.",
        "Open Folder": "Abrir pasta",
        "New File...": "Novo arquivo...",
        "New Folder...": "Nova pasta...",
        "Refresh Explorer": "Atualizar explorador",
        "Collapse Folders in Explorer": "Recolher pastas",
        "Opening a folder will close all currently open editors. To keep them open, add a folder instead.": "Abrir uma pasta fechará os editores abertos. Para mantê-los, adicione outra pasta.",
        Output: "Saída",
        "Debug Console": "Console de depuração",
        Terminal: "Terminal",
        Ports: "Portas",
        Problems: "Problemas",
        "Show All Commands": "Mostrar todos os comandos",
        "Go to File": "Ir para arquivo",
        "Find in Files": "Localizar nos arquivos",
        "Toggle Terminal": "Alternar terminal",
        Start: "Iniciar",
        Recent: "Recentes",
        Shortcuts: "Atalhos",
        "Open File...": "Abrir arquivo...",
        "Run File": "Executar arquivo",
        Settings: "Configurações",
        "Search settings": "Pesquisar configurações",
        User: "Usuário",
        Workspace: "Área de trabalho",
        "Reset All Settings": "Redefinir todas as configurações",
        "No Settings Found": "Nenhuma configuração encontrada",
        SettingCount: "configuração",
        SettingsCount: "configurações",
        Found: "encontradas",
        "No forwarded ports. Forward a port to access your running services locally.": "Nenhuma porta encaminhada. Encaminhe uma porta para acessar serviços em execução localmente."
    },
    "pt-PT": {
        Language: "Idioma",
        "Display Language": "Idioma da interface",
        "Choose the language used by the Codec interface.": "Escolha o idioma da interface do Codec.",
        Explorer: "Explorador",
        Search: "Pesquisar",
        Extensions: "Extensões",
        Manage: "Gerir",
        "NO FOLDER OPENED": "NENHUMA PASTA ABERTA",
        "You have not yet opened a folder.": "Ainda não abriu nenhuma pasta.",
        "Open Folder": "Abrir pasta",
        "New File...": "Novo ficheiro...",
        "New Folder...": "Nova pasta...",
        "Refresh Explorer": "Atualizar explorador",
        "Collapse Folders in Explorer": "Recolher pastas",
        "Opening a folder will close all currently open editors. To keep them open, add a folder instead.": "Abrir uma pasta fechará os editores abertos. Para os manter, adicione outra pasta.",
        Output: "Saída",
        "Debug Console": "Consola de depuração",
        Terminal: "Terminal",
        Ports: "Portas",
        Problems: "Problemas",
        "Show All Commands": "Mostrar todos os comandos",
        "Go to File": "Ir para ficheiro",
        "Find in Files": "Procurar nos ficheiros",
        "Toggle Terminal": "Alternar terminal",
        Start: "Início",
        Recent: "Recentes",
        Shortcuts: "Atalhos",
        "Open File...": "Abrir ficheiro...",
        "Run File": "Executar ficheiro",
        Settings: "Definições",
        "Search settings": "Pesquisar definições",
        User: "Utilizador",
        Workspace: "Área de trabalho",
        "Reset All Settings": "Repor todas as definições",
        "No Settings Found": "Nenhuma definição encontrada",
        SettingCount: "definição",
        SettingsCount: "definições",
        Found: "encontradas",
        "No forwarded ports. Forward a port to access your running services locally.": "Nenhuma porta encaminhada. Encaminhe uma porta para aceder localmente aos serviços em execução."
    },
    "zh-CN": {
        Language: "语言",
        "Display Language": "界面语言",
        "Choose the language used by the Codec interface.": "选择 Codec 界面使用的语言。",
        Explorer: "资源管理器",
        Search: "搜索",
        Extensions: "扩展",
        Manage: "管理",
        "NO FOLDER OPENED": "未打开文件夹",
        "You have not yet opened a folder.": "你尚未打开文件夹。",
        "Open Folder": "打开文件夹",
        "New File...": "新建文件...",
        "New Folder...": "新建文件夹...",
        "Refresh Explorer": "刷新资源管理器",
        "Collapse Folders in Explorer": "折叠文件夹",
        Output: "输出",
        "Debug Console": "调试控制台",
        Terminal: "终端",
        Ports: "端口",
        Problems: "问题",
        "Show All Commands": "显示所有命令",
        "Go to File": "转到文件",
        "Find in Files": "在文件中查找",
        "Toggle Terminal": "切换终端",
        Start: "开始",
        Recent: "最近",
        Shortcuts: "快捷键",
        "Open File...": "打开文件...",
        "Run File": "运行文件",
        Settings: "设置",
        "Search settings": "搜索设置",
        User: "用户",
        Workspace: "工作区",
        "Reset All Settings": "重置所有设置",
        "No Settings Found": "未找到设置",
        SettingCount: "项",
        SettingsCount: "项",
        Found: "已找到",
        "No forwarded ports. Forward a port to access your running services locally.": "没有转发的端口。转发端口以在本地访问正在运行的服务。"
    },
    "zh-TW": {
        Language: "語言",
        "Display Language": "介面語言",
        "Choose the language used by the Codec interface.": "選擇 Codec 介面使用的語言。",
        Explorer: "檔案總管",
        Search: "搜尋",
        Extensions: "擴充功能",
        Manage: "管理",
        "NO FOLDER OPENED": "尚未開啟資料夾",
        "You have not yet opened a folder.": "您尚未開啟資料夾。",
        "Open Folder": "開啟資料夾",
        "New File...": "新增檔案...",
        "New Folder...": "新增資料夾...",
        "Refresh Explorer": "重新整理檔案總管",
        "Collapse Folders in Explorer": "摺疊資料夾",
        Output: "輸出",
        "Debug Console": "偵錯主控台",
        Terminal: "終端機",
        Ports: "連接埠",
        Problems: "問題",
        "Show All Commands": "顯示所有命令",
        "Go to File": "前往檔案",
        "Find in Files": "在檔案中尋找",
        "Toggle Terminal": "切換終端機",
        Start: "開始",
        Recent: "最近",
        Shortcuts: "快速鍵",
        "Open File...": "開啟檔案...",
        "Run File": "執行檔案",
        Settings: "設定",
        "Search settings": "搜尋設定",
        User: "使用者",
        Workspace: "工作區",
        "Reset All Settings": "重設所有設定",
        "No Settings Found": "找不到設定",
        SettingCount: "項",
        SettingsCount: "項",
        Found: "已找到",
        "No forwarded ports. Forward a port to access your running services locally.": "沒有轉送的連接埠。轉送連接埠以在本機存取執行中的服務。"
    },
    ru: {
        Language: "Язык",
        "Display Language": "Язык интерфейса",
        "Choose the language used by the Codec interface.": "Выберите язык интерфейса Codec.",
        Explorer: "Проводник",
        Search: "Поиск",
        Extensions: "Расширения",
        Manage: "Управление",
        "NO FOLDER OPENED": "ПАПКА НЕ ОТКРЫТА",
        "You have not yet opened a folder.": "Вы ещё не открыли папку.",
        "Open Folder": "Открыть папку",
        "New File...": "Создать файл...",
        "New Folder...": "Создать папку...",
        "Refresh Explorer": "Обновить проводник",
        "Collapse Folders in Explorer": "Свернуть папки",
        Output: "Вывод",
        "Debug Console": "Консоль отладки",
        Terminal: "Терминал",
        Ports: "Порты",
        Problems: "Проблемы",
        "Show All Commands": "Показать все команды",
        "Go to File": "Перейти к файлу",
        "Find in Files": "Найти в файлах",
        "Toggle Terminal": "Переключить терминал",
        Start: "Начало",
        Recent: "Недавние",
        Shortcuts: "Сочетания клавиш",
        "Open File...": "Открыть файл...",
        "Run File": "Запустить файл",
        Settings: "Параметры",
        "Search settings": "Поиск параметров",
        User: "Пользователь",
        Workspace: "Рабочая область",
        "Reset All Settings": "Сбросить все параметры",
        "No Settings Found": "Параметры не найдены",
        SettingCount: "параметр",
        SettingsCount: "параметров",
        Found: "найдено",
        "No forwarded ports. Forward a port to access your running services locally.": "Нет перенаправленных портов. Перенаправьте порт, чтобы получить локальный доступ к работающим службам."
    },
    es: {
        Language: "Idioma",
        "Display Language": "Idioma de la interfaz",
        "Choose the language used by the Codec interface.": "Elige el idioma de la interfaz de Codec.",
        Explorer: "Explorador",
        Search: "Buscar",
        Extensions: "Extensiones",
        Manage: "Administrar",
        "NO FOLDER OPENED": "NINGUNA CARPETA ABIERTA",
        "You have not yet opened a folder.": "Todavía no has abierto una carpeta.",
        "Open Folder": "Abrir carpeta",
        "New File...": "Nuevo archivo...",
        "New Folder...": "Nueva carpeta...",
        "Refresh Explorer": "Actualizar explorador",
        "Collapse Folders in Explorer": "Contraer carpetas",
        Output: "Salida",
        "Debug Console": "Consola de depuración",
        Terminal: "Terminal",
        Ports: "Puertos",
        Problems: "Problemas",
        "Show All Commands": "Mostrar todos los comandos",
        "Go to File": "Ir al archivo",
        "Find in Files": "Buscar en archivos",
        "Toggle Terminal": "Alternar terminal",
        Start: "Inicio",
        Recent: "Recientes",
        Shortcuts: "Atajos",
        "Open File...": "Abrir archivo...",
        "Run File": "Ejecutar archivo",
        Settings: "Configuración",
        "Search settings": "Buscar configuración",
        User: "Usuario",
        Workspace: "Espacio de trabajo",
        "Reset All Settings": "Restablecer configuración",
        "No Settings Found": "No se encontraron ajustes",
        SettingCount: "ajuste",
        SettingsCount: "ajustes",
        Found: "encontrados",
        "No forwarded ports. Forward a port to access your running services locally.": "No hay puertos reenviados. Reenvía un puerto para acceder localmente a los servicios en ejecución."
    },
    fr: {
        Language: "Langue",
        "Display Language": "Langue de l’interface",
        "Choose the language used by the Codec interface.": "Choisissez la langue de l’interface Codec.",
        Explorer: "Explorateur",
        Search: "Rechercher",
        Extensions: "Extensions",
        Manage: "Gérer",
        "NO FOLDER OPENED": "AUCUN DOSSIER OUVERT",
        "You have not yet opened a folder.": "Vous n’avez pas encore ouvert de dossier.",
        "Open Folder": "Ouvrir le dossier",
        "New File...": "Nouveau fichier...",
        "New Folder...": "Nouveau dossier...",
        "Refresh Explorer": "Actualiser l’explorateur",
        "Collapse Folders in Explorer": "Réduire les dossiers",
        Output: "Sortie",
        "Debug Console": "Console de débogage",
        Terminal: "Terminal",
        Ports: "Ports",
        Problems: "Problèmes",
        "Show All Commands": "Afficher toutes les commandes",
        "Go to File": "Accéder au fichier",
        "Find in Files": "Rechercher dans les fichiers",
        "Toggle Terminal": "Afficher/masquer le terminal",
        Start: "Démarrer",
        Recent: "Récents",
        Shortcuts: "Raccourcis",
        "Open File...": "Ouvrir le fichier...",
        "Run File": "Exécuter le fichier",
        Settings: "Paramètres",
        "Search settings": "Rechercher des paramètres",
        User: "Utilisateur",
        Workspace: "Espace de travail",
        "Reset All Settings": "Réinitialiser tous les paramètres",
        "No Settings Found": "Aucun paramètre trouvé",
        SettingCount: "paramètre",
        SettingsCount: "paramètres",
        Found: "trouvés",
        "No forwarded ports. Forward a port to access your running services locally.": "Aucun port transféré. Transférez un port pour accéder localement aux services en cours d’exécution."
    },
    de: {
        Language: "Sprache",
        "Display Language": "Anzeigesprache",
        "Choose the language used by the Codec interface.": "Wählen Sie die Sprache der Codec-Oberfläche.",
        Explorer: "Explorer",
        Search: "Suchen",
        Extensions: "Erweiterungen",
        Manage: "Verwalten",
        "NO FOLDER OPENED": "KEIN ORDNER GEÖFFNET",
        "You have not yet opened a folder.": "Sie haben noch keinen Ordner geöffnet.",
        "Open Folder": "Ordner öffnen",
        "New File...": "Neue Datei...",
        "New Folder...": "Neuer Ordner...",
        "Refresh Explorer": "Explorer aktualisieren",
        "Collapse Folders in Explorer": "Ordner einklappen",
        Output: "Ausgabe",
        "Debug Console": "Debugkonsole",
        Terminal: "Terminal",
        Ports: "Ports",
        Problems: "Probleme",
        "Show All Commands": "Alle Befehle anzeigen",
        "Go to File": "Zu Datei wechseln",
        "Find in Files": "In Dateien suchen",
        "Toggle Terminal": "Terminal umschalten",
        Start: "Start",
        Recent: "Zuletzt verwendet",
        Shortcuts: "Tastenkombinationen",
        "Open File...": "Datei öffnen...",
        "Run File": "Datei ausführen",
        Settings: "Einstellungen",
        "Search settings": "Einstellungen durchsuchen",
        User: "Benutzer",
        Workspace: "Arbeitsbereich",
        "Reset All Settings": "Alle Einstellungen zurücksetzen",
        "No Settings Found": "Keine Einstellungen gefunden",
        SettingCount: "Einstellung",
        SettingsCount: "Einstellungen",
        Found: "gefunden",
        "No forwarded ports. Forward a port to access your running services locally.": "Keine weitergeleiteten Ports. Leiten Sie einen Port weiter, um lokal auf laufende Dienste zuzugreifen."
    },
    ja: {
        Language: "言語",
        "Display Language": "表示言語",
        "Choose the language used by the Codec interface.": "Codec の表示言語を選択します。",
        Explorer: "エクスプローラー",
        Search: "検索",
        Extensions: "拡張機能",
        Manage: "管理",
        "NO FOLDER OPENED": "フォルダーが開かれていません",
        "You have not yet opened a folder.": "フォルダーはまだ開かれていません。",
        "Open Folder": "フォルダーを開く",
        "New File...": "新しいファイル...",
        "New Folder...": "新しいフォルダー...",
        "Refresh Explorer": "エクスプローラーを更新",
        "Collapse Folders in Explorer": "フォルダーを折りたたむ",
        Output: "出力",
        "Debug Console": "デバッグ コンソール",
        Terminal: "ターミナル",
        Ports: "ポート",
        Problems: "問題",
        "Show All Commands": "すべてのコマンドを表示",
        "Go to File": "ファイルに移動",
        "Find in Files": "ファイル内を検索",
        "Toggle Terminal": "ターミナルの切り替え",
        Start: "開始",
        Recent: "最近使用した項目",
        Shortcuts: "ショートカット",
        "Open File...": "ファイルを開く...",
        "Run File": "ファイルを実行",
        Settings: "設定",
        "Search settings": "設定を検索",
        User: "ユーザー",
        Workspace: "ワークスペース",
        "Reset All Settings": "すべての設定をリセット",
        "No Settings Found": "設定が見つかりません",
        SettingCount: "設定",
        SettingsCount: "設定",
        Found: "件",
        "No forwarded ports. Forward a port to access your running services locally.": "転送されたポートはありません。ポートを転送して実行中のサービスにローカルでアクセスします。"
    },
    ko: {
        Language: "언어",
        "Display Language": "표시 언어",
        "Choose the language used by the Codec interface.": "Codec 인터페이스에 사용할 언어를 선택하세요.",
        Explorer: "탐색기",
        Search: "검색",
        Extensions: "확장",
        Manage: "관리",
        "NO FOLDER OPENED": "열린 폴더 없음",
        "You have not yet opened a folder.": "아직 폴더를 열지 않았습니다.",
        "Open Folder": "폴더 열기",
        "New File...": "새 파일...",
        "New Folder...": "새 폴더...",
        "Refresh Explorer": "탐색기 새로 고침",
        "Collapse Folders in Explorer": "폴더 접기",
        Output: "출력",
        "Debug Console": "디버그 콘솔",
        Terminal: "터미널",
        Ports: "포트",
        Problems: "문제",
        "Show All Commands": "모든 명령 표시",
        "Go to File": "파일로 이동",
        "Find in Files": "파일에서 찾기",
        "Toggle Terminal": "터미널 전환",
        Start: "시작",
        Recent: "최근 항목",
        Shortcuts: "바로 가기",
        "Open File...": "파일 열기...",
        "Run File": "파일 실행",
        Settings: "설정",
        "Search settings": "설정 검색",
        User: "사용자",
        Workspace: "작업 영역",
        "Reset All Settings": "모든 설정 초기화",
        "No Settings Found": "설정을 찾을 수 없음",
        SettingCount: "설정",
        SettingsCount: "설정",
        Found: "개 찾음",
        "No forwarded ports. Forward a port to access your running services locally.": "전달된 포트가 없습니다. 포트를 전달하여 실행 중인 서비스에 로컬로 액세스하세요."
    },
    it: {
        Language: "Lingua",
        "Display Language": "Lingua dell’interfaccia",
        "Choose the language used by the Codec interface.": "Scegli la lingua dell’interfaccia di Codec.",
        Explorer: "Esplora risorse",
        Search: "Cerca",
        Extensions: "Estensioni",
        Manage: "Gestisci",
        "NO FOLDER OPENED": "NESSUNA CARTELLA APERTA",
        "You have not yet opened a folder.": "Non hai ancora aperto una cartella.",
        "Open Folder": "Apri cartella",
        "New File...": "Nuovo file...",
        "New Folder...": "Nuova cartella...",
        "Refresh Explorer": "Aggiorna Esplora risorse",
        "Collapse Folders in Explorer": "Comprimi cartelle",
        Output: "Output",
        "Debug Console": "Console di debug",
        Terminal: "Terminale",
        Ports: "Porte",
        Problems: "Problemi",
        "Show All Commands": "Mostra tutti i comandi",
        "Go to File": "Vai al file",
        "Find in Files": "Trova nei file",
        "Toggle Terminal": "Attiva/disattiva terminale",
        Start: "Inizia",
        Recent: "Recenti",
        Shortcuts: "Scelte rapide",
        "Open File...": "Apri file...",
        "Run File": "Esegui file",
        Settings: "Impostazioni",
        "Search settings": "Cerca impostazioni",
        User: "Utente",
        Workspace: "Area di lavoro",
        "Reset All Settings": "Reimposta tutte le impostazioni",
        "No Settings Found": "Nessuna impostazione trovata",
        SettingCount: "impostazione",
        SettingsCount: "impostazioni",
        Found: "trovate",
        "No forwarded ports. Forward a port to access your running services locally.": "Nessuna porta inoltrata. Inoltra una porta per accedere localmente ai servizi in esecuzione."
    }
};

function tr(text) {
    return UI_TRANSLATIONS[settings.language]?.[text] || text;
}

function applyLocalization() {
    document.querySelectorAll("[data-i18n]").forEach(node => node.textContent = tr(node.dataset.i18n));
    for (const attr of [ "title", "placeholder" ]) {
        document.querySelectorAll(`[${attr}]`).forEach(node => {
            const key = node.dataset[`i18n${attr[0].toUpperCase()}${attr.slice(1)}`] ||= node.getAttribute(attr);
            const translated = tr(key);
            if (translated !== key) node.setAttribute(attr, translated); else if (node.dataset[`i18n${attr[0].toUpperCase()}${attr.slice(1)}`]) node.setAttribute(attr, key);
        });
    }
}

const S = {
    root: null,
    tabs: [],
    active: null,
    expanded: new Set,
    dirCache: new Map,
    selected: null,
    untitledCount: 0,
    terms: [],
    activeTerm: null,
    fileList: null
};

let nextId = 1;

S.recentFiles = [];

let recentSaveTimer = null;

function rememberFile(p) {
    S.recentFiles = [ p, ...S.recentFiles.filter(f => f !== p) ].slice(0, 30);
    clearTimeout(recentSaveTimer);
    recentSaveTimer = setTimeout(() => api.state.set({
        recentFiles: S.recentFiles
    }), 1e3);
}

let toastTimer;

function toast(msg, error = false) {
    const t = $("#toast");
    t.innerHTML = `<i class="codicon codicon-${error ? "error" : "info"}"></i><span>${esc(msg)}</span>`;
    t.className = error ? "error" : "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), error ? 6e3 : 3e3);
}

async function guard(fn) {
    try {
        return await fn();
    } catch (e) {
        toast(String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ""), true);
    }
}

const rel = p => S.root && p ? P.relative(S.root, p) : p;

const MEDIA = {
    image: [ "png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "avif", "jfif" ],
    video: [ "mp4", "webm", "ogv", "mov", "m4v", "mkv" ],
    audio: [ "mp3", "wav", "ogg", "oga", "flac", "m4a", "aac", "opus" ]
};

const mediaKind = p => Object.keys(MEDIA).find(k => MEDIA[k].includes(FileIcons.extOf(P.basename(p)))) || null;

const fileUrl = p => "file:///" + encodeURI(p.replace(/\\/g, "/")).replace(/#/g, "%23").replace(/\?/g, "%3F");

const DISCORD_CLIENT_ID = "1575226815327244449";

function editorOptions() {
    return {
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        fontLigatures: !!settings.fontLigatures,
        wordWrap: settings.wordWrap,
        lineNumbers: settings.lineNumbers,
        renderWhitespace: settings.renderWhitespace,
        renderLineHighlight: settings.renderLineHighlight,
        minimap: {
            enabled: !!settings.minimap
        },
        cursorStyle: settings.cursorStyle,
        cursorBlinking: settings.cursorBlinking,
        smoothScrolling: !!settings.smoothScrolling,
        cursorSmoothCaretAnimation: settings.smoothScrolling ? "on" : "off",
        bracketPairColorization: {
            enabled: !!settings.bracketPairs
        },
        guides: {
            bracketPairs: !!settings.bracketPairs,
            indentation: true
        },
        quickSuggestions: {
            other: true,
            comments: false,
            strings: true
        },
        suggestOnTriggerCharacters: true,
        wordBasedSuggestions: "currentDocument",
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        autoClosingComments: "always",
        stickyScroll: {
            enabled: !!settings.stickyScroll
        },
        mouseWheelZoom: !!settings.mouseWheelZoom,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 10
        },
        padding: {
            top: 4
        }
    };
}

function applySettings() {
    applyLocalization();
    const light = settings.theme === "light";
    const themeChanged = document.body.classList.contains("theme-light") !== light;
    document.body.className = light ? "theme-light" : "theme-dark";
    if (monaco) monaco.editor.setTheme(light ? "ks-light" : "ks-dark");
    FileIcons.setLight(light);
    api.window.setOverlay(settings.theme);
    if (monaco && typeof ExtUI !== "undefined") ExtUI.applyTheme(settings.theme);
    $("#statusbar").classList.toggle("hidden", !settings.statusBar);
    $("#breadcrumbs").classList.toggle("hidden", settings.breadcrumbs === false);
    $("#command-center").classList.toggle("hidden", settings.commandCenter === false);
    if (themeChanged) {
        renderTree();
        renderTabs();
    }
    editor?.updateOptions(editorOptions());
    for (const t of S.tabs) t.model?.updateOptions({
        tabSize: settings.tabSize,
        insertSpaces: settings.insertSpaces !== false
    });
    for (const t of S.terms) {
        Object.assign(t.xterm.options, termOptions());
        t.fit.fit();
    }
    updateStatus();
    layout();
}

async function setSetting(key, value) {
    settings[key] = value;
    applySettings();
    if (key.startsWith("discord")) updatePresence();
    await api.settings.set(settings);
    if (!$("#settings-modal").classList.contains("hidden")) renderSettings();
}

async function readDir(dir, force = false) {
    if (!force && S.dirCache.has(dir)) return S.dirCache.get(dir);
    const items = await api.fs.readDir(dir).catch(() => []);
    S.dirCache.set(dir, items);
    return items;
}

async function openFolder(folder) {
    if (!folder) return;
    folder = P.resolve(folder);
    if (!await api.fs.exists(folder)) return toast(`Folder not found: ${folder}`, true);
    if (S.root && !await closeAllTabs()) return;
    S.root = folder;
    S.selected = null;
    presence.start = Date.now();
    S.expanded = new Set([ folder ]);
    S.dirCache.clear();
    S.fileList = null;
    fileOps.length = 0;
    await api.state.addRecent(folder);
    api.window.setFolder(folder);
    logOutput(`Opened folder: ${folder}`);
    renderWelcome();
    api.fs.watch(folder);
    $("#folder-name").textContent = P.basename(folder).toUpperCase();
    $("#sb-folder").textContent = P.basename(folder);
    await renderTree();
    updateTitle();
    const st = await api.state.get();
    const sess = st.sessions?.[folder];
    if (sess) {
        for (const p of sess.tabs || []) if (await api.fs.exists(p)) await openFile(p, {
            activate: false
        });
        const act = S.tabs.find(t => t.path === sess.active);
        if (act) activateTab(act.id); else if (S.tabs.length) activateTab(S.tabs[0].id);
    }
}

async function closeFolder() {
    if (!await closeAllTabs()) return;
    S.root = null;
    S.selected = null;
    api.fs.watch(null);
    api.window.setFolder(null);
    $("#folder-name").textContent = "NO FOLDER OPENED";
    $("#sb-folder").textContent = "";
    await renderTree();
    updateTitle();
}

function indentEl(depth) {
    const box = el("span", "indent");
    for (let i = 0; i < depth; i++) box.append(el("span", "guide"));
    return box;
}

async function renderTree() {
    const tree = $("#tree");
    $("#no-folder").classList.toggle("hidden", !!S.root);
    tree.classList.toggle("hidden", !S.root);
    if (!S.root) return tree.innerHTML = "";
    const frag = document.createDocumentFragment();
    const activePath = currentTab()?.path;
    async function walk(dir, depth) {
        for (const item of await readDir(dir)) {
            let target = item;
            const names = [ item.name ];
            const folderPaths = [ item.path ];
            if (item.isDir && settings.compactFolders !== false) {
                while (true) {
                    if (target.path === S.selected) break;
                    const kids = await readDir(target.path);
                    if (kids.length !== 1 || !kids[0].isDir) break;
                    target = kids[0];
                    names.push(target.name);
                    folderPaths.push(target.path);
                }
            }
            const row = el("div", "node");
            row.dataset.path = target.path;
            row.dataset.dir = item.isDir ? "1" : "";
            row.dataset.depth = depth;
            const open = item.isDir && S.expanded.has(target.path);
            const twisty = el("span", "twisty");
            if (item.isDir) twisty.append(el("i", `codicon codicon-chevron-${open ? "down" : "right"}`));
            const name = el("span", "name");
            names.forEach((n, i) => {
                if (i) name.append(el("span", "compact-sep", P.sep === "\\" ? "\\" : "/"));
                if (item.isDir) {
                    const part = el("span", "compact-folder-part", n);
                    part.dataset.path = folderPaths[i];
                    part.title = folderPaths[i];
                    if (folderPaths[i] === S.selected) part.classList.add("selected");
                    name.append(part);
                } else name.append(document.createTextNode(n));
            });
            row.append(indentEl(depth), twisty, FileIcons.icon(target.name, item.isDir, open), name);
            row.title = target.path;
            if (folderPaths.includes(S.selected)) row.classList.add("selected");
            if (target.path === activePath) row.classList.add("active-file");
            row.draggable = true;
            frag.append(row);
            if (open) await walk(target.path, depth + 1);
        }
    }
    await walk(S.root, 0);
    tree.replaceChildren(frag);
}

function selectNode(p) {
    S.selected = p;
    for (const n of document.querySelectorAll("#tree .node")) {
        const compactSelection = [ ...n.querySelectorAll(".compact-folder-part") ].some(part => part.dataset.path === p);
        n.classList.toggle("selected", n.dataset.path === p || compactSelection);
        n.querySelectorAll(".compact-folder-part").forEach(part => part.classList.toggle("selected", part.dataset.path === p));
    }
}

async function toggleDir(p) {
    if (S.expanded.has(p)) S.expanded.delete(p); else S.expanded.add(p);
    await renderTree();
}

function targetDir() {
    if (!S.root || !S.selected) return S.root;
    const relative = P.relative(S.root, S.selected);
    if (relative === ".." || relative.startsWith(`..${P.sep}`) || P.resolve(relative) === relative) return S.root;
    const node = document.querySelector(`#tree .node[data-path="${CSS.escape(S.selected)}"]`);
    let selectedIsDir = !!node?.dataset.dir;
    if (!node) {
        for (const items of S.dirCache.values()) {
            const item = items.find(entry => entry.path === S.selected);
            if (item) {
                selectedIsDir = item.isDir;
                break;
            }
        }
    }
    return selectedIsDir ? S.selected : P.dirname(S.selected);
}

function inlineInput({dir: dir, initial: initial = "", isDir: isDir = false, replaceNode: replaceNode = null}) {
    return new Promise(resolve => {
        const input = el("input");
        input.value = initial;
        let row;
        let icon;
        if (replaceNode) {
            row = replaceNode;
            icon = row.querySelector(".file-icon");
            row.querySelector(".name").replaceWith(input);
        } else {
            row = el("div", "node");
            const parentNode = document.querySelector(`#tree .node[data-path="${CSS.escape(dir)}"]`);
            const depth = parentNode ? Number(parentNode.dataset.depth) + 1 : 0;
            const tw = el("span", "twisty");
            if (isDir) tw.append(el("i", "codicon codicon-chevron-right"));
            icon = FileIcons.icon(isDir ? "folder" : "file", isDir, false);
            row.append(indentEl(depth), tw, icon, input);
            if (parentNode) parentNode.after(row); else $("#tree").prepend(row);
        }
        const updateIconPreview = () => {
            if (!icon) return;
            icon.src = FileIcons.icon(input.value.trim() || (isDir ? "folder" : "file"), isDir, false).src;
        };
        input.addEventListener("input", updateIconPreview);
        updateIconPreview();
        input.focus();
        const dot = initial.lastIndexOf(".");
        input.setSelectionRange(0, dot > 0 && !isDir ? dot : initial.length);
        let done = false;
        const finish = val => {
            if (done) return;
            done = true;
            resolve(val && val.trim() ? val.trim() : null);
        };
        input.addEventListener("keydown", e => {
            e.stopPropagation();
            if (e.key === "Enter") finish(input.value);
            if (e.key === "Escape") finish(null);
        });
        input.addEventListener("blur", () => finish(input.value));
    });
}

const fileOps = [];

function invalidate(p) {
    S.dirCache.delete(P.dirname(p));
    S.dirCache.delete(p);
    S.fileList = null;
}

async function newItem(isDir, preferredDir = null) {
    if (!S.root) {
        if (!isDir) return newUntitled();
        const folder = await api.dialog.openFolder();
        if (!folder) return;
        await openFolder(folder);
        return newItem(true);
    }
    $("#explorer-body").classList.remove("hidden");
    $("#explorer-header .twist").className = "codicon twist codicon-chevron-down";
    const dir = preferredDir || targetDir();
    S.expanded.add(S.root);
    let ancestor = dir;
    while (ancestor && ancestor !== P.dirname(ancestor)) {
        S.expanded.add(ancestor);
        if (ancestor === S.root) break;
        ancestor = P.dirname(ancestor);
    }
    await renderTree();
    const name = await inlineInput({
        dir: dir,
        isDir: isDir
    });
    if (!name) return renderTree();
    const full = P.join(dir, name);
    await guard(async () => {
        if (isDir) await api.fs.createDir(full); else await api.fs.createFile(full);
        fileOps.push({
            type: "create",
            path: full
        });
        invalidate(full);
        S.selected = full;
        if (isDir) S.expanded.add(full);
        await renderTree();
        if (!isDir) await openFile(full);
    });
    await renderTree();
}

function moveTabs(from, to) {
    for (const t of S.tabs) {
        if (t.path === from || t.path?.startsWith(from + P.sep)) {
            t.path = to + t.path.slice(from.length);
            t.title = P.basename(t.path);
            if (t.model) monaco.editor.setModelLanguage(t.model, FileIcons.language(t.title));
        }
    }
    if (S.expanded.has(from)) {
        S.expanded.delete(from);
        S.expanded.add(to);
    }
    renderTabs();
}

async function renameItem(p) {
    const node = document.querySelector(`#tree .node[data-path="${CSS.escape(p)}"]`);
    if (!node) return;
    const name = await inlineInput({
        initial: P.basename(p),
        isDir: !!node.dataset.dir,
        replaceNode: node
    });
    if (name && name !== P.basename(p)) {
        const to = P.join(P.dirname(p), name);
        await guard(async () => {
            await api.fs.rename(p, to);
            fileOps.push({
                type: "rename",
                from: p,
                to: to
            });
            moveTabs(p, to);
            S.selected = to;
            invalidate(p);
        });
    }
    await renderTree();
}

async function deleteItem(p) {
    await guard(async () => {
        let closed = false;
        for (const t of [ ...S.tabs ]) if (t.path === p || t.path?.startsWith(p + P.sep)) closed = await closeTab(t.id, true) || closed;
        if (closed) await new Promise(r => setTimeout(r, 120));
        const id = await api.fs.deleteUndoable(p);
        S.recentFiles = S.recentFiles.filter(f => f !== p && !f.startsWith(p + P.sep));
        fileOps.push({
            type: "delete",
            path: p,
            id: id
        });
        invalidate(p);
        if (S.selected === p) S.selected = null;
        await renderTree();
        $("#tree").focus();
    });
}

async function undoFileOp() {
    const op = fileOps.pop();
    if (!op) return;
    await guard(async () => {
        if (op.type === "delete") {
            await api.fs.restoreDeleted(op.id, op.path);
            invalidate(op.path);
            S.selected = op.path;
        } else if (op.type === "rename") {
            await api.fs.rename(op.to, op.from);
            moveTabs(op.to, op.from);
            invalidate(op.to);
            invalidate(op.from);
            S.selected = op.from;
        } else if (op.type === "create") {
            for (const t of [ ...S.tabs ]) if (t.path === op.path) await closeTab(t.id, true);
            await api.fs.deleteUndoable(op.path);
            invalidate(op.path);
        }
        await renderTree();
        $("#tree").focus();
    });
}

function explorerContextMenu(e, p, isDir) {
    const dir = p ? isDir ? p : P.dirname(p) : S.root;
    const items = [ {
        label: "New File...",
        run: () => newItem(false, dir)
    }, {
        label: "New Folder...",
        run: () => newItem(true, dir)
    }, {
        label: "Reveal in File Explorer",
        kb: "Shift+Alt+R",
        run: () => api.reveal(p || S.root)
    }, {
        label: "Open in Integrated Terminal",
        run: () => newTerminal(dir)
    }, "-", {
        label: "Find in Folder...",
        kb: "Shift+Alt+F",
        run: () => findInFolder(dir)
    } ];
    if (p) {
        items.push("-", {
            label: "Copy Path",
            kb: "Shift+Alt+C",
            run: () => navigator.clipboard.writeText(p)
        }, {
            label: "Copy Relative Path",
            kb: "Ctrl+K Ctrl+Shift+C",
            run: () => navigator.clipboard.writeText(rel(p))
        }, "-", {
            label: "Rename...",
            kb: "F2",
            run: () => renameItem(p)
        }, {
            label: "Delete",
            kb: "Delete",
            run: () => deleteItem(p)
        });
    }
    openMenu(items, e.clientX, e.clientY);
}

function findInFolder(dir) {
    showView("search", true);
    $("#search-details").classList.remove("hidden");
    $("#search-include").value = (rel(dir) || ".") + "/**";
}

function setupExplorer() {
    const tree = $("#tree");
    tree.addEventListener("click", async e => {
        const node = e.target.closest(".node");
        if (!node || node.querySelector("input")) return;
        const compactPart = e.target.closest(".compact-folder-part");
        if (compactPart) {
            e.stopPropagation();
            const folder = compactPart.dataset.path;
            selectNode(folder);
            S.expanded.add(folder);
            await renderTree();
            return;
        }
        selectNode(node.dataset.path);
        if (node.dataset.dir) await toggleDir(node.dataset.path); else {
            await openFile(node.dataset.path, {
                focus: false
            });
            tree.focus();
        }
    });
    tree.addEventListener("contextmenu", e => {
        e.preventDefault();
        const node = e.target.closest(".node");
        const compactPart = e.target.closest(".compact-folder-part");
        const targetPath = compactPart?.dataset.path || node?.dataset.path;
        if (compactPart) {
            selectNode(targetPath);
            S.expanded.add(targetPath);
            renderTree();
        } else if (node) selectNode(targetPath); else S.selected = null;
        explorerContextMenu(e, targetPath, compactPart ? true : !!node?.dataset.dir);
    });
    tree.addEventListener("keydown", e => {
        if (e.target.tagName === "INPUT") return;
        if (e.key === "F2" && S.selected) renameItem(S.selected); else if (e.key === "Delete" && S.selected) deleteItem(S.selected); else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "z") {
            e.stopPropagation();
            undoFileOp();
        } else return;
        e.preventDefault();
    });
    tree.addEventListener("dragstart", e => e.dataTransfer.setData("text/ks-path", e.target.closest(".node")?.dataset.path || ""));
    tree.addEventListener("dragover", e => e.preventDefault());
    tree.addEventListener("drop", async e => {
        e.preventDefault();
        const from = e.dataTransfer.getData("text/ks-path");
        const node = e.target.closest(".node");
        const destDir = node ? node.dataset.dir ? node.dataset.path : P.dirname(node.dataset.path) : S.root;
        if (!from || P.dirname(from) === destDir || destDir.startsWith(from)) return;
        const to = P.join(destDir, P.basename(from));
        await guard(async () => {
            await api.fs.rename(from, to);
            fileOps.push({
                type: "rename",
                from: from,
                to: to
            });
            moveTabs(from, to);
            S.dirCache.clear();
            S.fileList = null;
            await renderTree();
        });
    });
    $("#btn-new-file").onclick = () => newItem(false);
    $("#btn-new-folder").onclick = () => newItem(true);
    $("#btn-refresh").onclick = () => {
        S.dirCache.clear();
        S.fileList = null;
        renderTree();
    };
    $("#btn-collapse").onclick = () => {
        S.expanded = new Set([ S.root ]);
        renderTree();
    };
    $("#btn-open-folder").onclick = () => runCommand("folder.open");
    $("#btn-explorer-more").onclick = e => {
        const r = e.currentTarget.getBoundingClientRect();
        openMenu([ {
            label: "Open Folder...",
            kb: "Ctrl+K Ctrl+O",
            run: () => runCommand("folder.open")
        }, {
            label: "Refresh Explorer",
            run: () => $("#btn-refresh").click()
        }, {
            label: "Collapse Folders in Explorer",
            run: () => $("#btn-collapse").click()
        }, "-", {
            label: "Compact Folders",
            checked: settings.compactFolders !== false,
            run: () => setSetting("compactFolders", settings.compactFolders === false).then(renderTree)
        } ], r.left, r.bottom + 2);
    };
    $("#explorer-header").onclick = e => {
        if (e.target.closest(".pane-actions")) return;
        const body = $("#explorer-body");
        body.classList.toggle("hidden");
        $("#explorer-header .twist").className = "codicon twist codicon-chevron-" + (body.classList.contains("hidden") ? "right" : "down");
    };
}

const currentTab = () => S.tabs.find(t => t.id === S.active) || null;

const isDirty = t => !!t.model && t.model.getAlternativeVersionId() !== t.savedVersion;

function watchModel(tab) {
    tab.model.onDidChangeContent(() => {
        renderTabs();
        if (settings.autoSave === "afterDelay" && tab.path) scheduleAutoSave(tab);
    });
}

async function openFile(p, {activate: activate = true, line: line, col: col, len: len, focus: focus = true} = {}) {
    let tab = S.tabs.find(t => t.path === p);
    if (!tab && mediaKind(p)) {
        tab = {
            id: nextId++,
            path: p,
            title: P.basename(p),
            kind: mediaKind(p),
            model: null,
            savedVersion: 0,
            zoom: "fit"
        };
        S.tabs.push(tab);
    }
    if (!tab) {
        const data = await guard(() => api.fs.readFile(p));
        if (!data) return;
        if (data.binary) return toast(`The file '${P.basename(p)}' is not displayed in the text editor because it is either binary or uses an unsupported text encoding.`, true);
        const uri = monaco.Uri.file(p);
        const model = monaco.editor.getModel(uri) || monaco.editor.createModel(data.content, FileIcons.language(p), uri);
        model.updateOptions({
            tabSize: settings.tabSize,
            insertSpaces: settings.insertSpaces !== false
        });
        tab = {
            id: nextId++,
            path: p,
            title: P.basename(p),
            model: model,
            viewState: null,
            savedVersion: model.getAlternativeVersionId()
        };
        watchModel(tab);
        S.tabs.push(tab);
    }
    if (activate) activateTab(tab.id, {
        focus: focus
    }); else renderTabs();
    if (line) {
        editor.revealLineInCenter(line);
        editor.setSelection(new monaco.Range(line, col || 1, line, (col || 1) + (len || 0)));
        editor.focus();
    }
    return tab;
}

function newUntitled(content = "", language = "plaintext") {
    const model = monaco.editor.createModel(content, language);
    model.updateOptions({
        tabSize: settings.tabSize
    });
    const tab = {
        id: nextId++,
        path: null,
        title: `Untitled-${++S.untitledCount}`,
        model: model,
        viewState: null,
        savedVersion: model.getAlternativeVersionId()
    };
    model.onDidChangeContent(() => {
        renderTabs();
        if (model.getLanguageId() === "plaintext" && (/^\s*!\s*$/m.test(model.getValue()) || /<\/?[a-z][\w:-]*/i.test(model.getValue()) || /(?:^|\n)\s*h[1-6]\s*$/i.test(model.getValue()))) {
            monaco.editor.setModelLanguage(model, "html");
            if (editor?.getModel() === model) {
                editor.trigger("codec-language-detection", "editor.action.triggerSuggest", {});
                updateStatus();
            }
        }
    });
    S.tabs.push(tab);
    activateTab(tab.id);
    return tab;
}

function registerHTMLBoilerplateCompletion() {
    monaco.languages.registerCompletionItemProvider("html", {
        triggerCharacters: [ "!", "/", '"', "'", "=" ],
        async provideCompletionItems(model, position) {
            const line = model.getLineContent(position.lineNumber);
            const beforeCursor = line.slice(0, position.column - 1);
            const match = beforeCursor.match(/^(\s*)!$/);
            const suggestions = [];
            if (match) {
                const startColumn = match[1].length + 1;
                suggestions.push({
                    label: "!  HTML document",
                    detail: "Expand to a complete HTML page",
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [ "<!DOCTYPE html>", '<html lang="en">', "<head>", '    <meta charset="UTF-8">', '    <meta name="viewport" content="width=device-width, initial-scale=1.0">', "    <title>${1:Document}</title>", "</head>", "<body>", "    $0", "</body>", "</html>" ].join("\n"),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column),
                    sortText: "0000"
                });
            }
            const word = model.getWordUntilPosition(position);
            if (/^h(?:[1-6])?$/i.test(word.word)) {
                const lineBeforeTag = line.slice(0, word.startColumn - 1);
                const startColumn = lineBeforeTag.endsWith("<") ? word.startColumn - 1 : word.startColumn;
                for (let level = 1; level <= 6; level++) {
                    const tag = `h${level}`;
                    suggestions.push({
                        label: tag,
                        detail: `HTML heading <${tag}>`,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: `<${tag}>$0</${tag}>`,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column),
                        sortText: `000${level}`
                    });
                }
            }
            const tagSnippets = {
                a: '<a href="$1">$0</a>',
                article: "<article>$0</article>",
                aside: "<aside>$0</aside>",
                button: '<button type="button">$0</button>',
                div: '<div class="$1">$0</div>',
                footer: "<footer>$0</footer>",
                form: '<form action="$1" method="post">$0</form>',
                header: "<header>$0</header>",
                img: '<img src="$1" alt="$2">',
                input: '<input type="$1" name="$2">',
                label: '<label for="$1">$0</label>',
                link: '<link rel="$1" href="$2">',
                li: "<li>$0</li>",
                main: "<main>$0</main>",
                nav: "<nav>$0</nav>",
                p: "<p>$0</p>",
                script: '<script src="$1"><\/script>',
                section: "<section>$0</section>",
                span: '<span class="$1">$0</span>',
                style: "<style>\n  $0\n</style>",
                ul: "<ul>\n  <li>$0</li>\n</ul>"
            };
            const voidTags = new Set([ "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr" ]);
            const htmlTags = `a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr`.split(" ");
            for (const tag of htmlTags) {
                if (!Object.hasOwn(tagSnippets, tag)) tagSnippets[tag] = voidTags.has(tag) ? `<${tag}>` : `<${tag}>$0</${tag}>`;
            }
            const tagWord = word.word.toLowerCase();
            if (tagWord) {
                const lineBeforeTag = line.slice(0, word.startColumn - 1);
                const startColumn = lineBeforeTag.endsWith("<") ? word.startColumn - 1 : word.startColumn;
                for (const tag of Object.keys(tagSnippets).filter(name => name.startsWith(tagWord))) {
                    suggestions.push({
                        label: tag,
                        detail: `Insert an HTML <${tag}> element`,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: tagSnippets[tag],
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column),
                        sortText: `0000${tag}`
                    });
                }
            }
            const attribute = beforeCursor.match(/\b(?:href|src)\s*=\s*(["'])([^"']*)$/i);
            if (attribute && S.root) {
                const typedPath = attribute[2];
                const activePath = currentTab()?.path;
                const baseDir = activePath ? P.dirname(activePath) : S.root;
                const rootFiles = S.fileList || (S.fileList = await api.fs.listFiles(S.root).catch(() => []));
                const candidates = new Map;
                for (const file of rootFiles) {
                    const rootRelative = P.relative(S.root, file).replace(/\\/g, "/");
                    const relative = P.relative(baseDir, file).replace(/\\/g, "/");
                    if (!typedPath.startsWith("/") && relative && (!typedPath || relative.startsWith(typedPath))) {
                        candidates.set(relative, {
                            value: relative,
                            folder: false
                        });
                    }
                    if (typedPath.startsWith("/")) {
                        const value = `/${rootRelative}`;
                        if (value.startsWith(typedPath)) candidates.set(value, {
                            value: value,
                            folder: false
                        });
                    }
                    const parts = rootRelative.split("/");
                    for (let i = 1; i < parts.length; i++) {
                        const folderRootRelative = `${parts.slice(0, i).join("/")}/`;
                        const folderRelative = P.relative(baseDir, P.join(S.root, ...parts.slice(0, i))).replace(/\\/g, "/") + "/";
                        const folderValue = typedPath.startsWith("/") ? `/${folderRootRelative}` : folderRelative;
                        if (folderValue.startsWith(typedPath)) candidates.set(folderValue, {
                            value: folderValue,
                            folder: true
                        });
                    }
                }
                const attrStart = beforeCursor.length - typedPath.length;
                for (const item of [ ...candidates.values() ].slice(0, 200)) {
                    suggestions.push({
                        label: item.value,
                        detail: item.folder ? "Project folder" : "Project file",
                        kind: item.folder ? monaco.languages.CompletionItemKind.Folder : monaco.languages.CompletionItemKind.File,
                        insertText: item.value,
                        range: new monaco.Range(position.lineNumber, attrStart + 1, position.lineNumber, position.column),
                        sortText: item.folder ? `0${item.value}` : `1${item.value}`
                    });
                }
            }
            return {
                suggestions: suggestions
            };
        }
    });
}

function registerSnippetCompletions(languageIds, snippets, triggerCharacters = []) {
    for (const language of languageIds) {
        monaco.languages.registerCompletionItemProvider(language, {
            triggerCharacters: triggerCharacters,
            provideCompletionItems(model, position) {
                const word = model.getWordUntilPosition(position);
                const prefix = word.word.toLowerCase();
                if (!prefix) return {
                    suggestions: []
                };
                const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, position.column);
                return {
                    suggestions: Object.entries(snippets).filter(([label]) => label.toLowerCase().startsWith(prefix)).map(([label, insertText]) => ({
                        label: label,
                        detail: `Insert ${label}`,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        sortText: `0000${label}`
                    }))
                };
            }
        });
    }
}

function registerLanguageCompletions() {
    const css = {
        bg: "background-color: ${1:#ffffff};",
        border: "border: ${1:1px solid #000000};",
        color: "color: ${1:#222222};",
        center: "display: flex;\n  align-items: center;\n  justify-content: center;",
        display: "display: ${1:flex};",
        flex: "display: flex;\n  gap: ${1:1rem};\n  align-items: ${2:center};",
        grid: "display: grid;\n  grid-template-columns: repeat(${1:2}, minmax(0, 1fr));\n  gap: ${2:1rem};",
        hover: "&:hover {\n  $0\n}",
        margin: "margin: ${1:0};",
        padding: "padding: ${1:1rem};",
        responsive: "@media (max-width: ${1:768px}) {\n  $0\n}",
        root: ":root {\n  --${1:primary-color}: ${2:#2563eb};\n}",
        shadow: "box-shadow: ${1:0 4px 12px rgba(0, 0, 0, 0.15)};",
        transition: "transition: ${1:all 0.2s ease};",
        width: "width: ${1:100%};",
        height: "height: ${1:auto};",
        font: "font-family: ${1:Arial, sans-serif};"
    };
    registerSnippetCompletions([ "css", "scss", "less" ], css, [ ":", ".", "#", "@" ]);
    registerSnippetCompletions([ "sass" ], {
        bg: "background-color: ${1:#ffffff}",
        color: "color: ${1:#222222}",
        flex: "display: flex\n  gap: ${1:1rem}\n  align-items: ${2:center}",
        margin: "margin: ${1:0}",
        padding: "padding: ${1:1rem}",
        responsive: "@media (max-width: ${1:768px})\n  $0"
    }, [ ":", ".", "#", "@" ]);
    registerSnippetCompletions([ "javascript", "typescript" ], {
        af: "async (${1:args}) => {\n  $0\n}",
        cl: "class ${1:Name} {\n  constructor(${2:args}) {\n    $0\n  }\n}",
        console: "console.log($0);",
        exp: "export default ${1:value};",
        for: "for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n  $0\n}",
        func: "function ${1:name}(${2:args}) {\n  $0\n}",
        if: "if (${1:condition}) {\n  $0\n}",
        imp: 'import ${1:name} from "${2:module}";',
        log: "console.log($0);",
        map: "${1:items}.map((${2:item}) => ${0});",
        try: "try {\n  $0\n} catch (error) {\n  console.error(error);\n}"
    });
    registerSnippetCompletions([ "python" ], {
        cls: "class ${1:Name}:\n    def __init__(self${2:, args}):\n        $0",
        def: "def ${1:name}(${2:args}):\n    $0",
        for: "for ${1:item} in ${2:items}:\n    $0",
        if: "if ${1:condition}:\n    $0",
        main: 'if __name__ == "__main__":\n    $0',
        print: "print($0)",
        try: "try:\n    $0\nexcept ${1:Exception} as error:\n    print(error)",
        with: "with ${1:open(path)} as ${2:file}:\n    $0"
    });
    registerSnippetCompletions([ "rust" ], {
        fn: "fn ${1:name}(${2:args}) -> ${3:()} {\n    $0\n}",
        impl: "impl ${1:Type} {\n    $0\n}",
        let: "let ${1:mut value} = ${2:value};",
        main: "fn main() {\n    $0\n}",
        match: "match ${1:value} {\n    ${2:pattern} => ${3:result},\n    _ => ${4:todo!()},\n}",
        print: 'println!("{}", ${1:value});',
        struct: "struct ${1:Name} {\n    $0\n}",
        test: "#[test]\nfn ${1:test_name}() {\n    $0\n}"
    });
    registerSnippetCompletions([ "c", "cpp" ], {
        for: "for (int ${1:i} = 0; ${1:i} < ${2:count}; ++${1:i}) {\n    $0\n}",
        if: "if (${1:condition}) {\n    $0\n}",
        main: "int main() {\n    $0\n    return 0;\n}",
        printf: 'printf("%s\\n", ${1:value});',
        cout: "std::cout << ${1:value} << std::endl;",
        struct: "struct ${1:Name} {\n    $0\n};",
        while: "while (${1:condition}) {\n    $0\n}"
    });
    registerSnippetCompletions([ "csharp" ], {
        class: "class ${1:Name}\n{\n    $0\n}",
        for: "for (int ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++)\n{\n    $0\n}",
        if: "if (${1:condition})\n{\n    $0\n}",
        main: "static void Main(string[] args)\n{\n    $0\n}",
        namespace: "namespace ${1:Name}\n{\n    $0\n}",
        write: "Console.WriteLine(${0:value});"
    });
    registerSnippetCompletions([ "java" ], {
        class: "class ${1:Name} {\n    $0\n}",
        for: "for (int ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++) {\n    $0\n}",
        if: "if (${1:condition}) {\n    $0\n}",
        main: "public static void main(String[] args) {\n    $0\n}",
        sout: "System.out.println($0);",
        try: "try {\n    $0\n} catch (Exception e) {\n    e.printStackTrace();\n}"
    });
    registerSnippetCompletions([ "go" ], {
        func: "func ${1:name}(${2:args}) ${3:error} {\n\t$0\n}",
        if: "if ${1:condition} {\n\t$0\n}",
        main: "func main() {\n\t$0\n}",
        package: "package ${1:main}",
        println: "fmt.Println($0)",
        struct: "type ${1:Name} struct {\n\t$0\n}",
        test: "func Test${1:Name}(t *testing.T) {\n\t$0\n}"
    });
    registerSnippetCompletions([ "php" ], {
        class: "class ${1:Name} {\n    $0\n}",
        foreach: "foreach (${1:$items} as ${2:$item}) {\n    $0\n}",
        function: "function ${1:name}(${2:$args}) {\n    $0\n}",
        if: "if (${1:condition}) {\n    $0\n}",
        php: "<?php\n$0\n?>",
        print: "echo ${0:$value};"
    });
    registerSnippetCompletions([ "ruby" ], {
        class: "class ${1:Name}\n  $0\nend",
        def: "def ${1:name}(${2:args})\n  $0\nend",
        each: "${1:items}.each do |${2:item}|\n  $0\nend",
        if: "if ${1:condition}\n  $0\nend",
        puts: "puts ${0:value}"
    });
    registerSnippetCompletions([ "lua", "luau" ], {
        fn: "function ${1:name}(${2:args})\n  $0\nend",
        for: "for ${1:i} = ${2:1}, ${3:10} do\n  $0\nend",
        if: "if ${1:condition} then\n  $0\nend",
        print: "print($0)",
        local: "local ${1:name} = ${2:value}"
    });
    registerSnippetCompletions([ "swift" ], {
        func: "func ${1:name}(${2:args}) {\n    $0\n}",
        if: "if ${1:condition} {\n    $0\n}",
        let: "let ${1:name} = ${2:value}",
        print: "print($0)",
        struct: "struct ${1:Name} {\n    $0\n}"
    });
    registerSnippetCompletions([ "kotlin" ], {
        class: "class ${1:Name} {\n    $0\n}",
        fun: "fun ${1:name}(${2:args}) {\n    $0\n}",
        if: "if (${1:condition}) {\n    $0\n}",
        main: "fun main() {\n    $0\n}",
        println: "println($0)",
        val: "val ${1:name} = ${2:value}"
    });
    registerSnippetCompletions([ "dart" ], {
        class: "class ${1:Name} {\n  $0\n}",
        for: "for (var ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++) {\n  $0\n}",
        main: "void main() {\n  $0\n}",
        print: "print($0)",
        void: "void ${1:name}() {\n  $0\n}"
    });
    registerSnippetCompletions([ "shell" ], {
        for: "for ${1:item} in ${2:items}; do\n  $0\ndone",
        if: "if [ ${1:condition} ]; then\n  $0\nfi",
        function: "${1:name}() {\n  $0\n}",
        echo: 'echo "$0"'
    });
    registerSnippetCompletions([ "powershell" ], {
        foreach: "foreach ($item in $items) {\n    $0\n}",
        function: "function ${1:Name} {\n    $0\n}",
        if: "if (${1:condition}) {\n    $0\n}",
        write: "Write-Output ${0:$value}"
    });
    registerSnippetCompletions([ "sql", "mysql", "pgsql" ], {
        delete: "DELETE FROM ${1:table} WHERE ${2:condition};",
        insert: "INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values});",
        select: "SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition};",
        update: "UPDATE ${1:table} SET ${2:column} = ${3:value} WHERE ${4:condition};"
    });
    registerSnippetCompletions([ "zig" ], {
        fn: "fn ${1:name}(${2:args}) ${3:void} {\n    $0\n}",
        if: "if (${1:condition}) {\n    $0\n}",
        main: "pub fn main() !void {\n    $0\n}",
        print: 'std.debug.print("{}\\n", .{${1:value}});'
    });
    registerSnippetCompletions([ "nim" ], {
        echo: "echo ${0:value}",
        for: "for ${1:item} in ${2:items}:\n  $0",
        if: "if ${1:condition}:\n  $0",
        proc: "proc ${1:name}(${2:args}) =\n  $0"
    });
    registerSnippetCompletions([ "json", "jsonc", "json5" ], {
        array: "[\n  ${0:value}\n]",
        object: '{\n  "${1:key}": ${2:value}\n}',
        pair: '"${1:key}": ${0:value}'
    });
    registerSnippetCompletions([ "yaml" ], {
        list: "- ${0:value}",
        mapping: "${1:key}: ${0:value}",
        sequence: "${1:name}:\n  - ${0:value}"
    });
    registerSnippetCompletions([ "toml" ], {
        array: "${1:name} = [\n  ${0:value}\n]",
        section: "[${1:section}]\n${0:key} = ${2:value}",
        table: "[[${1:item}]]\n${0:key} = ${2:value}"
    });
    registerSnippetCompletions([ "markdown", "mdx" ], {
        code: "```\n${1:language}\n$0\n```",
        h1: "# ${0:Heading}",
        h2: "## ${0:Heading}",
        image: "![${1:alt text}](${2:image path})",
        link: "[${1:link text}](${2:URL})",
        list: "- ${0:List item}",
        quote: "> ${0:Quote}"
    });
    registerSnippetCompletions([ "xml" ], {
        comment: "\x3c!-- $0 --\x3e",
        declaration: '<?xml version="1.0" encoding="UTF-8"?>',
        element: "<${1:element}>$0</${1:element}>"
    });
    registerSnippetCompletions([ "fsharp" ], {
        let: "let ${1:name} = ${2:value}",
        match: "match ${1:value} with\n| ${2:pattern} -> ${0:result}",
        module: "module ${1:Name}\n\n$0",
        printfn: 'printfn "%A" ${0:value}',
        type: "type ${1:Name} =\n    $0"
    });
    registerSnippetCompletions([ "scala" ], {
        class: "class ${1:Name} {\n  $0\n}",
        def: "def ${1:name}(${2:args}): ${3:Unit} = {\n  $0\n}",
        object: "object ${1:Name} {\n  $0\n}",
        val: "val ${1:name} = ${2:value}"
    });
    registerSnippetCompletions([ "clojure" ], {
        defn: "(defn ${1:name} [${2:args}]\n  $0)",
        filter: "(filter ${1:predicate} ${2:collection})",
        let: "(let [${1:name} ${2:value}]\n  $0)",
        map: "(map ${1:function} ${2:collection})",
        println: "(println $0)"
    });
    registerSnippetCompletions([ "r" ], {
        for: "for (${1:item} in ${2:items}) {\n  $0\n}",
        function: "${1:name} <- function(${2:args}) {\n  $0\n}",
        if: "if (${1:condition}) {\n  $0\n}",
        print: "print(${0:value})"
    });
    registerSnippetCompletions([ "perl" ], {
        foreach: "foreach my $item (@items) {\n  $0\n}",
        print: 'print "${0:value}\\n";',
        sub: "sub ${1:name} {\n  $0\n}",
        use: "use ${1:strict};\nuse warnings;"
    });
    registerSnippetCompletions([ "julia" ], {
        for: "for ${1:item} in ${2:items}\n    $0\nend",
        function: "function ${1:name}(${2:args})\n    $0\nend",
        println: "println($0)",
        struct: "struct ${1:Name}\n    $0\nend"
    });
    registerSnippetCompletions([ "elixir" ], {
        case: "case ${1:value} do\n  ${2:pattern} ->\n    $0\nend",
        def: "def ${1:name}(${2:args}) do\n  $0\nend",
        defmodule: "defmodule ${1:Name} do\n  $0\nend",
        puts: "IO.puts(${0:value})"
    });
    registerSnippetCompletions([ "vb" ], {
        class: "Public Class ${1:Name}\n    $0\nEnd Class",
        if: "If ${1:condition} Then\n    $0\nEnd If",
        sub: "Sub ${1:Name}()\n    $0\nEnd Sub",
        write: "Console.WriteLine(${0:value})"
    });
    registerSnippetCompletions([ "bat" ], {
        echo: "echo ${0:value}",
        if: "if ${1:condition} (\n    $0\n)",
        set: 'set "${1:NAME}=${2:value}"'
    });
    registerCSSAbbreviations();
}

function registerCSSAbbreviations() {
    const languages = [ "css", "scss", "less", "sass" ];
    for (const language of languages) {
        monaco.languages.registerCompletionItemProvider(language, {
            triggerCharacters: [ ".", "#" ],
            provideCompletionItems(model, position) {
                const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
                const selector = line.match(/^(\s*)([.#][\w-]*)$/);
                const colorAbbreviation = line.match(/^(\s*)((?:bgc|c)#[\da-f]{3,8})$/i);
                const word = model.getWordUntilPosition(position);
                const prefix = (colorAbbreviation?.[2] || word.word).toLowerCase();
                const range = colorAbbreviation ? new monaco.Range(position.lineNumber, colorAbbreviation[1].length + 1, position.lineNumber, position.column) : new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, position.column);
                const suggestions = [];
                if (selector && selector[2].length > 1) {
                    const isSass = language === "sass";
                    const insertText = isSass ? `${selector[2]}\n  $0` : `${selector[2]} {\n  $0\n}`;
                    suggestions.push({
                        label: `${selector[2]} { … }`,
                        detail: "Create a CSS selector rule",
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: new monaco.Range(position.lineNumber, selector[1].length + 1, position.lineNumber, position.column),
                        sortText: "0000selector"
                    });
                }
                const aliases = {
                    bgc: "background-color: ${1:#ffffff};",
                    bd: "border: ${1:1px solid #000000};",
                    br: "border-radius: ${1:4px};",
                    c: "color: ${1:#222222};",
                    d: "display: ${1:flex};",
                    fz: "font-size: ${1:16px};",
                    fw: "font-weight: ${1:400};",
                    h: "height: ${1:100%};",
                    jc: "justify-content: ${1:center};",
                    lh: "line-height: ${1:1.5};",
                    m: "margin: ${1:0};",
                    mb: "margin-bottom: ${1:1rem};",
                    ml: "margin-left: ${1:1rem};",
                    mr: "margin-right: ${1:1rem};",
                    mt: "margin-top: ${1:1rem};",
                    op: "opacity: ${1:1};",
                    p: "padding: ${1:1rem};",
                    pb: "padding-bottom: ${1:1rem};",
                    pl: "padding-left: ${1:1rem};",
                    pos: "position: ${1:relative};",
                    pr: "padding-right: ${1:1rem};",
                    pt: "padding-top: ${1:1rem};",
                    ta: "text-align: ${1:left};",
                    trf: "transform: ${1:translateX(0)};",
                    trs: "transition: ${1:all 0.2s ease};",
                    w: "width: ${1:100%};",
                    zi: "z-index: ${1:1};"
                };
                if (prefix) {
                    for (const [label, insertText] of Object.entries(aliases)) {
                        if (!label.startsWith(prefix)) continue;
                        suggestions.push({
                            label: label,
                            detail: `Emmet CSS abbreviation for ${label}`,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: insertText,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range: range,
                            sortText: `0001${label}`
                        });
                    }
                    const numeric = prefix.match(/^(m|p|w|h|fz)(\d+(?:px|rem|em|%)?)$/i);
                    const hex = prefix.match(/^(c|bgc)#([\da-f]{3,8})$/i);
                    if (numeric) {
                        const property = {
                            m: "margin",
                            p: "padding",
                            w: "width",
                            h: "height",
                            fz: "font-size"
                        }[numeric[1].toLowerCase()];
                        const value = /^\d+$/.test(numeric[2]) ? `${numeric[2]}px` : numeric[2];
                        suggestions.push({
                            label: `${numeric[1]}${numeric[2]}`,
                            detail: `Emmet CSS abbreviation for ${property}`,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: `${property}: ${value};`,
                            range: range,
                            sortText: "0000numeric"
                        });
                    }
                    if (hex) {
                        const property = hex[1].toLowerCase() === "c" ? "color" : "background-color";
                        suggestions.push({
                            label: `${hex[1]}#${hex[2]}`,
                            detail: `Emmet CSS abbreviation for ${property}`,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: `${property}: #${hex[2]};`,
                            range: range,
                            sortText: "0000color"
                        });
                    }
                }
                return {
                    suggestions: suggestions
                };
            }
        });
    }
}

function enableAutoCloseTags(editorInstance) {
    const markupLanguages = new Set([ "html", "xml", "handlebars", "razor", "liquid", "twig", "php" ]);
    const htmlVoidTags = new Set([ "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr" ]);
    editorInstance.onDidChangeModelContent(event => {
        if (event.isUndoing || event.isRedoing || event.changes.length !== 1) return;
        const change = event.changes[0];
        if (change.text !== ">" || change.rangeLength !== 0) return;
        const model = editorInstance.getModel();
        if (!model || !markupLanguages.has(model.getLanguageId())) return;
        const position = model.getPositionAt(change.rangeOffset + change.text.length);
        const line = model.getLineContent(position.lineNumber);
        const beforeCursor = line.slice(0, position.column - 1);
        const match = beforeCursor.match(/<([A-Za-z][\w:-]*)(?:\s+[^<>]*)?>$/);
        if (!match || /\/\s*>$/.test(beforeCursor)) return;
        const tag = match[1];
        if (model.getLanguageId() === "html" && htmlVoidTags.has(tag.toLowerCase())) return;
        const afterCursor = line.slice(position.column - 1);
        if (new RegExp(`^</${tag}\\s*>`, "i").test(afterCursor)) return;
        const cursor = new monaco.Selection(position.lineNumber, position.column, position.lineNumber, position.column);
        editorInstance.executeEdits("codec-auto-close-tag", [ {
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: `</${tag}>`
        } ], [ cursor ]);
    });
}

const nav = {
    stack: [],
    index: -1,
    moving: false
};

function pushNav(id) {
    if (nav.moving || id == null || nav.stack[nav.index] === id) return;
    nav.stack = nav.stack.slice(0, nav.index + 1).concat(id).slice(-50);
    nav.index = nav.stack.length - 1;
    updateNavButtons();
}

function navGo(delta) {
    let i = nav.index + delta;
    while (i >= 0 && i < nav.stack.length && !S.tabs.some(t => t.id === nav.stack[i])) i += delta;
    if (i < 0 || i >= nav.stack.length) return;
    nav.index = i;
    nav.moving = true;
    activateTab(nav.stack[i]);
    nav.moving = false;
    updateNavButtons();
}

function updateNavButtons() {
    $("#tb-back").disabled = nav.index <= 0;
    $("#tb-forward").disabled = nav.index >= nav.stack.length - 1;
}

function activateTab(id, {focus: focus = true} = {}) {
    pushNav(id);
    const prev = currentTab();
    if (prev && !prev.kind) prev.viewState = editor.saveViewState();
    if (prev?.kind) stopMedia(prev);
    S.active = id;
    const tab = currentTab();
    if (tab) showWelcomePage = false;
    if (tab && !tab.kind) {
        editor.setModel(tab.model);
        if (tab.viewState) editor.restoreViewState(tab.viewState);
        if (focus) editor.focus();
    } else editor.setModel(null);
    if (tab?.path) rememberFile(tab.path);
    if (tab?.path) selectNode(tab.path);
    renderMedia(tab);
    $("#welcome").classList.toggle("hidden", !!tab || !showWelcomePage);
    $("#watermark").classList.toggle("hidden", !!tab || showWelcomePage);
    renderTabs();
    updateStatus();
    updateTitle();
    for (const n of document.querySelectorAll("#tree .node")) n.classList.toggle("active-file", n.dataset.path === tab?.path);
    updatePresence();
}

let dragTabId = null;

function renderTabs() {
    const bar = $("#tabs");
    bar.replaceChildren(...S.tabs.map(t => {
        const e = el("div", "tab" + (t.id === S.active ? " active" : "") + (isDirty(t) ? " dirty" : ""));
        e.title = t.path || t.title;
        e.draggable = true;
        e.append(t.kind === "extension" ? ExtUI.tabIcon() : FileIcons.icon(t.title, false), el("span", "title" + (t.kind === "extension" ? " italic" : ""), t.title));
        if (t.path && S.tabs.some(o => o !== t && o.title === t.title)) e.append(el("span", "tab-desc", P.basename(P.dirname(t.path))));
        const close = el("span", "close");
        const ci = el("i", `codicon codicon-${isDirty(t) ? "circle-filled" : "close"}`);
        close.append(ci);
        close.title = "Close (Ctrl+F4)";
        close.onmouseenter = () => ci.className = "codicon codicon-close";
        close.onmouseleave = () => ci.className = `codicon codicon-${isDirty(t) ? "circle-filled" : "close"}`;
        close.onclick = ev => {
            ev.stopPropagation();
            closeTab(t.id);
        };
        e.append(close);
        e.onclick = () => activateTab(t.id);
        e.onauxclick = ev => ev.button === 1 && closeTab(t.id);
        e.oncontextmenu = ev => {
            ev.preventDefault();
            openMenu([ {
                label: "Close",
                kb: "Ctrl+F4",
                run: () => closeTab(t.id)
            }, {
                label: "Close Others",
                run: () => closeOthers(t.id)
            }, {
                label: "Close to the Right",
                run: () => closeToRight(t.id)
            }, {
                label: "Close Saved",
                kb: "Ctrl+K U",
                run: closeSaved
            }, {
                label: "Close All",
                kb: "Ctrl+K W",
                run: closeAllTabs
            }, "-", {
                label: "Copy Path",
                kb: "Shift+Alt+C",
                disabled: !t.path,
                run: () => navigator.clipboard.writeText(t.path)
            }, {
                label: "Copy Relative Path",
                disabled: !t.path,
                run: () => navigator.clipboard.writeText(rel(t.path))
            }, "-", {
                label: "Reveal in File Explorer",
                kb: "Shift+Alt+R",
                disabled: !t.path,
                run: () => api.reveal(t.path)
            } ], ev.clientX, ev.clientY);
        };
        e.ondragstart = () => dragTabId = t.id;
        e.ondragover = ev => {
            ev.preventDefault();
            e.classList.add("dragover");
        };
        e.ondragleave = () => e.classList.remove("dragover");
        e.ondrop = () => {
            const from = S.tabs.findIndex(x => x.id === dragTabId);
            const to = S.tabs.findIndex(x => x.id === t.id);
            if (from >= 0 && to >= 0 && from !== to) S.tabs.splice(to, 0, S.tabs.splice(from, 1)[0]);
            renderTabs();
        };
        return e;
    }));
    bar.querySelector(".tab.active")?.scrollIntoView({
        block: "nearest",
        inline: "nearest"
    });
    renderBreadcrumbs();
    const dirty = S.tabs.filter(isDirty).length;
    const badge = $("#dirty-badge");
    badge.textContent = dirty > 99 ? "99+" : dirty;
    badge.classList.toggle("hidden", !dirty);
    $(".act[data-view=explorer]").title = dirty ? `Explorer (Ctrl+Shift+E) - ${dirty} unsaved file${dirty > 1 ? "s" : ""}` : "Explorer (Ctrl+Shift+E)";
}

function renderBreadcrumbs() {
    const t = currentTab();
    const bc = $("#breadcrumbs");
    bc.replaceChildren();
    if (!t || t.kind === "extension") return;
    const parts = (t.path ? rel(t.path) : t.title).split(/[\\/]/);
    parts.forEach((part, i) => {
        if (i) bc.append(el("i", "codicon codicon-chevron-right sep"));
        const crumb = el("span", "crumb");
        if (i === parts.length - 1) crumb.append(FileIcons.icon(part, false));
        crumb.append(document.createTextNode(part));
        if (i === parts.length - 1) crumb.onclick = () => runCommand("edit.gotoSymbol"); else if (t.path) {
            const dir = P.join(S.root, ...parts.slice(0, i + 1));
            crumb.onclick = async () => {
                showView("explorer", true);
                let d = dir;
                while (d.length >= S.root.length) {
                    S.expanded.add(d);
                    const up = P.dirname(d);
                    if (up === d) break;
                    d = up;
                }
                S.selected = dir;
                await renderTree();
                document.querySelector(`#tree .node[data-path="${CSS.escape(dir)}"]`)?.scrollIntoView({
                    block: "center"
                });
            };
        }
        bc.append(crumb);
    });
    if (t.kind) {
        const label = el("span", "bc-preview", {
            image: "Image Preview",
            video: "Video Preview",
            audio: "Audio Preview"
        }[t.kind]);
        if (t.kind === "image") label.id = "bc-zoom";
        bc.append(label);
    }
}

function projectRootForPage(file) {
    if (!S.root) return P.dirname(file);
    const relative = P.relative(S.root, file);
    return relative === ".." || relative.startsWith(`..${P.sep}`) || P.resolve(relative) === relative ? P.dirname(file) : S.root;
}

let showWelcomePage = false;

function stopMedia(t) {
    const v = $("#media-view video, #media-view audio");
    if (v) {
        if (t) t.time = v.currentTime;
        v.pause();
        v.removeAttribute("src");
        v.load();
    }
    const img = $("#media-view img");
    if (img) img.removeAttribute("src");
    $("#media-view").replaceChildren();
}

function renderMedia(tab) {
    const view = $("#media-view");
    view.classList.toggle("hidden", !tab?.kind);
    if (!tab?.kind) return view.replaceChildren();
    if (tab.kind === "extension") return ExtUI.renderPage(view, tab);
    const url = fileUrl(tab.path);
    if (tab.kind === "image") {
        const wrap = el("div", "media-image");
        const img = el("img");
        img.draggable = false;
        img.src = url;
        const apply = () => {
            if (!img.naturalWidth) return;
            const fit = Math.min((view.clientWidth - 40) / img.naturalWidth, (view.clientHeight - 40) / img.naturalHeight, 1);
            const scale = tab.zoom === "fit" ? fit : tab.zoom;
            img.style.width = img.naturalWidth * scale + "px";
            img.style.height = img.naturalHeight * scale + "px";
            img.classList.toggle("pixelated", scale > 2.5);
            wrap.classList.toggle("scrollable", tab.zoom !== "fit");
            const z = $("#bc-zoom");
            if (z) z.textContent = `Image Preview · ${img.naturalWidth}×${img.naturalHeight} · ${Math.round(scale * 100)}%`;
            tab.scale = scale;
        };
        img.onload = () => {
            apply();
            requestAnimationFrame(apply);
        };
        img.onerror = () => view.replaceChildren(el("div", "media-error", "The image could not be loaded."));
        const zoomBy = f => {
            tab.zoom = Math.max(.1, Math.min(20, (tab.scale || 1) * f));
            apply();
        };
        wrap.onclick = e => zoomBy(e.altKey ? 1 / 1.5 : 1.5);
        wrap.ondblclick = e => {
            e.preventDefault();
            tab.zoom = "fit";
            apply();
        };
        wrap.onwheel = e => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
        };
        tab.applyZoom = apply;
        wrap.append(img);
        view.replaceChildren(wrap);
    } else {
        const box = el("div", "media-player " + tab.kind);
        const m = el(tab.kind);
        m.controls = true;
        m.src = url;
        m.preload = "metadata";
        if (tab.time) m.currentTime = tab.time;
        m.onerror = () => box.prepend(el("div", "media-error", `This ${tab.kind} uses a format that can't be played in the preview.`));
        if (tab.kind === "audio") box.append(el("i", "codicon codicon-music"));
        box.append(m);
        view.replaceChildren(box);
    }
}

async function closeTab(id, force = false) {
    const t = S.tabs.find(x => x.id === id);
    if (!t) return true;
    if (!force && isDirty(t)) {
        const {response: response} = await api.dialog.message({
            type: "warning",
            buttons: [ "Save", "Don't Save", "Cancel" ],
            defaultId: 0,
            cancelId: 2,
            message: `Do you want to save the changes you made to ${t.title}?`,
            detail: "Your changes will be lost if you don't save them."
        });
        if (response === 2) return false;
        if (response === 0 && !await saveTab(t)) return false;
    }
    const idx = S.tabs.indexOf(t);
    S.tabs.splice(idx, 1);
    if (S.active === id) {
        const next = S.tabs[idx] || S.tabs[idx - 1];
        S.active = null;
        activateTab(next ? next.id : null);
    } else renderTabs();
    if (t.kind) stopMedia(t);
    t.model?.dispose();
    return true;
}

async function closeOthers(id) {
    for (const t of [ ...S.tabs ]) if (t.id !== id && !await closeTab(t.id)) return false;
    return true;
}

async function closeToRight(id) {
    const i = S.tabs.findIndex(t => t.id === id);
    for (const t of S.tabs.slice(i + 1)) if (!await closeTab(t.id)) return false;
    return true;
}

async function closeSaved() {
    for (const t of [ ...S.tabs ]) if (!isDirty(t)) await closeTab(t.id);
}

async function closeAllTabs() {
    for (const t of [ ...S.tabs ]) if (!await closeTab(t.id)) return false;
    return true;
}

async function saveTab(t, saveAs = false, suggestedName = null) {
    if (!t) return false;
    if (t.kind) return true;
    let p = t.path;
    if (!p || saveAs) {
        const defaultPath = suggestedName ? S.root ? P.join(S.root, suggestedName) : suggestedName : t.path || (S.root ? P.join(S.root, t.title + ".txt") : t.title + ".txt");
        p = await api.dialog.saveFile(defaultPath);
        if (!p) return false;
    }
    await beforeSave(t);
    const ok = await guard(async () => {
        await api.fs.writeFile(p, t.model.getValue());
        return true;
    });
    if (!ok) return false;
    if (p !== t.path) {
        const content = t.model.getValue();
        const old = t.model;
        t.path = p;
        t.title = P.basename(p);
        t.model = monaco.editor.getModel(monaco.Uri.file(p)) || monaco.editor.createModel(content, FileIcons.language(p), monaco.Uri.file(p));
        t.model.updateOptions({
            tabSize: settings.tabSize
        });
        watchModel(t);
        if (S.active === t.id) editor.setModel(t.model);
        old.dispose();
        invalidate(p);
    }
    t.savedVersion = t.model.getAlternativeVersionId();
    renderTabs();
    updateStatus();
    updateTitle();
    logOutput(`Saved ${p}`);
    if (p === await api.settings.path()) {
        settings = {
            ...settingsDefaults,
            ...await api.settings.get()
        };
        applySettings();
        toast("Settings reloaded from settings.json.");
    }
    return true;
}

async function beforeSave(t) {
    const m = t.model;
    if (settings.formatOnSave && S.active === t.id) {
        const action = editor.getAction("editor.action.formatDocument");
        if (action?.isSupported()) await action.run().catch(() => {});
    }
    const edits = [];
    if (settings.trimTrailingWhitespace) {
        for (let i = 1; i <= m.getLineCount(); i++) {
            const line = m.getLineContent(i);
            const trimmed = line.replace(/\s+$/, "");
            if (trimmed.length !== line.length) edits.push({
                range: new monaco.Range(i, trimmed.length + 1, i, line.length + 1),
                text: ""
            });
        }
    }
    if (settings.insertFinalNewline) {
        const last = m.getLineCount();
        if (m.getLineContent(last) !== "") edits.push({
            range: new monaco.Range(last, m.getLineMaxColumn(last), last, m.getLineMaxColumn(last)),
            text: m.getEOL()
        });
    }
    if (edits.length) m.pushEditOperations([], edits, () => null);
}

async function saveAll() {
    for (const t of S.tabs) if (isDirty(t) && t.path) await saveTab(t);
}

const autoSaveTimers = new Map;

function scheduleAutoSave(t) {
    clearTimeout(autoSaveTimers.get(t.id));
    autoSaveTimers.set(t.id, setTimeout(() => S.tabs.includes(t) && isDirty(t) && saveTab(t), Math.max(100, Number(settings.autoSaveDelay) || 1e3)));
}

function updateTitle() {
    const t = currentTab();
    const parts = [ t ? (isDirty(t) ? "● " : "") + t.title : null, S.root ? P.basename(S.root) : null, "Codec" ].filter(Boolean);
    api.window.setTitle(parts.join(" - "));
    $("#cc-label").textContent = S.root ? P.basename(S.root) : "Codec";
}

function updateStatus() {
    const t = currentTab();
    const runnable = !!t?.model && !t.kind && (t.path ? RUNNABLE_EXTENSIONS.has(FileIcons.extOf(t.title)) : RUNNABLE_LANGUAGES.has(t.model.getLanguageId()));
    $("#btn-run").classList.toggle("hidden", !runnable);
    $("#btn-run").title = "Run File (F5)";
    const show = (id, v) => {
        $(id).textContent = v;
        $(id).classList.toggle("hidden", !v);
    };
    if (!t || !editor || t.kind) {
        [ "#sb-pos", "#sb-indent", "#sb-eol", "#sb-lang", "#sb-encoding" ].forEach(id => show(id, ""));
        return;
    }
    const pos = editor.getPosition();
    const sel = editor.getSelection();
    const selLen = sel && !sel.isEmpty() ? t.model.getValueInRange(sel).length : 0;
    show("#sb-pos", pos ? `Ln ${pos.lineNumber}, Col ${pos.column}${selLen ? ` (${selLen} selected)` : ""}` : "");
    const opts = t.model.getOptions();
    show("#sb-indent", `${opts.insertSpaces ? "Spaces" : "Tab Size"}: ${opts.tabSize}`);
    show("#sb-encoding", "UTF-8");
    show("#sb-eol", t.model.getEOL() === "\r\n" ? "CRLF" : "LF");
    const lang = monaco.languages.getLanguages().find(l => l.id === t.model.getLanguageId());
    show("#sb-lang", lang?.aliases?.[0] || t.model.getLanguageId());
    updateTitle();
}

api.fs.onChanged(async paths => {
    if (!S.root) return;
    for (const p of paths) invalidate(p);
    await renderTree();
    for (const t of S.tabs) {
        if (!t.path || t.kind || !paths.includes(t.path) || isDirty(t)) continue;
        if (!await api.fs.exists(t.path)) continue;
        const data = await api.fs.readFile(t.path).catch(() => null);
        if (data && !data.binary && data.content !== t.model.getValue()) {
            t.model.pushEditOperations([], [ {
                range: t.model.getFullModelRange(),
                text: data.content
            } ], () => null);
            t.savedVersion = t.model.getAlternativeVersionId();
            renderTabs();
        }
    }
});

const searchOpts = {
    caseSensitive: false,
    wholeWord: false,
    regex: false
};

let lastSearch = null;

async function runSearch() {
    const q = $("#search-input").value;
    const box = $("#search-results");
    if (!q) {
        box.innerHTML = "";
        $("#search-summary").textContent = "";
        return;
    }
    if (!S.root) return $("#search-summary").textContent = "You have not opened or specified a folder. Open a folder to search.";
    $("#search-summary").textContent = "Searching...";
    const res = await api.search(S.root, q, {
        ...searchOpts,
        include: $("#search-include").value.trim(),
        exclude: $("#search-exclude").value.trim()
    });
    lastSearch = {
        q: q,
        res: res
    };
    if (res.error) return $("#search-summary").textContent = res.error;
    $("#search-summary").textContent = res.total ? `${res.total} result${res.total > 1 ? "s" : ""} in ${res.results.length} file${res.results.length > 1 ? "s" : ""}` : "No results found. Review your settings for configured exclusions and check your gitignore files.";
    const frag = document.createDocumentFragment();
    for (const r of res.results) {
        const head = el("div", "sr-file");
        const twisty = el("span", "twisty");
        twisty.append(el("i", "codicon codicon-chevron-down"));
        head.append(twisty, FileIcons.icon(P.basename(r.file), false), el("span", null, P.basename(r.file)), el("span", "dir", P.dirname(rel(r.file))), el("span", "count", r.matches.length));
        const lines = el("div");
        head.onclick = () => {
            lines.classList.toggle("hidden");
            twisty.firstChild.className = "codicon codicon-chevron-" + (lines.classList.contains("hidden") ? "right" : "down");
        };
        for (const m of r.matches) {
            const line = el("div", "sr-line");
            const start = Math.max(0, m.col - 1 - 40);
            const text = m.text.slice(start);
            const off = m.col - 1 - start;
            line.innerHTML = (start ? "…" : "") + esc(text.slice(0, off).trimStart()) + "<mark>" + esc(text.slice(off, off + m.len)) + "</mark>" + esc(text.slice(off + m.len));
            line.title = `${rel(r.file)}:${m.line}`;
            line.onclick = () => openFile(r.file, {
                line: m.line,
                col: m.col,
                len: m.len
            });
            lines.append(line);
        }
        frag.append(head, lines);
    }
    box.replaceChildren(frag);
}

async function replaceAll() {
    if (!lastSearch?.res?.results?.length) return;
    const replacement = $("#replace-input").value;
    const {response: response} = await api.dialog.message({
        type: "question",
        buttons: [ "Replace", "Cancel" ],
        cancelId: 1,
        message: `Replace ${lastSearch.res.total} occurrence(s) across ${lastSearch.res.results.length} file(s) with '${replacement}'?`
    });
    if (response !== 0) return;
    let src = searchOpts.regex ? lastSearch.q : lastSearch.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (searchOpts.wholeWord) src = `\\b${src}\\b`;
    const re = new RegExp(src, searchOpts.caseSensitive ? "g" : "gi");
    let skipped = 0;
    for (const r of lastSearch.res.results) {
        const open = S.tabs.find(t => t.path === r.file);
        if (open) {
            if (isDirty(open)) {
                skipped++;
                continue;
            }
            open.model.pushEditOperations([], [ {
                range: open.model.getFullModelRange(),
                text: open.model.getValue().replace(re, replacement)
            } ], () => null);
            await saveTab(open);
        } else {
            const data = await api.fs.readFile(r.file);
            await api.fs.writeFile(r.file, data.content.replace(re, replacement));
        }
    }
    toast(skipped ? `Replaced. ${skipped} file(s) with unsaved changes were skipped.` : "Replaced all occurrences.");
    runSearch();
}

function toggleReplace(force) {
    const row = $("#replace-row");
    const show = force ?? row.classList.contains("hidden");
    row.classList.toggle("hidden", !show);
    $("#btn-toggle-replace .codicon").className = "codicon codicon-chevron-" + (show ? "down" : "right");
}

function setupSearch() {
    let timer;
    $("#search-input").addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(runSearch, 400);
    });
    $("#search-input").addEventListener("keydown", e => e.key === "Enter" && runSearch());
    $("#search-include").addEventListener("keydown", e => e.key === "Enter" && runSearch());
    $("#search-exclude").addEventListener("keydown", e => e.key === "Enter" && runSearch());
    $("#btn-search-details").onclick = () => $("#search-details").classList.toggle("hidden");
    for (const [id, key] of [ [ "#opt-case", "caseSensitive" ], [ "#opt-word", "wholeWord" ], [ "#opt-regex", "regex" ] ]) {
        $(id).onclick = () => {
            searchOpts[key] = !searchOpts[key];
            $(id).classList.toggle("on", searchOpts[key]);
            runSearch();
        };
    }
    $("#btn-replace-all").onclick = replaceAll;
    $("#btn-toggle-replace").onclick = () => toggleReplace();
    $("#btn-search-refresh").onclick = runSearch;
    $("#btn-search-clear").onclick = () => {
        $("#search-input").value = "";
        runSearch();
    };
    $("#btn-search-collapse").onclick = () => document.querySelectorAll("#search-results .sr-file").forEach(h => {
        h.nextSibling.classList.add("hidden");
        h.querySelector(".codicon").className = "codicon codicon-chevron-right";
    });
}

function showView(name, keepOpen = false) {
    const sb = $("#sidebar");
    const btn = document.querySelector(`.act[data-view="${name}"]`);
    if (!keepOpen && btn.classList.contains("active") && !sb.classList.contains("collapsed") && name !== "search") {
        sb.classList.add("collapsed");
        btn.classList.remove("active");
        return layout();
    }
    sb.classList.remove("collapsed");
    document.querySelectorAll(".act[data-view]").forEach(b => b.classList.toggle("active", b === btn));
    document.querySelectorAll("#sidebar .view").forEach(v => v.classList.toggle("hidden", v.id !== "view-" + name));
    if (name === "extensions") ExtUI.onShow();
    if (name === "search") {
        const sel = editor?.getSelection();
        const text = sel && !sel.isEmpty() ? editor.getModel().getValueInRange(sel) : "";
        if (text && !text.includes("\n")) $("#search-input").value = text;
        $("#search-input").focus();
        $("#search-input").select();
    }
    layout();
}

function layout() {
    editor?.layout();
    const t = S.terms.find(x => x.id === S.activeTerm);
    if (t && !$("#panel").classList.contains("hidden") && panelView === "terminal") t.fit.fit();
}

function dragSash(sash, onMove, onEnd) {
    sash.addEventListener("mousedown", e => {
        e.preventDefault();
        sash.classList.add("dragging");
        const move = ev => {
            onMove(ev);
            layout();
        };
        const up = () => {
            sash.classList.remove("dragging");
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            onEnd?.();
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    });
}

function setupSashes() {
    const save = () => api.state.set({
        layout: {
            sidebar: $("#sidebar").offsetWidth,
            panel: $("#panel").offsetHeight,
            problems: $("#problems-pane").offsetWidth
        }
    });
    dragSash($("#sash-sidebar"), ev => $("#sidebar").style.width = Math.min(Math.max(ev.clientX - 48, 170), window.innerWidth - 300) + "px", save);
    dragSash($("#sash-panel"), ev => $("#panel").style.height = Math.min(Math.max(window.innerHeight - ev.clientY - 8, 100), window.innerHeight - 150) + "px", save);
    dragSash($("#split-sash"), ev => {
        const left = $("#pview-terminal").getBoundingClientRect().left;
        $("#problems-pane").style.width = Math.min(Math.max(ev.clientX - left, 160), $("#pview-terminal").offsetWidth - 200) + "px";
    }, save);
    new ResizeObserver(layout).observe($("#editor-area"));
    new ResizeObserver(layout).observe($("#terminals"));
}

function termTheme() {
    return settings.theme === "light" ? {
        background: "#f8f8f8",
        foreground: "#3b3b3b",
        cursor: "#005fb8",
        cursorAccent: "#f8f8f8",
        selectionBackground: "#add6ff",
        black: "#000000",
        red: "#cd3131",
        green: "#107c10",
        yellow: "#949800",
        blue: "#0451a5",
        magenta: "#bc05bc",
        cyan: "#0598bc",
        white: "#555555",
        brightBlack: "#666666",
        brightRed: "#cd3131",
        brightGreen: "#14ce14",
        brightYellow: "#b5ba00",
        brightBlue: "#0451a5",
        brightMagenta: "#bc05bc",
        brightCyan: "#0598bc",
        brightWhite: "#a5a5a5"
    } : {
        background: "#191a1b",
        foreground: "#cccccc",
        cursor: "#cccccc",
        cursorAccent: "#191a1b",
        selectionBackground: "#264f78",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#e5e5e5"
    };
}

function termOptions() {
    return {
        theme: termTheme(),
        fontSize: Number(settings.terminalFontSize) || 14,
        fontFamily: settings.fontFamily,
        lineHeight: Number(settings.terminalLineHeight) || 1.2,
        cursorStyle: settings.terminalCursorStyle || "block",
        cursorBlink: !!settings.terminalCursorBlink,
        cursorInactiveStyle: "outline"
    };
}

const GIT_BASH = "C:\\Program Files\\Git\\bin\\bash.exe";

async function terminalProfiles() {
    if (api.platform !== "win32") return [ {
        name: "bash",
        shell: ""
    } ];
    const list = [ {
        name: "PowerShell",
        shell: "powershell.exe"
    }, {
        name: "Command Prompt",
        shell: "cmd.exe"
    } ];
    if (await api.fs.exists(GIT_BASH)) list.push({
        name: "Git Bash",
        shell: GIT_BASH
    });
    return list;
}

async function newTerminal(cwd, profile) {
    if (!await api.term.available()) return toast("The terminal is unavailable: node-pty failed to load.", true);
    showPanel(true);
    showPanelView("terminal");
    const id = "t" + nextId++;
    const box = el("div", "term");
    $("#terminals").append(box);
    const xterm = new Terminal({
        ...termOptions(),
        allowProposedApi: true,
        scrollback: 5e3
    });
    const fit = new FitAddon.FitAddon;
    xterm.loadAddon(fit);
    xterm.open(box);
    fit.fit();
    xterm.attachCustomKeyEventHandler(e => {
        if (e.type !== "keydown") return true;
        if (e.ctrlKey && e.key === "c" && xterm.hasSelection()) {
            navigator.clipboard.writeText(xterm.getSelection());
            xterm.clearSelection();
            return false;
        }
        if (e.ctrlKey && e.key === "v") {
            navigator.clipboard.readText().then(t => api.term.write(id, t));
            return false;
        }
        return true;
    });
    const term = {
        id: id,
        xterm: xterm,
        fit: fit,
        el: box,
        name: ""
    };
    S.terms.push(term);
    xterm.onData(d => api.term.write(id, d));
    xterm.onResize(({cols: cols, rows: rows}) => api.term.resize(id, cols, rows));
    const name = await guard(() => api.term.create(id, cwd || S.root, xterm.cols, xterm.rows, profile?.shell || ""));
    term.name = (name || "terminal").replace(/\.exe$/i, "").toLowerCase();
    activateTerminal(id);
    return term;
}

function activateTerminal(id) {
    S.activeTerm = id;
    for (const t of S.terms) t.el.classList.toggle("hidden", t.id !== id);
    const cur = S.terms.find(x => x.id === id);
    const list = $("#term-list");
    list.classList.toggle("hidden", S.terms.length < 2);
    list.replaceChildren(...S.terms.map(t => {
        const e = el("div", "term-item" + (t.id === id ? " active" : ""));
        e.append(el("i", "codicon codicon-terminal"), el("span", null, t.name));
        const x = el("i", "codicon codicon-trash x");
        x.title = "Kill Terminal";
        x.onclick = ev => {
            ev.stopPropagation();
            killTerminal(t.id);
        };
        e.append(x);
        e.onclick = () => activateTerminal(t.id);
        return e;
    }));
    if (cur) {
        requestAnimationFrame(() => {
            cur.fit.fit();
            cur.xterm.focus();
        });
    }
}

async function killTerminal(id = S.activeTerm) {
    const t = S.terms.find(x => x.id === id);
    if (!t) return;
    await api.term.kill(id);
    removeTerminal(id);
}

function removeTerminal(id) {
    const i = S.terms.findIndex(x => x.id === id);
    if (i < 0) return;
    const [t] = S.terms.splice(i, 1);
    t.xterm.dispose();
    t.el.remove();
    if (S.terms.length) activateTerminal(S.terms[Math.max(0, i - 1)].id); else {
        $("#term-list").classList.add("hidden");
        if (panelView === "terminal") showPanel(false);
    }
}

api.term.onData((id, d) => S.terms.find(t => t.id === id)?.xterm.write(d));

api.term.onExit(id => removeTerminal(id));

let panelView = "terminal";

function showPanel(show) {
    $("#panel").classList.toggle("hidden", !show);
    $("#sash-panel").classList.toggle("hidden", !show);
    layout();
    if (!show) editor?.focus();
}

function showPanelView(name) {
    panelView = name;
    document.querySelectorAll(".panel-tab").forEach(t => t.classList.toggle("active", t.dataset.pview === name));
    document.querySelectorAll(".pview").forEach(v => v.classList.toggle("hidden", v.id !== "pview-" + name));
    document.querySelectorAll(".pa-group").forEach(g => g.classList.toggle("hidden", g.dataset.for !== name));
    if (name === "terminal") {
        renderProblems();
        const t = S.terms.find(x => x.id === S.activeTerm);
        if (t) requestAnimationFrame(() => (t.fit.fit(), t.xterm.focus()));
    }
    if (name === "output") renderOutput();
    if (name === "debug") $("#debug-input").focus();
}

async function openPanelView(name) {
    showPanel(true);
    if (name === "terminal" && !S.terms.length) return newTerminal();
    showPanelView(name);
}

async function toggleTerminal() {
    if ($("#panel").classList.contains("hidden") || panelView !== "terminal") {
        if (!S.terms.length) await newTerminal(); else {
            showPanel(true);
            showPanelView("terminal");
            activateTerminal(S.activeTerm);
        }
    } else showPanel(false);
}

function togglePanel() {
    if (!$("#panel").classList.contains("hidden")) return showPanel(false);
    if (panelView === "terminal") toggleTerminal(); else openPanelView(panelView);
}

function renderProblems() {
    const all = monaco.editor.getModelMarkers({}).filter(m => m.severity >= monaco.MarkerSeverity.Info);
    const badge = $("#problems-badge");
    badge.textContent = all.length;
    badge.classList.toggle("hidden", !all.length);
    const q = $("#problems-filter").value.trim().toLowerCase();
    const list = $("#problems-list");
    const byFile = new Map;
    for (const m of all) {
        const file = m.resource.scheme === "file" ? m.resource.fsPath : m.resource.toString();
        if (q && !(m.message.toLowerCase().includes(q) || file.toLowerCase().includes(q))) continue;
        if (!byFile.has(file)) byFile.set(file, []);
        byFile.get(file).push(m);
    }
    if (!byFile.size) {
        list.replaceChildren(el("div", "pb-empty", q ? "No results found with provided filter criteria." : "No problems have been detected in the workspace."));
        return;
    }
    const frag = document.createDocumentFragment();
    for (const [file, markers] of byFile) {
        const head = el("div", "pb-file");
        const items = el("div");
        const tw = el("i", "codicon codicon-chevron-down");
        head.append(tw, FileIcons.icon(P.basename(file), false), el("span", null, P.basename(file)), el("span", "dir", P.dirname(rel(file))), el("span", "count", markers.length));
        head.onclick = () => {
            items.classList.toggle("hidden");
            tw.className = "codicon codicon-chevron-" + (items.classList.contains("hidden") ? "right" : "down");
        };
        markers.sort((a, b) => b.severity - a.severity || a.startLineNumber - b.startLineNumber);
        for (const m of markers) {
            const sev = m.severity === monaco.MarkerSeverity.Error ? "error" : m.severity === monaco.MarkerSeverity.Warning ? "warning" : "info";
            const row = el("div", "pb-item");
            row.append(el("i", "codicon codicon-" + sev), el("span", null, m.message.split("\n")[0]), el("span", "src", `${m.source || m.owner || ""}${m.code ? `(${typeof m.code === "object" ? m.code.value : m.code})` : ""} [Ln ${m.startLineNumber}, Col ${m.startColumn}]`));
            row.onclick = () => openFile(file, {
                line: m.startLineNumber,
                col: m.startColumn,
                len: Math.max(0, m.endColumn - m.startColumn)
            });
            items.append(row);
        }
        frag.append(head, items);
    }
    list.replaceChildren(frag);
}

const output = {
    channels: {
        Codec: [],
        Tasks: []
    },
    lock: false
};

function logOutput(msg, channel = "Codec") {
    const d = new Date;
    const ts = `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, "0")}`;
    output.channels[channel].push(`${ts} [info] ${msg}`);
    if (panelView === "output") renderOutput();
}

function renderOutput() {
    const ch = $("#output-channel").value;
    const f = $("#output-filter").value.trim();
    let lines = output.channels[ch] || [];
    if (f) {
        const terms = f.split(",").map(x => x.trim()).filter(Boolean);
        lines = lines.filter(l => terms.every(t => t.startsWith("!") ? !l.toLowerCase().includes(t.slice(1).toLowerCase()) : l.toLowerCase().includes(t.toLowerCase())));
    }
    const out = $("#output-log");
    out.textContent = lines.join("\n");
    if (!output.lock) out.scrollTop = out.scrollHeight;
}

function debugLog(text, cls = "") {
    $("#debug-log").append(el("div", "dbg-line " + cls, text));
    $("#debug-log").scrollTop = $("#debug-log").scrollHeight;
}

function setupPanel() {
    document.querySelectorAll(".panel-tab").forEach(t => t.onclick = () => openPanelView(t.dataset.pview));
    $("#problems-filter").addEventListener("input", renderProblems);
    $("#problems-header").onclick = () => {
        const pane = $("#problems-pane");
        pane.classList.toggle("collapsed");
        $("#problems-header .codicon").className = "codicon codicon-chevron-" + (pane.classList.contains("collapsed") ? "right" : "down");
        layout();
    };
    $("#output-filter").addEventListener("input", renderOutput);
    $("#output-channel").onchange = renderOutput;
    $("#btn-output-clear").onclick = () => {
        output.channels[$("#output-channel").value] = [];
        renderOutput();
    };
    $("#btn-output-lock").onclick = e => {
        output.lock = !output.lock;
        e.currentTarget.classList.toggle("on", output.lock);
        e.currentTarget.firstChild.className = "codicon codicon-" + (output.lock ? "lock" : "unlock");
        e.currentTarget.title = output.lock ? "Turn Auto Scrolling On" : "Turn Auto Scrolling Off";
    };
    $("#btn-debug-clear").onclick = () => $("#debug-log").innerHTML = "";
    $("#debug-input").addEventListener("keydown", e => {
        if (e.key !== "Enter" || !e.target.value.trim()) return;
        debugLog("> " + e.target.value, "in");
        debugLog("Please start a debug session to evaluate expressions", "err");
        e.target.value = "";
    });
    $("#btn-term-new").onclick = () => newTerminal();
    $("#btn-term-profiles").onclick = async e => {
        const r = e.currentTarget.getBoundingClientRect();
        const profiles = await terminalProfiles();
        openMenu([ ...profiles.map(p => ({
            label: p.name,
            run: () => newTerminal(null, p)
        })), "-", {
            label: "Configure Terminal Settings",
            run: () => showSettings("terminal")
        } ], r.left, r.bottom + 2);
    };
    $("#btn-term-more").onclick = e => {
        const r = e.currentTarget.getBoundingClientRect();
        openMenu([ {
            label: "Clear Terminal",
            run: () => S.terms.find(t => t.id === S.activeTerm)?.xterm.clear()
        }, {
            label: "Run Active File",
            run: runActiveFile
        }, {
            label: "Run Selected Text",
            run: runSelection
        }, "-", {
            label: "Kill Terminal",
            run: () => killTerminal()
        }, {
            label: "Kill All Terminals",
            run: async () => {
                for (const t of [ ...S.terms ]) await killTerminal(t.id);
            }
        } ], r.right - 220, r.bottom + 2);
    };
    $("#btn-panel-more").onclick = e => {
        const r = e.currentTarget.getBoundingClientRect();
        openMenu([ {
            label: "Output",
            kb: "Ctrl+Shift+U",
            checked: panelView === "output",
            run: () => openPanelView("output")
        }, {
            label: "Debug Console",
            kb: "Ctrl+Shift+Y",
            checked: panelView === "debug",
            run: () => openPanelView("debug")
        }, {
            label: "Terminal",
            kb: "Ctrl+`",
            checked: panelView === "terminal",
            run: () => openPanelView("terminal")
        }, {
            label: "Ports",
            checked: panelView === "ports",
            run: () => openPanelView("ports")
        } ], r.right - 260, r.bottom + 2);
    };
    $("#btn-panel-close").onclick = () => showPanel(false);
    $("#btn-panel-max").onclick = () => {
        const p = $("#panel");
        const max = window.innerHeight - 140;
        p.style.height = (p.offsetHeight >= max - 5 ? 280 : max) + "px";
        $("#btn-panel-max .codicon").className = "codicon codicon-screen-" + (p.offsetHeight >= max - 5 ? "normal" : "full");
        layout();
    };
}

const RUNNABLE_EXTENSIONS = new Set([ "js", "mjs", "cjs", "ts", "jsx", "tsx", "py", "rb", "php", "go", "lua", "dart", "ps1", "sh", "bat", "cmd", "java", "html", "c", "cc", "cpp", "cxx", "cs", "rs", "swift", "kt", "kts", "r", "pl", "sql", "luau" ]);

const RUNNABLE_LANGUAGES = new Set([ "javascript", "typescript", "python", "ruby", "php", "go", "lua", "luau", "dart", "powershell", "shell", "bat", "java", "c", "cpp", "csharp", "rust", "swift", "kotlin", "r", "perl", "sql" ]);

const RUN_FILE_EXTENSION_BY_LANGUAGE = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    ruby: "rb",
    php: "php",
    go: "go",
    lua: "lua",
    luau: "luau",
    dart: "dart",
    powershell: "ps1",
    shell: "sh",
    bat: "bat",
    java: "java",
    c: "c",
    cpp: "cpp",
    csharp: "cs",
    rust: "rs",
    swift: "swift",
    kotlin: "kt",
    r: "r",
    perl: "pl",
    sql: "sql"
};

async function runActiveFile() {
    const t = currentTab();
    if (!t) return toast("No active file to run.");
    if (t.kind) return toast("Media files can't be run.");
    if (!t.path) {
        const extension = RUN_FILE_EXTENSION_BY_LANGUAGE[t.model?.getLanguageId()];
        if (!extension) return toast("Save this file with a supported file extension before running it.", true);
        if (!await saveTab(t, false, `${t.title}.${extension}`)) return;
    } else if (isDirty(t) && !await saveTab(t)) return;
    await saveAll();
    if (FileIcons.extOf(t.title) === "html" || FileIcons.extOf(t.title) === "htm") {
        const rootPath = projectRootForPage(t.path);
        const url = await guard(() => api.preview.open(rootPath, t.path, true));
        if (url) logOutput(`Opened in browser: ${url}`, "Tasks");
        return;
    }
    const q = shellQuote(t.path);
    const win = api.platform === "win32";
    const executable = name => P.join(P.dirname(t.path), `${name}${win ? ".exe" : ""}`);
    const compileAndRun = (compile, output, runTarget = shellQuote(output)) => win ? `${compile}; if ($LASTEXITCODE -eq 0) { & ${runTarget} }` : `${compile} && ${runTarget}`;
    const runners = {
        js: `node ${q}`,
        mjs: `node ${q}`,
        cjs: `node ${q}`,
        ts: `npx tsx ${q}`,
        jsx: `npx tsx ${q}`,
        tsx: `npx tsx ${q}`,
        py: `${win ? "python" : "python3"} ${q}`,
        rb: `ruby ${q}`,
        php: `php ${q}`,
        go: `go run ${q}`,
        lua: `lua ${q}`,
        luau: `luau ${q}`,
        dart: `dart run ${q}`,
        ps1: win ? `& ${q}` : `pwsh ${q}`,
        sh: `bash ${q}`,
        bat: `& ${q}`,
        cmd: `& ${q}`,
        java: `java ${q}`,
        c: compileAndRun(`gcc ${q} -o ${shellQuote(executable("codec-run"))}`, executable("codec-run")),
        cc: compileAndRun(`g++ ${q} -o ${shellQuote(executable("codec-run"))}`, executable("codec-run")),
        cpp: compileAndRun(`g++ ${q} -o ${shellQuote(executable("codec-run"))}`, executable("codec-run")),
        cxx: compileAndRun(`g++ ${q} -o ${shellQuote(executable("codec-run"))}`, executable("codec-run")),
        rs: compileAndRun(`rustc ${q} -o ${shellQuote(executable("codec-run"))}`, executable("codec-run")),
        cs: `dotnet run --project ${shellQuote(P.join(P.dirname(t.path), ""))}`,
        swift: `swift ${q}`,
        kt: compileAndRun(`kotlinc ${q} -include-runtime -d ${shellQuote(P.join(P.dirname(t.path), "codec-run.jar"))}`, P.join(P.dirname(t.path), "codec-run.jar"), `java -jar ${shellQuote(P.join(P.dirname(t.path), "codec-run.jar"))}`),
        kts: `kotlinc -script ${q}`,
        r: `Rscript ${q}`,
        pl: `perl ${q}`,
        sql: `sqlite3 ${shellQuote(P.join(P.dirname(t.path), "codec.db"))} < ${q}`
    };
    const cmd = runners[FileIcons.extOf(t.title)];
    if (!cmd) return toast(`Don't know how to run '.${FileIcons.extOf(t.title) || "?"}' files.`, true);
    let term = S.terms.find(x => x.id === S.activeTerm);
    if (!term) term = await newTerminal(); else {
        showPanel(true);
        showPanelView("terminal");
        activateTerminal(term.id);
    }
    logOutput(`Running: ${cmd}`, "Tasks");
    if (term) api.term.write(term.id, cmd + "\r");
}

function shellQuote(value) {
    const s = String(value);
    return api.platform === "win32" ? `'${s.replace(/'/g, "''")}'` : `'${s.replace(/'/g, "'\\''")}'`;
}

async function runSelection() {
    const sel = editor.getSelection();
    const text = sel && !sel.isEmpty() ? editor.getModel().getValueInRange(sel) : editor.getModel()?.getLineContent(editor.getPosition().lineNumber);
    if (!text) return;
    const term = S.terms.find(x => x.id === S.activeTerm) || await newTerminal();
    showPanel(true);
    showPanelView("terminal");
    activateTerminal(term.id);
    api.term.write(term.id, text + "\r");
}

const menuStack = [];

let menuBarOpen = false;

function closeMenus(depth = 0) {
    while (menuStack.length > depth) menuStack.pop().el.remove();
    if (depth === 0) {
        document.querySelectorAll(".menu-item.open").forEach(m => m.classList.remove("open"));
        menuBarOpen = false;
    }
}

function openMenu(items, x, y, {depth: depth = 0, parentItem: parentItem = null} = {}) {
    closeMenus(depth);
    if (typeof items === "function") items = items();
    const m = el("div", "menu");
    for (const it of items) {
        if (it === "-") {
            m.append(el("div", "ms"));
            continue;
        }
        const row = el("div", "mi" + (it.disabled ? " disabled" : ""));
        if (it.checked) row.append(el("i", "codicon codicon-check check"));
        row.append(el("span", "lbl", tr(it.label)));
        if (it.kb) row.append(el("span", "kb", it.kb));
        if (it.submenu) row.append(el("i", "codicon codicon-chevron-right sub"));
        let subTimer;
        row.onmouseenter = () => {
            m.querySelectorAll(".mi.hl").forEach(r => r.classList.remove("hl"));
            clearTimeout(subTimer);
            if (it.submenu && !it.disabled) {
                row.classList.add("hl");
                subTimer = setTimeout(() => {
                    const r = row.getBoundingClientRect();
                    openMenu(it.submenu, r.right + 2, r.top - 5, {
                        depth: depth + 1,
                        parentItem: row
                    });
                }, 120);
            } else if (menuStack.length > depth + 1) closeMenus(depth + 1);
        };
        row.onmouseleave = () => clearTimeout(subTimer);
        row.onmouseup = e => {
            if (it.disabled || it.submenu || e.button !== 0) return;
            closeMenus(0);
            if (it.run) guard(() => it.run());
        };
        m.append(row);
    }
    $("#menu-layer").append(m);
    const w = m.offsetWidth;
    const h = m.offsetHeight;
    let left = x;
    if (left + w > window.innerWidth - 4) left = depth && parentItem ? parentItem.getBoundingClientRect().left - w - 2 : window.innerWidth - w - 4;
    m.style.left = Math.max(4, left) + "px";
    m.style.top = Math.max(4, Math.min(y, window.innerHeight - h - 4)) + "px";
    menuStack.push({
        el: m
    });
    return m;
}

window.addEventListener("mousedown", e => {
    if (!e.target.closest(".menu") && !e.target.closest(".menu-item")) closeMenus(0);
});

window.addEventListener("blur", () => closeMenus(0));

async function recentMenu() {
    const st = await api.state.get();
    return [ ...(st.recent || []).map(p => ({
        label: p.replace(/^C:\\Users\\[^\\]+/i, "~"),
        run: () => openFolder(p)
    })), ...st.recent?.length ? [ "-" ] : [], {
        label: "Clear Recently Opened...",
        disabled: !st.recent?.length,
        run: () => api.state.set({
            recent: []
        }).then(renderWelcome)
    } ];
}

function themeMenu() {
    return [ {
        label: "Dark Modern",
        checked: settings.theme === "dark" || !settings.theme,
        run: () => setSetting("theme", "dark")
    }, {
        label: "Light Modern",
        checked: settings.theme === "light",
        run: () => setSetting("theme", "light")
    }, ...ExtUI.themeMenuItems() ];
}

function buildMenus(recent) {
    const t = currentTab();
    const cmd = id => () => runCommand(id);
    return {
        File: [ {
            label: "New Text File",
            kb: "Ctrl+N",
            run: cmd("file.new")
        }, {
            label: "New File...",
            kb: "Ctrl+Alt+Windows+N",
            run: cmd("file.newInExplorer")
        }, {
            label: "New Window",
            kb: "Ctrl+Shift+N",
            run: cmd("window.new")
        }, "-", {
            label: "Open File...",
            kb: "Ctrl+O",
            run: cmd("file.open")
        }, {
            label: "Open Folder...",
            kb: "Ctrl+K Ctrl+O",
            run: cmd("folder.open")
        }, {
            label: "Open Recent",
            submenu: recent
        }, "-", {
            label: "Save",
            kb: "Ctrl+S",
            disabled: !t,
            run: cmd("file.save")
        }, {
            label: "Save As...",
            kb: "Ctrl+Shift+S",
            disabled: !t,
            run: cmd("file.saveAs")
        }, {
            label: "Save All",
            kb: "Ctrl+K S",
            run: cmd("file.saveAll")
        }, "-", {
            label: "Auto Save",
            checked: settings.autoSave !== "off",
            run: cmd("toggle.autoSave")
        }, {
            label: "Preferences",
            submenu: [ {
                label: "Settings",
                kb: "Ctrl+,",
                run: () => showSettings()
            }, {
                label: "Keyboard Shortcuts",
                kb: "Ctrl+K Ctrl+S",
                run: () => openPalette(">")
            }, "-", {
                label: "Color Theme",
                submenu: themeMenu
            } ]
        }, "-", {
            label: "Revert File",
            disabled: !t?.path,
            run: cmd("file.revert")
        }, {
            label: "Close Editor",
            kb: "Ctrl+F4",
            disabled: !t,
            run: cmd("tab.close")
        }, {
            label: "Close Folder",
            kb: "Ctrl+K F",
            disabled: !S.root,
            run: cmd("folder.close")
        }, {
            label: "Close Window",
            kb: "Alt+F4",
            run: () => api.window.action("close")
        }, "-", {
            label: "Exit",
            run: () => api.window.action("close")
        } ],
        Edit: [ {
            label: "Undo",
            kb: "Ctrl+Z",
            run: cmd("edit.undo")
        }, {
            label: "Redo",
            kb: "Ctrl+Y",
            run: cmd("edit.redo")
        }, "-", {
            label: "Cut",
            kb: "Ctrl+X",
            run: cmd("edit.cut")
        }, {
            label: "Copy",
            kb: "Ctrl+C",
            run: cmd("edit.copy")
        }, {
            label: "Paste",
            kb: "Ctrl+V",
            run: cmd("edit.paste")
        }, "-", {
            label: "Find",
            kb: "Ctrl+F",
            run: cmd("edit.find")
        }, {
            label: "Replace",
            kb: "Ctrl+H",
            run: cmd("edit.replace")
        }, "-", {
            label: "Find in Files",
            kb: "Ctrl+Shift+F",
            run: cmd("view.search")
        }, {
            label: "Replace in Files",
            kb: "Ctrl+Shift+H",
            run: cmd("view.replace")
        }, "-", {
            label: "Toggle Line Comment",
            kb: "Ctrl+/",
            run: cmd("edit.comment")
        }, {
            label: "Toggle Block Comment",
            kb: "Shift+Alt+A",
            run: cmd("edit.blockComment")
        }, {
            label: "Format Document",
            kb: "Shift+Alt+F",
            run: cmd("edit.format")
        } ],
        Selection: [ {
            label: "Select All",
            kb: "Ctrl+A",
            run: cmd("sel.all")
        }, {
            label: "Expand Selection",
            kb: "Shift+Alt+RightArrow",
            run: cmd("sel.expand")
        }, {
            label: "Shrink Selection",
            kb: "Shift+Alt+LeftArrow",
            run: cmd("sel.shrink")
        }, "-", {
            label: "Copy Line Up",
            kb: "Shift+Alt+UpArrow",
            run: cmd("sel.copyUp")
        }, {
            label: "Copy Line Down",
            kb: "Shift+Alt+DownArrow",
            run: cmd("sel.copyDown")
        }, {
            label: "Move Line Up",
            kb: "Alt+UpArrow",
            run: cmd("sel.moveUp")
        }, {
            label: "Move Line Down",
            kb: "Alt+DownArrow",
            run: cmd("sel.moveDown")
        }, {
            label: "Duplicate Selection",
            run: cmd("sel.duplicate")
        }, "-", {
            label: "Add Cursor Above",
            kb: "Ctrl+Alt+UpArrow",
            run: cmd("sel.cursorUp")
        }, {
            label: "Add Cursor Below",
            kb: "Ctrl+Alt+DownArrow",
            run: cmd("sel.cursorDown")
        }, {
            label: "Add Next Occurrence",
            kb: "Ctrl+D",
            run: cmd("sel.nextMatch")
        }, {
            label: "Select All Occurrences",
            kb: "Ctrl+Shift+L",
            run: cmd("sel.allMatches")
        } ],
        View: [ {
            label: "Command Palette...",
            kb: "Ctrl+Shift+P",
            run: cmd("palette.commands")
        }, "-", {
            label: "Appearance",
            submenu: [ {
                label: "Full Screen",
                kb: "F11",
                run: cmd("window.fullscreen")
            }, "-", {
                label: "Primary Side Bar",
                kb: "Ctrl+B",
                checked: !$("#sidebar").classList.contains("collapsed"),
                run: cmd("view.toggleSidebar")
            }, {
                label: "Status Bar",
                checked: !!settings.statusBar,
                run: cmd("toggle.statusBar")
            }, {
                label: "Panel",
                kb: "Ctrl+J",
                checked: !$("#panel").classList.contains("hidden"),
                run: cmd("view.togglePanel")
            }, "-", {
                label: "Minimap",
                checked: !!settings.minimap,
                run: cmd("toggle.minimap")
            }, {
                label: "Breadcrumbs",
                checked: settings.breadcrumbs !== false,
                run: cmd("toggle.breadcrumbs")
            }, {
                label: "Sticky Scroll",
                checked: !!settings.stickyScroll,
                run: () => setSetting("stickyScroll", !settings.stickyScroll)
            }, "-", {
                label: "Zoom In",
                kb: "Ctrl+=",
                run: cmd("zoom.in")
            }, {
                label: "Zoom Out",
                kb: "Ctrl+-",
                run: cmd("zoom.out")
            }, {
                label: "Reset Zoom",
                kb: "Ctrl+NumPad0",
                run: cmd("zoom.reset")
            } ]
        }, "-", {
            label: "Explorer",
            kb: "Ctrl+Shift+E",
            run: cmd("view.explorer")
        }, {
            label: "Search",
            kb: "Ctrl+Shift+F",
            run: cmd("view.search")
        }, {
            label: "Extensions",
            kb: "Ctrl+Shift+X",
            run: cmd("view.extensions")
        }, "-", {
            label: "Problems",
            kb: "Ctrl+Shift+M",
            run: cmd("view.problems")
        }, {
            label: "Output",
            kb: "Ctrl+Shift+U",
            run: cmd("view.output")
        }, {
            label: "Debug Console",
            kb: "Ctrl+Shift+Y",
            run: cmd("view.debugConsole")
        }, {
            label: "Terminal",
            kb: "Ctrl+`",
            run: cmd("terminal.toggle")
        }, "-", {
            label: "Word Wrap",
            kb: "Alt+Z",
            checked: settings.wordWrap === "on",
            run: cmd("toggle.wordWrap")
        } ],
        Go: [ {
            label: "Back",
            kb: "Alt+LeftArrow",
            disabled: nav.index <= 0,
            run: cmd("nav.back")
        }, {
            label: "Forward",
            kb: "Alt+RightArrow",
            disabled: nav.index >= nav.stack.length - 1,
            run: cmd("nav.forward")
        }, "-", {
            label: "Switch Editor",
            disabled: !S.tabs.length,
            submenu: () => S.tabs.map(x => ({
                label: x.title,
                checked: x.id === S.active,
                run: () => activateTab(x.id)
            }))
        }, "-", {
            label: "Go to File...",
            kb: "Ctrl+P",
            run: cmd("palette.files")
        }, {
            label: "Go to Symbol in Editor...",
            kb: "Ctrl+Shift+O",
            run: cmd("edit.gotoSymbol")
        }, "-", {
            label: "Go to Definition",
            kb: "F12",
            run: cmd("edit.gotoDef")
        }, {
            label: "Go to Line/Column...",
            kb: "Ctrl+G",
            run: cmd("edit.gotoLine")
        }, {
            label: "Go to Bracket",
            kb: "Ctrl+Shift+\\",
            run: cmd("edit.gotoBracket")
        } ],
        Run: [ {
            label: "Start Debugging",
            kb: "F5",
            run: cmd("terminal.runFile")
        }, {
            label: "Run Without Debugging",
            kb: "Ctrl+F5",
            run: cmd("terminal.runFile")
        } ],
        Terminal: [ {
            label: "New Terminal",
            kb: "Ctrl+Shift+`",
            run: cmd("terminal.new")
        }, "-", {
            label: "Run Active File",
            run: cmd("terminal.runFile")
        }, {
            label: "Run Selected Text",
            run: cmd("terminal.runSelection")
        }, "-", {
            label: "Kill Terminal",
            disabled: !S.terms.length,
            run: cmd("terminal.kill")
        } ],
        Help: [ {
            label: "Welcome",
            run: cmd("help.welcome")
        }, {
            label: "Show All Commands",
            kb: "Ctrl+Shift+P",
            run: cmd("palette.commands")
        }, "-", {
            label: "Toggle Developer Tools",
            kb: "Ctrl+Shift+I",
            run: cmd("window.devtools")
        }, {
            label: "Reload Window",
            kb: "Ctrl+R",
            run: cmd("window.reload")
        }, "-", {
            label: "Codec Community (Discord)",
            run: () => window.open("https://discord.gg/3QAhQcz6aC")
        }, "-", {
            label: "View License",
            run: () => api.openDoc("LICENSE.txt")
        }, {
            label: "Third-Party Notices",
            run: () => api.openDoc("THIRD_PARTY_NOTICES.txt")
        }, "-", {
            label: "About",
            run: showAbout
        } ]
    };
}

async function showAbout() {
    const i = await api.window.info();
    const {response: response} = await api.dialog.message({
        type: "info",
        title: "Codec",
        message: "Codec",
        detail: `Version: ${i.version}\nElectron: ${i.electron}\nChromium: ${i.chrome}\nNode.js: ${i.node}\nOS: ${i.os}\n\nCopyright © 2026 KyleZ. All rights reserved.\nDistribution without written permission is prohibited.`,
        buttons: [ "OK", "View License", "Third-Party Notices" ]
    });
    if (response === 1) api.openDoc("LICENSE.txt");
    if (response === 2) api.openDoc("THIRD_PARTY_NOTICES.txt");
}

function setupMenubar() {
    const bar = $("#menubar");
    const open = async (item, names) => {
        const menus = buildMenus(await recentMenu());
        const r = item.getBoundingClientRect();
        const items = names.length === 1 ? menus[names[0]] : names.map(n => ({
            label: n,
            submenu: menus[n]
        }));
        openMenu(items, r.left, r.bottom + 2);
        bar.querySelectorAll(".menu-item").forEach(m => m.classList.toggle("open", m === item));
        menuBarOpen = true;
    };
    const add = (label, names, cls = "") => {
        const item = el("div", "menu-item " + cls, label);
        item.onmousedown = e => {
            e.preventDefault();
            if (item.classList.contains("open")) return closeMenus(0);
            open(item, names);
        };
        item.onmouseenter = () => menuBarOpen && !item.classList.contains("open") && open(item, names);
        bar.append(item);
    };
    for (const n of [ "File", "Edit", "Selection", "View", "Go", "Run" ]) add(n, [ n ]);
    add("···", [ "Terminal", "Help" ], "more");
}

function fuzzy(query, text) {
    if (!query) return {
        score: 0,
        html: esc(text)
    };
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    let qi = 0;
    let score = 0;
    let last = -2;
    const marks = [];
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) {
            marks.push(i);
            score += i === last + 1 ? 5 : 1;
            if (i === 0 || "/\\._- ".includes(text[i - 1])) score += 3;
            last = i;
            qi++;
        }
    }
    if (qi < q.length) return null;
    const set = new Set(marks);
    let html = "";
    for (let i = 0; i < text.length; i++) html += set.has(i) ? `<b>${esc(text[i])}</b>` : esc(text[i]);
    return {
        score: score - text.length * .01,
        html: html
    };
}

const palette = {
    items: [],
    sel: 0,
    languageMode: false
};

const QUICK_PLACEHOLDER = "Search files by name (append : to go to line or @ to go to symbol)";

async function openPalette(prefix = "") {
    closeMenus(0);
    const pal = $("#palette");
    pal.classList.remove("hidden");
    const cc = $("#command-center");
    const r = cc.offsetParent ? cc.getBoundingClientRect() : null;
    const width = Math.max(r ? r.width + 12 : 600, 500);
    const left = r ? r.left + r.width / 2 - width / 2 : (window.innerWidth - width) / 2;
    pal.style.width = width + "px";
    pal.style.left = Math.max(6, Math.min(left, window.innerWidth - width - 6)) + "px";
    pal.style.top = (r ? r.top - 6 : 4) + "px";
    const input = $("#palette-input");
    input.value = prefix;
    input.placeholder = prefix === ">" ? "" : QUICK_PLACEHOLDER;
    input.focus();
    if (!prefix.startsWith(">") && !prefix.startsWith(":") && S.root && !S.fileList) S.fileList = await api.fs.listFiles(S.root);
    updatePalette();
}

function closePalette() {
    $("#palette").classList.add("hidden");
    editor?.focus();
}

function setPaletteValue(v) {
    const input = $("#palette-input");
    input.value = v;
    input.focus();
    updatePalette();
}

function fileItem(f, html, extra = {}) {
    const r = rel(f);
    const dir = P.dirname(r);
    return {
        html: html ?? esc(P.basename(f)),
        detail: dir === "." ? "" : dir,
        icon: P.basename(f),
        run: () => openFile(f),
        ...extra
    };
}

function updatePalette() {
    const v = $("#palette-input").value;
    let items = [];
    if (v.startsWith(">")) {
        const q = v.slice(1).trim();
        items = COMMANDS.filter(c => c.label).map(c => ({
            ...fuzzy(q, c.label),
            c: c
        })).filter(x => x.html != null).sort((a, b) => b.score - a.score).map(x => ({
            html: x.html,
            kb: x.c.kb,
            run: () => runCommand(x.c.id)
        }));
        if (!items.length) items = [ {
            html: "No matching commands",
            run: () => {}
        } ];
    } else if (v.startsWith(":")) {
        const n = parseInt(v.slice(1));
        const max = editor?.getModel()?.getLineCount() || 0;
        items = [ {
            html: n ? `Go to line ${n}.` : `Current Line: ${editor?.getPosition()?.lineNumber || 1}. Type a line number between 1 and ${max} to navigate to.`,
            run: () => n && gotoLine(n)
        } ];
    } else if (v.startsWith("@")) {
        items = [ {
            html: editor?.getModel() ? "Go to Symbol in Editor..." : "To go to a symbol, first open a text editor with symbol information.",
            run: () => runCommand("edit.gotoSymbol")
        } ];
    } else if (v.startsWith("%")) {
        const q = v.slice(1).trim();
        items = [ {
            html: q ? `Search for '${esc(q)}' in files` : "Type text to search for in files",
            run: () => {
                if (!q) return;
                showView("search", true);
                $("#search-input").value = q;
                runSearch();
            }
        } ];
    } else if (v.startsWith("?")) {
        items = [ {
            html: "Go to File",
            hint: "…",
            run: () => setPaletteValue("")
        }, {
            html: "Show and Run Commands",
            hint: ">",
            run: () => setPaletteValue(">")
        }, {
            html: "Go to Line/Column",
            hint: ":",
            run: () => setPaletteValue(":")
        }, {
            html: "Go to Symbol in Editor",
            hint: "@",
            run: () => setPaletteValue("@")
        }, {
            html: "Search for Text",
            hint: "%",
            run: () => setPaletteValue("%")
        } ];
    } else if (palette.languageMode) {
        items = monaco.languages.getLanguages().map(l => ({
            ...fuzzy(v, l.aliases?.[0] || l.id),
            l: l
        })).filter(x => x.html != null).sort((a, b) => b.score - a.score).map(x => ({
            html: x.html,
            detail: x.l.id,
            run: () => setLanguage(x.l.id)
        }));
    } else if (!v.trim()) {
        items = [ {
            html: "Go to File",
            kb: "Ctrl+P",
            run: () => setPaletteValue(""),
            keepOpen: true
        }, {
            html: "Show and Run Commands",
            prefixHint: ">",
            kb: "Ctrl+Shift+P",
            run: () => setPaletteValue(">"),
            keepOpen: true
        }, {
            html: "Search for Text",
            prefixHint: "%",
            run: () => setPaletteValue("%"),
            keepOpen: true
        }, {
            html: "Go to Line/Column",
            prefixHint: ":",
            kb: "Ctrl+G",
            run: () => setPaletteValue(":"),
            keepOpen: true
        }, {
            html: "Go to Symbol in Editor",
            prefixHint: "@",
            kb: "Ctrl+Shift+O",
            run: () => runCommand("edit.gotoSymbol")
        }, {
            html: "Start Debugging",
            prefixHint: "debug",
            kb: "F5",
            run: () => runCommand("terminal.runFile")
        }, {
            html: "More",
            prefixHint: "?",
            run: () => setPaletteValue("?"),
            keepOpen: true
        } ];
        const recent = S.recentFiles.filter(f => !S.root || f.startsWith(S.root)).slice(0, 20);
        recent.forEach((f, i) => items.push(fileItem(f, null, i === 0 ? {
            sep: true,
            hint: "recently opened"
        } : {})));
    } else if (!S.root) {
        items = [ {
            html: "Open a folder to search files by name",
            run: () => runCommand("folder.open")
        } ];
    } else {
        const scored = [];
        for (const f of S.fileList || []) {
            const r = rel(f);
            const m = fuzzy(v, P.basename(f));
            const m2 = m ? null : fuzzy(v, r);
            if (m || m2) scored.push({
                html: m ? m.html : esc(P.basename(f)),
                score: (m ? m.score + 10 : m2.score) + (S.recentFiles.includes(f) ? 5 : 0),
                f: f
            });
            if (scored.length > 3e3) break;
        }
        scored.sort((a, b) => b.score - a.score);
        items = scored.slice(0, 60).map(x => fileItem(x.f, x.html));
        if (!items.length) items = [ {
            html: "No matching results",
            run: () => {}
        } ];
    }
    palette.items = items;
    palette.sel = 0;
    renderPalette();
}

function renderPalette() {
    $("#palette-list").replaceChildren(...palette.items.flatMap((it, i) => {
        const out = [];
        if (it.sep) out.push(el("div", "pal-sep"));
        const e = el("div", "pal-item" + (i === palette.sel ? " sel" : ""));
        if (it.icon) e.append(FileIcons.icon(it.icon, false));
        const label = el("span", "pal-label");
        label.innerHTML = it.html;
        e.append(label);
        if (it.prefixHint) e.append(el("span", "pal-prefix", it.prefixHint));
        if (it.detail) e.append(el("span", "detail", it.detail));
        const right = el("span", "pal-right");
        if (it.hint) right.append(el("span", "pal-hint", it.hint));
        if (it.kb) {
            const kb = el("span", "kb");
            kb.innerHTML = it.kb.split(" ").map(chord => chord.split("+").map(k => `<kbd>${esc(k)}</kbd>`).join("+")).join(" ");
            right.append(kb);
        }
        e.append(right);
        e.onmousedown = ev => {
            ev.preventDefault();
            choosePalette(i);
        };
        e.onmousemove = () => {
            if (palette.sel === i) return;
            palette.sel = i;
            document.querySelectorAll("#palette-list .pal-item").forEach((n, j) => n.classList.toggle("sel", j === i));
        };
        out.push(e);
        return out;
    }));
    $("#palette-list .sel")?.scrollIntoView({
        block: "nearest"
    });
}

function choosePalette(i) {
    const it = palette.items[i];
    if (it?.keepOpen) return it.run();
    palette.languageMode = false;
    closePalette();
    it?.run();
}

function setupPalette() {
    const input = $("#palette-input");
    input.addEventListener("input", updatePalette);
    input.addEventListener("keydown", e => {
        if (e.key === "ArrowDown") palette.sel = Math.min(palette.sel + 1, palette.items.length - 1); else if (e.key === "ArrowUp") palette.sel = Math.max(palette.sel - 1, 0); else if (e.key === "Enter") return choosePalette(palette.sel); else if (e.key === "Escape") {
            palette.languageMode = false;
            return closePalette();
        } else return;
        e.preventDefault();
        renderPalette();
    });
    input.addEventListener("blur", () => setTimeout(() => !$("#palette").contains(document.activeElement) && $("#palette").classList.add("hidden"), 100));
}

function gotoLine(n) {
    if (!editor.getModel()) return;
    editor.setPosition({
        lineNumber: n,
        column: 1
    });
    editor.revealLineInCenter(n);
    editor.focus();
}

function setLanguage(id) {
    const t = currentTab();
    if (t?.model) monaco.editor.setModelLanguage(t.model, id);
    updateStatus();
}

const SETTINGS_SCHEMA = [ {
    key: "language",
    group: "Language",
    cat: "Language",
    title: "Display Language",
    desc: "Choose the language used by the Codec interface.",
    type: "enum",
    options: LANGUAGE_OPTIONS
}, {
    key: "fontSize",
    group: "Text Editor",
    sub: "Font",
    cat: "Editor",
    title: "Font Size",
    desc: "Controls the font size in pixels.",
    type: "number",
    common: true
}, {
    key: "fontFamily",
    group: "Text Editor",
    sub: "Font",
    cat: "Editor",
    title: "Font Family",
    desc: "Controls the font family.",
    type: "text",
    common: true
}, {
    key: "fontLigatures",
    group: "Text Editor",
    sub: "Font",
    cat: "Editor",
    title: "Font Ligatures",
    desc: "Configures font ligatures (e.g. => and !== drawn as a single glyph). Requires a font with ligatures, such as Cascadia Code or Fira Code.",
    type: "bool"
}, {
    key: "tabSize",
    group: "Text Editor",
    cat: "Editor",
    title: "Tab Size",
    desc: "The number of spaces a tab is equal to.",
    type: "number",
    common: true
}, {
    key: "insertSpaces",
    group: "Text Editor",
    cat: "Editor",
    title: "Insert Spaces",
    desc: "Insert spaces when pressing `Tab`.",
    type: "bool"
}, {
    key: "wordWrap",
    group: "Text Editor",
    cat: "Editor",
    title: "Word Wrap",
    desc: "Controls how lines should wrap.",
    type: "enum",
    options: [ [ "off", "off" ], [ "on", "on" ], [ "bounded", "bounded" ] ],
    common: true
}, {
    key: "lineNumbers",
    group: "Text Editor",
    cat: "Editor",
    title: "Line Numbers",
    desc: "Controls the display of line numbers.",
    type: "enum",
    options: [ [ "on", "on" ], [ "off", "off" ], [ "relative", "relative" ] ]
}, {
    key: "renderWhitespace",
    group: "Text Editor",
    cat: "Editor",
    title: "Render Whitespace",
    desc: "Controls how the editor should render whitespace characters.",
    type: "enum",
    options: [ [ "none", "none" ], [ "boundary", "boundary" ], [ "selection", "selection" ], [ "trailing", "trailing" ], [ "all", "all" ] ]
}, {
    key: "renderLineHighlight",
    group: "Text Editor",
    cat: "Editor",
    title: "Render Line Highlight",
    desc: "Controls how the editor should render the current line highlight.",
    type: "enum",
    options: [ [ "none", "none" ], [ "gutter", "gutter" ], [ "line", "line" ], [ "all", "all" ] ]
}, {
    key: "cursorStyle",
    group: "Text Editor",
    sub: "Cursor",
    cat: "Editor",
    title: "Cursor Style",
    desc: "Controls the cursor style in insert input mode.",
    type: "enum",
    options: [ [ "line", "line" ], [ "block", "block" ], [ "underline", "underline" ], [ "line-thin", "line-thin" ], [ "block-outline", "block-outline" ], [ "underline-thin", "underline-thin" ] ]
}, {
    key: "cursorBlinking",
    group: "Text Editor",
    sub: "Cursor",
    cat: "Editor",
    title: "Cursor Blinking",
    desc: "Control the cursor animation style.",
    type: "enum",
    options: [ [ "blink", "blink" ], [ "smooth", "smooth" ], [ "phase", "phase" ], [ "expand", "expand" ], [ "solid", "solid" ] ]
}, {
    key: "smoothScrolling",
    group: "Text Editor",
    cat: "Editor",
    title: "Smooth Scrolling",
    desc: "Controls whether the editor will scroll using an animation.",
    type: "bool"
}, {
    key: "mouseWheelZoom",
    group: "Text Editor",
    cat: "Editor",
    title: "Mouse Wheel Zoom",
    desc: "Zoom the font of the editor when using mouse wheel and holding `Ctrl`.",
    type: "bool"
}, {
    key: "minimap",
    group: "Text Editor",
    sub: "Minimap",
    cat: "Editor › Minimap",
    title: "Enabled",
    desc: "Controls whether the minimap is shown.",
    type: "bool"
}, {
    key: "bracketPairs",
    group: "Text Editor",
    cat: "Editor › Bracket Pair Colorization",
    title: "Enabled",
    desc: "Controls whether bracket pair colorization is enabled or not.",
    type: "bool"
}, {
    key: "stickyScroll",
    group: "Text Editor",
    cat: "Editor › Sticky Scroll",
    title: "Enabled",
    desc: "Shows the nested current scopes during the scroll at the top of the editor.",
    type: "bool"
}, {
    key: "formatOnSave",
    group: "Text Editor",
    sub: "Formatting",
    cat: "Editor",
    title: "Format On Save",
    desc: "Format a file on save. A formatter must be available (JavaScript, TypeScript, JSON, CSS and HTML) and the editor must not be shutting down.",
    type: "bool",
    common: true
}, {
    key: "autoSave",
    group: "Text Editor",
    sub: "Files",
    cat: "Files",
    title: "Auto Save",
    desc: "Controls auto save of editors that have unsaved changes.",
    type: "enum",
    options: [ [ "off", "off" ], [ "afterDelay", "afterDelay" ], [ "onFocusChange", "onFocusChange" ] ],
    common: true
}, {
    key: "autoSaveDelay",
    group: "Text Editor",
    sub: "Files",
    cat: "Files",
    title: "Auto Save Delay",
    desc: "Controls the delay in milliseconds after which an editor with unsaved changes is saved automatically. Only applies when `Files: Auto Save` is set to `afterDelay`.",
    type: "number"
}, {
    key: "trimTrailingWhitespace",
    group: "Text Editor",
    sub: "Files",
    cat: "Files",
    title: "Trim Trailing Whitespace",
    desc: "When enabled, will trim trailing whitespace when saving a file.",
    type: "bool"
}, {
    key: "insertFinalNewline",
    group: "Text Editor",
    sub: "Files",
    cat: "Files",
    title: "Insert Final Newline",
    desc: "When enabled, insert a final new line at the end of the file when saving it.",
    type: "bool"
}, {
    key: "theme",
    group: "Workbench",
    cat: "Workbench",
    title: "Color Theme",
    desc: "Specifies the color theme used in the workbench. Themes from installed extensions are listed too.",
    type: "enum",
    options: () => ExtUI.themeOptions(),
    common: true
}, {
    key: "statusBar",
    group: "Workbench",
    cat: "Workbench › Status Bar",
    title: "Visible",
    desc: "Controls the visibility of the status bar at the bottom of the workbench.",
    type: "bool"
}, {
    key: "breadcrumbs",
    group: "Workbench",
    cat: "Breadcrumbs",
    title: "Enabled",
    desc: "Enable/disable navigation breadcrumbs.",
    type: "bool"
}, {
    key: "commandCenter",
    group: "Window",
    cat: "Window",
    title: "Command Center",
    desc: "Show command launcher together with the window title.",
    type: "bool"
}, {
    key: "restoreFolder",
    group: "Window",
    cat: "Window",
    title: "Restore Windows",
    desc: "Reopen the last folder and its editors after a restart.",
    type: "bool"
}, {
    key: "compactFolders",
    group: "Features",
    sub: "Explorer",
    cat: "Explorer",
    title: "Compact Folders",
    desc: "Controls whether the Explorer should render folders in a compact form. In such a form, single child folders will be compressed in a combined tree element.",
    type: "bool"
}, {
    key: "terminalShell",
    group: "Features",
    sub: "Terminal",
    cat: "Terminal › Integrated",
    title: "Default Profile: Windows",
    desc: "The shell used by new terminals. Empty = PowerShell. Examples: `cmd.exe`, `pwsh.exe`, `C:\\Program Files\\Git\\bin\\bash.exe`.",
    type: "text"
}, {
    key: "terminalFontSize",
    group: "Features",
    sub: "Terminal",
    cat: "Terminal › Integrated",
    title: "Font Size",
    desc: "Controls the font size in pixels of the terminal.",
    type: "number"
}, {
    key: "terminalLineHeight",
    group: "Features",
    sub: "Terminal",
    cat: "Terminal › Integrated",
    title: "Line Height",
    desc: "Controls the line height of the terminal, this number is multiplied by the terminal font size to get the actual line-height in pixels.",
    type: "number",
    step: .1
}, {
    key: "terminalCursorStyle",
    group: "Features",
    sub: "Terminal",
    cat: "Terminal › Integrated",
    title: "Cursor Style",
    desc: "Controls the style of terminal cursor when the terminal is focused.",
    type: "enum",
    options: [ [ "block", "block" ], [ "underline", "underline" ], [ "bar", "line" ] ]
}, {
    key: "terminalCursorBlink",
    group: "Features",
    sub: "Terminal",
    cat: "Terminal › Integrated",
    title: "Cursor Blinking",
    desc: "Controls whether the terminal cursor blinks.",
    type: "bool"
} ];

const SETTINGS_GROUPS = [ "Commonly Used", "Language", "Text Editor", "Workbench", "Window", "Features" ];

function descHtml(text) {
    return esc(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function settingControl(def) {
    const value = settings[def.key];
    if (def.type === "bool") {
        const lab = el("label", "sm-check");
        const cb = el("input");
        cb.type = "checkbox";
        cb.checked = !!value;
        cb.onchange = () => setSetting(def.key, cb.checked);
        const d = el("span");
        d.innerHTML = descHtml(tr(def.desc));
        lab.append(cb, d);
        return lab;
    }
    if (def.type === "enum") {
        const sel = el("select");
        for (const [v, l] of typeof def.options === "function" ? def.options() : def.options) {
            const o = el("option", null, l);
            o.value = v;
            sel.append(o);
        }
        sel.value = value;
        sel.onchange = () => setSetting(def.key, sel.value);
        return sel;
    }
    const input = el("input");
    input.type = def.type === "number" ? "number" : "text";
    if (def.step) input.step = def.step;
    input.value = value ?? "";
    input.spellcheck = false;
    input.onchange = () => setSetting(def.key, def.type === "number" ? Number(input.value) || settingsDefaults[def.key] : input.value);
    return input;
}

function settingItem(def) {
    const item = el("div", "sm-item");
    item.dataset.key = def.key;
    const modified = JSON.stringify(settings[def.key]) !== JSON.stringify(settingsDefaults[def.key]);
    item.classList.toggle("modified", modified);
    const label = el("div", "sm-label");
    label.innerHTML = `<span class="cat">${esc(tr(def.cat))}: </span><b>${esc(tr(def.title))}</b>${modified ? '<span class="mod">Modified</span>' : ""}`;
    item.append(label);
    if (def.type !== "bool") {
        const d = el("div", "sm-desc");
        d.innerHTML = descHtml(tr(def.desc));
        item.append(d);
    }
    item.append(settingControl(def));
    item.oncontextmenu = e => {
        e.preventDefault();
        openMenu([ {
            label: "Reset Setting",
            run: () => setSetting(def.key, settingsDefaults[def.key])
        }, {
            label: "Copy Setting ID",
            run: () => navigator.clipboard.writeText(def.key)
        } ], e.clientX, e.clientY);
    };
    return item;
}

let settingsGroup = "Commonly Used";

let settingsSub = null;

const tocExpanded = new Set([ "Text Editor" ]);

function groupSubs(g) {
    return [ ...new Set(SETTINGS_SCHEMA.filter(d => d.group === g && d.sub).map(d => d.sub)) ];
}

function renderSettings(scrollToSub = false) {
    const q = $("#sm-search").value.trim().toLowerCase();
    const content = $("#sm-content");
    const scroll = content.scrollTop;
    const matches = d => !q || [ d.title, d.desc, d.cat, d.key, d.group, d.sub || "" ].join(" ").toLowerCase().includes(q);
    const toc = [];
    for (const g of SETTINGS_GROUPS) {
        const subs = g === "Commonly Used" ? [] : groupSubs(g);
        const open = tocExpanded.has(g);
        const it = el("div", "toc-item" + (!q && g === settingsGroup && !settingsSub ? " active" : ""));
        const tw = el("i", subs.length ? `codicon codicon-chevron-${open ? "down" : "right"}` : "codicon");
        tw.onclick = e => {
            e.stopPropagation();
            open ? tocExpanded.delete(g) : tocExpanded.add(g);
            renderSettings();
        };
        it.append(tw, el("span", null, tr(g)));
        it.onclick = () => {
            $("#sm-search").value = "";
            settingsGroup = g;
            settingsSub = null;
            if (subs.length) tocExpanded.add(g);
            renderSettings();
            content.scrollTop = 0;
        };
        toc.push(it);
        if (open) for (const sub of subs) {
            const c = el("div", "toc-item child" + (!q && g === settingsGroup && sub === settingsSub ? " active" : ""), tr(sub));
            c.onclick = () => {
                $("#sm-search").value = "";
                settingsGroup = g;
                settingsSub = sub;
                renderSettings(true);
            };
            toc.push(c);
        }
    }
    $("#sm-toc").replaceChildren(...toc);
    const frag = document.createDocumentFragment();
    if (q) {
        const found = SETTINGS_SCHEMA.filter(matches);
        $("#sm-count").textContent = found.length ? `${found.length} ${tr(found.length > 1 ? "SettingsCount" : "SettingCount")} ${tr("Found")}` : tr("No Settings Found");
        if (!found.length) frag.append(el("div", "sm-empty", tr("No Settings Found")));
        for (const d of found) frag.append(settingItem(d));
    } else {
        $("#sm-count").textContent = "";
        let list;
        if (settingsGroup === "Commonly Used") list = SETTINGS_SCHEMA.filter(d => d.common); else if (settingsSub) list = SETTINGS_SCHEMA.filter(d => d.group === settingsGroup && d.sub === settingsSub); else {
            list = SETTINGS_SCHEMA.filter(d => d.group === settingsGroup && !d.sub);
            if (!list.length && groupSubs(settingsGroup).length) {
                settingsSub = groupSubs(settingsGroup)[0];
                return renderSettings();
            }
        }
        frag.append(el("div", "sm-group-title", tr(settingsSub || settingsGroup)));
        for (const d of list) frag.append(settingItem(d));
    }
    content.replaceChildren(frag);
    content.scrollTop = scrollToSub ? 0 : scroll;
}

async function showSettings(query = "") {
    closeMenus(0);
    settingsDefaults = await api.settings.defaults();
    $("#settings-modal").classList.remove("hidden");
    $("#sm-search").value = query;
    renderSettings();
    $("#sm-search").focus();
}

function hideSettings() {
    $("#settings-modal").classList.add("hidden");
}

function setupSettingsModal() {
    $("#sm-close").onclick = hideSettings;
    $("#settings-modal").addEventListener("mousedown", e => e.target.id === "settings-modal" && hideSettings());
    $("#sm-search").addEventListener("input", renderSettings);
    $("#sm-open-json").onclick = async () => {
        hideSettings();
        await openFile(await api.settings.path());
    };
    $("#sm-reset-all").onclick = async () => {
        const {response: response} = await api.dialog.message({
            type: "warning",
            buttons: [ "Reset", "Cancel" ],
            cancelId: 1,
            message: "Reset all settings to their default values?"
        });
        if (response !== 0) return;
        settings = {
            ...settingsDefaults
        };
        applySettings();
        await api.settings.set(settings);
        renderSettings();
    };
}

async function renderWelcome() {
    const st = await api.state.get();
    const list = $("#recent-list");
    list.replaceChildren(...(st.recent || []).slice(0, 6).map(p => {
        const row = el("div", "recent-row");
        const a = el("a");
        a.href = "#";
        a.innerHTML = `${esc(P.basename(p))}<span class="path">${esc(P.dirname(p))}</span>`;
        a.onclick = e => {
            e.preventDefault();
            openFolder(p);
        };
        const x = el("button", "recent-remove");
        x.title = "Remove from Recently Opened";
        x.append(el("i", "codicon codicon-close"));
        x.onclick = async e => {
            e.preventDefault();
            const cur = await api.state.get();
            await api.state.set({
                recent: (cur.recent || []).filter(r => r !== p)
            });
            renderWelcome();
        };
        row.append(a, x);
        return row;
    }));
    if (!st.recent?.length) list.append(el("div", "empty", "You have no recent folders, open a folder to start."));
}

const editorAction = id => () => {
    if (!editor.getModel()) return;
    editor.focus();
    const a = editor.getAction(id);
    if (a) return a.run();
    editor.trigger("ks", id, null);
};

const COMMANDS = [ {
    id: "file.new",
    label: "File: New Untitled Text File",
    kb: "Ctrl+N",
    run: () => newUntitled()
}, {
    id: "file.newInExplorer",
    label: "File: New File...",
    kb: "Ctrl+Alt+Windows+N",
    run: () => S.root ? (showView("explorer", true), newItem(false)) : newUntitled()
}, {
    id: "file.open",
    label: "File: Open File...",
    kb: "Ctrl+O",
    run: async () => {
        for (const f of await api.dialog.openFile()) await openFile(f);
    }
}, {
    id: "folder.open",
    label: "File: Open Folder...",
    kb: "Ctrl+K Ctrl+O",
    run: async () => openFolder(await api.dialog.openFolder())
}, {
    id: "folder.close",
    label: "Workspaces: Close Workspace",
    kb: "Ctrl+K F",
    run: closeFolder
}, {
    id: "file.save",
    label: "File: Save",
    kb: "Ctrl+S",
    run: () => saveTab(currentTab())
}, {
    id: "file.saveAs",
    label: "File: Save As...",
    kb: "Ctrl+Shift+S",
    run: () => saveTab(currentTab(), true)
}, {
    id: "file.saveAll",
    label: "File: Save All Files",
    kb: "Ctrl+K S",
    run: saveAll
}, {
    id: "file.revert",
    label: "File: Revert File",
    run: revertFile
}, {
    id: "tab.close",
    label: "View: Close Editor",
    kb: "Ctrl+F4",
    run: () => S.active && closeTab(S.active)
}, {
    id: "tab.closeAll",
    label: "View: Close All Editors",
    kb: "Ctrl+K W",
    run: closeAllTabs
}, {
    id: "tab.closeSaved",
    label: "View: Close Saved Editors in Group",
    kb: "Ctrl+K U",
    run: closeSaved
}, {
    id: "tab.next",
    label: "View: Open Next Editor",
    kb: "Ctrl+PageDown",
    run: () => cycleTab(1)
}, {
    id: "tab.prev",
    label: "View: Open Previous Editor",
    kb: "Ctrl+PageUp",
    run: () => cycleTab(-1)
}, {
    id: "folder.new",
    label: "File: New Folder...",
    run: () => newItem(true)
}, {
    id: "palette.files",
    label: "Go to File...",
    kb: "Ctrl+P",
    run: () => openPalette("")
}, {
    id: "palette.commands",
    label: "Show All Commands",
    kb: "Ctrl+Shift+P",
    run: () => openPalette(">")
}, {
    id: "edit.gotoLine",
    label: "Go to Line/Column...",
    kb: "Ctrl+G",
    run: () => openPalette(":")
}, {
    id: "edit.undo",
    label: "Undo",
    kb: "Ctrl+Z",
    run: () => document.activeElement?.closest("#tree") ? undoFileOp() : editor.trigger("ks", "undo", null)
}, {
    id: "edit.redo",
    label: "Redo",
    kb: "Ctrl+Y",
    run: () => editor.trigger("ks", "redo", null)
}, {
    id: "edit.cut",
    label: "Cut",
    kb: "Ctrl+X",
    run: () => (editor.focus(), document.execCommand("cut"))
}, {
    id: "edit.copy",
    label: "Copy",
    kb: "Ctrl+C",
    run: () => (editor.focus(), document.execCommand("copy"))
}, {
    id: "edit.paste",
    label: "Paste",
    kb: "Ctrl+V",
    run: async () => {
        editor.focus();
        const text = await navigator.clipboard.readText();
        editor.trigger("ks", "paste", {
            text: text
        });
    }
}, {
    id: "edit.find",
    label: "Find",
    kb: "Ctrl+F",
    run: editorAction("actions.find")
}, {
    id: "edit.replace",
    label: "Replace",
    kb: "Ctrl+H",
    run: editorAction("editor.action.startFindReplaceAction")
}, {
    id: "edit.format",
    label: "Format Document",
    kb: "Shift+Alt+F",
    run: editorAction("editor.action.formatDocument")
}, {
    id: "edit.comment",
    label: "Toggle Line Comment",
    kb: "Ctrl+/",
    run: editorAction("editor.action.commentLine")
}, {
    id: "edit.blockComment",
    label: "Toggle Block Comment",
    kb: "Shift+Alt+A",
    run: editorAction("editor.action.blockComment")
}, {
    id: "edit.lang",
    label: "Change Language Mode",
    kb: "Ctrl+K M",
    run: () => {
        palette.languageMode = true;
        openPalette("");
    }
}, {
    id: "edit.eol",
    label: "Change End of Line Sequence",
    run: toggleEol
}, {
    id: "edit.gotoSymbol",
    label: "Go to Symbol in Editor...",
    kb: "Ctrl+Shift+O",
    run: editorAction("editor.action.quickOutline")
}, {
    id: "edit.gotoDef",
    label: "Go to Definition",
    kb: "F12",
    run: editorAction("editor.action.revealDefinition")
}, {
    id: "edit.gotoBracket",
    label: "Go to Bracket",
    kb: "Ctrl+Shift+\\",
    run: editorAction("editor.action.jumpToBracket")
}, {
    id: "sel.all",
    label: "Select All",
    kb: "Ctrl+A",
    run: editorAction("editor.action.selectAll")
}, {
    id: "sel.expand",
    label: "Expand Selection",
    kb: "Shift+Alt+RightArrow",
    run: editorAction("editor.action.smartSelect.expand")
}, {
    id: "sel.shrink",
    label: "Shrink Selection",
    kb: "Shift+Alt+LeftArrow",
    run: editorAction("editor.action.smartSelect.shrink")
}, {
    id: "sel.copyUp",
    label: "Copy Line Up",
    kb: "Shift+Alt+UpArrow",
    run: editorAction("editor.action.copyLinesUpAction")
}, {
    id: "sel.copyDown",
    label: "Copy Line Down",
    kb: "Shift+Alt+DownArrow",
    run: editorAction("editor.action.copyLinesDownAction")
}, {
    id: "sel.moveUp",
    label: "Move Line Up",
    kb: "Alt+UpArrow",
    run: editorAction("editor.action.moveLinesUpAction")
}, {
    id: "sel.moveDown",
    label: "Move Line Down",
    kb: "Alt+DownArrow",
    run: editorAction("editor.action.moveLinesDownAction")
}, {
    id: "sel.duplicate",
    label: "Duplicate Selection",
    run: editorAction("editor.action.duplicateSelection")
}, {
    id: "sel.cursorUp",
    label: "Add Cursor Above",
    kb: "Ctrl+Alt+UpArrow",
    run: editorAction("editor.action.insertCursorAbove")
}, {
    id: "sel.cursorDown",
    label: "Add Cursor Below",
    kb: "Ctrl+Alt+DownArrow",
    run: editorAction("editor.action.insertCursorBelow")
}, {
    id: "sel.nextMatch",
    label: "Add Selection To Next Find Match",
    kb: "Ctrl+D",
    run: editorAction("editor.action.addSelectionToNextFindMatch")
}, {
    id: "sel.allMatches",
    label: "Select All Occurrences of Find Match",
    kb: "Ctrl+Shift+L",
    run: editorAction("editor.action.selectHighlights")
}, {
    id: "view.explorer",
    label: "View: Show Explorer",
    kb: "Ctrl+Shift+E",
    run: () => showView("explorer")
}, {
    id: "view.search",
    label: "View: Show Search",
    kb: "Ctrl+Shift+F",
    run: () => showView("search")
}, {
    id: "view.extensions",
    label: "View: Show Extensions",
    kb: "Ctrl+Shift+X",
    run: () => showView("extensions", true)
}, {
    id: "view.replace",
    label: "Search: Replace in Files",
    kb: "Ctrl+Shift+H",
    run: () => {
        showView("search", true);
        toggleReplace(true);
        $("#replace-input").focus();
    }
}, {
    id: "view.toggleSidebar",
    label: "View: Toggle Primary Side Bar Visibility",
    kb: "Ctrl+B",
    run: () => {
        $("#sidebar").classList.toggle("collapsed");
        $("#sash-sidebar").classList.toggle("hidden", $("#sidebar").classList.contains("collapsed"));
        layout();
    }
}, {
    id: "view.togglePanel",
    label: "View: Toggle Panel Visibility",
    kb: "Ctrl+J",
    run: togglePanel
}, {
    id: "view.problems",
    label: "View: Show Problems",
    kb: "Ctrl+Shift+M",
    run: async () => {
        await openPanelView("terminal");
        $("#problems-pane").classList.remove("collapsed");
        $("#problems-filter").focus();
    }
}, {
    id: "view.output",
    label: "View: Show Output",
    kb: "Ctrl+Shift+U",
    run: () => openPanelView("output")
}, {
    id: "view.debugConsole",
    label: "View: Show Debug Console",
    kb: "Ctrl+Shift+Y",
    run: () => openPanelView("debug")
}, {
    id: "terminal.toggle",
    label: "View: Toggle Terminal",
    kb: "Ctrl+`",
    run: toggleTerminal
}, {
    id: "terminal.new",
    label: "Terminal: Create New Terminal",
    kb: "Ctrl+Shift+`",
    run: () => newTerminal()
}, {
    id: "terminal.kill",
    label: "Terminal: Kill the Active Terminal Instance",
    run: () => killTerminal()
}, {
    id: "terminal.runFile",
    label: "Terminal: Run Active File In Active Terminal",
    kb: "F5",
    run: runActiveFile
}, {
    id: "terminal.runSelection",
    label: "Terminal: Run Selected Text In Active Terminal",
    run: runSelection
}, {
    id: "toggle.wordWrap",
    label: "View: Toggle Word Wrap",
    kb: "Alt+Z",
    run: () => setSetting("wordWrap", settings.wordWrap === "on" ? "off" : "on")
}, {
    id: "toggle.minimap",
    label: "View: Toggle Minimap",
    run: () => setSetting("minimap", !settings.minimap)
}, {
    id: "toggle.statusBar",
    label: "View: Toggle Status Bar Visibility",
    run: () => setSetting("statusBar", !settings.statusBar)
}, {
    id: "toggle.breadcrumbs",
    label: "View: Toggle Breadcrumbs",
    run: () => setSetting("breadcrumbs", settings.breadcrumbs === false)
}, {
    id: "toggle.theme",
    label: "Preferences: Color Theme",
    kb: "Ctrl+K Ctrl+T",
    run: () => {
        const r = $("#btn-settings").getBoundingClientRect();
        openMenu(themeMenu(), r.right + 6, r.top - 60);
    }
}, {
    id: "toggle.autoSave",
    label: "File: Toggle Auto Save",
    run: () => setSetting("autoSave", settings.autoSave === "off" ? "afterDelay" : "off")
}, {
    id: "settings.open",
    label: "Preferences: Open Settings (UI)",
    kb: "Ctrl+,",
    run: () => showSettings()
}, {
    id: "zoom.in",
    label: "View: Zoom In",
    kb: "Ctrl+=",
    run: () => setSetting("fontSize", settings.fontSize + 1)
}, {
    id: "zoom.out",
    label: "View: Zoom Out",
    kb: "Ctrl+-",
    run: () => setSetting("fontSize", Math.max(8, settings.fontSize - 1))
}, {
    id: "zoom.reset",
    label: "View: Reset Zoom",
    kb: "Ctrl+NumPad0",
    run: () => setSetting("fontSize", settingsDefaults.fontSize || 14)
}, {
    id: "nav.back",
    label: "Go Back",
    kb: "Alt+LeftArrow",
    run: () => navGo(-1)
}, {
    id: "nav.forward",
    label: "Go Forward",
    kb: "Alt+RightArrow",
    run: () => navGo(1)
}, {
    id: "window.new",
    label: "New Window",
    kb: "Ctrl+Shift+N",
    run: () => api.window.action("newWindow")
}, {
    id: "window.reload",
    label: "Developer: Reload Window",
    kb: "Ctrl+R",
    run: () => api.window.action("reload")
}, {
    id: "window.devtools",
    label: "Developer: Toggle Developer Tools",
    kb: "Ctrl+Shift+I",
    run: () => api.window.action("devtools")
}, {
    id: "window.fullscreen",
    label: "View: Toggle Full Screen",
    kb: "F11",
    run: () => api.window.action("fullscreen")
}, {
    id: "help.welcome",
    label: "Help: Welcome",
    run: () => {
        hideSettings();
        showWelcomePage = true;
        S.active = null;
        editor.setModel(null);
        renderMedia(null);
        $("#welcome").classList.remove("hidden");
        $("#watermark").classList.add("hidden");
        renderTabs();
        renderWelcome();
    }
}, {
    id: "help.about",
    label: "Help: About",
    run: showAbout
} ];

let lastCmd = {
    id: null,
    t: 0
};

function runCommand(id) {
    const now = Date.now();
    if (lastCmd.id === id && now - lastCmd.t < 150) return;
    lastCmd = {
        id: id,
        t: now
    };
    const c = COMMANDS.find(x => x.id === id);
    if (c) guard(() => c.run());
}

const KEYS = {
    "ctrl+n": "file.new",
    "ctrl+alt+n": "file.newInExplorer",
    "ctrl+alt+meta+n": "file.newInExplorer",
    "ctrl+shift+n": "window.new",
    "ctrl+o": "file.open",
    "ctrl+s": "file.save",
    "ctrl+shift+s": "file.saveAs",
    "ctrl+w": "tab.close",
    "ctrl+f4": "tab.close",
    "ctrl+shift+f": "view.search",
    "ctrl+shift+h": "view.replace",
    "ctrl+shift+p": "palette.commands",
    f1: "palette.commands",
    "ctrl+p": "palette.files",
    "ctrl+shift+e": "view.explorer",
    "ctrl+'": "terminal.toggle",
    "ctrl+shift+'": "terminal.new",
    "ctrl+b": "view.toggleSidebar",
    "ctrl+j": "view.togglePanel",
    "ctrl+=": "zoom.in",
    "ctrl+-": "zoom.out",
    "ctrl+0": "zoom.reset",
    "ctrl+,": "settings.open",
    f5: "terminal.runFile",
    "ctrl+f5": "terminal.runFile",
    "alt+arrowleft": "nav.back",
    "alt+arrowright": "nav.forward",
    "ctrl+shift+x": "view.extensions",
    "ctrl+shift+m": "view.problems",
    "ctrl+shift+u": "view.output",
    "ctrl+shift+y": "view.debugConsole",
    "ctrl+tab": "tab.next",
    "ctrl+shift+tab": "tab.prev",
    "ctrl+pagedown": "tab.next",
    "ctrl+pageup": "tab.prev",
    "ctrl+r": "window.reload",
    "ctrl+shift+i": "window.devtools",
    f11: "window.fullscreen"
};

const CHORDS = {
    "ctrl+o": "folder.open",
    f: "folder.close",
    s: "file.saveAll",
    "ctrl+s": "palette.commands",
    w: "tab.closeAll",
    u: "tab.closeSaved",
    m: "edit.lang",
    "ctrl+t": "toggle.theme"
};

function keyId(e) {
    let k = e.key.toLowerCase();
    if ([ "control", "shift", "alt", "meta" ].includes(k)) return "";
    if (e.code === "Backquote" || e.code === "Quote" || k === "`" || k === "dead") k = "'";
    if (k === "+") k = "=";
    return [ e.ctrlKey && "ctrl", e.shiftKey && "shift", e.altKey && "alt", e.metaKey && "meta", k ].filter(Boolean).join("+");
}

let chordUntil = 0;

window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeMenus(0);
        if (!$("#settings-modal").classList.contains("hidden")) hideSettings();
    }
    const id = keyId(e);
    if (!id) return;
    if (Date.now() < chordUntil) {
        chordUntil = 0;
        const cmd = CHORDS[id];
        if (cmd) {
            e.preventDefault();
            e.stopPropagation();
            runCommand(cmd);
        }
        return;
    }
    if (id === "ctrl+k") {
        chordUntil = Date.now() + 2e3;
        if (!document.activeElement?.closest("#editor")) e.preventDefault();
        return;
    }
    const cmd = KEYS[id];
    if (!cmd) return;
    if (cmd.startsWith("nav.") && document.activeElement?.tagName === "INPUT") return;
    e.preventDefault();
    e.stopPropagation();
    runCommand(cmd);
}, true);

function cycleTab(d) {
    if (!S.tabs.length) return;
    const i = S.tabs.findIndex(t => t.id === S.active);
    activateTab(S.tabs[(i + d + S.tabs.length) % S.tabs.length].id);
}

async function revertFile() {
    const t = currentTab();
    if (!t?.path || t.kind) return;
    const data = await api.fs.readFile(t.path);
    t.model.pushEditOperations([], [ {
        range: t.model.getFullModelRange(),
        text: data.content
    } ], () => null);
    t.savedVersion = t.model.getAlternativeVersionId();
    renderTabs();
}

function toggleEol() {
    const t = currentTab();
    if (!t) return;
    t.model.pushEOL(t.model.getEOL() === "\r\n" ? monaco.editor.EndOfLineSequence.LF : monaco.editor.EndOfLineSequence.CRLF);
    updateStatus();
}

const presence = {
    start: Date.now(),
    timer: null
};

function updatePresence() {
    clearTimeout(presence.timer);
    presence.timer = setTimeout(() => {
        const config = {
            enabled: true,
            clientId: DISCORD_CLIENT_ID
        };
        const t = currentTab();
        const workspace = S.root ? P.basename(S.root) : null;
        const lang = t?.model ? monaco.languages.getLanguages().find(l => l.id === t.model.getLanguageId()) : null;
        const langName = t?.kind || lang?.aliases?.[0] || t?.model?.getLanguageId() || "";
        const activity = {
            details: t ? settings.discordShowFile !== false ? `Editing ${t.title}` : `Editing a ${langName} file` : "Idling",
            state: settings.discordShowWorkspace !== false && workspace ? `Workspace: ${workspace}` : "In Codec",
            startTimestamp: presence.start,
            largeImageKey: settings.discordLargeImage || "codec",
            largeImageText: t ? `Editing a ${langName} file` : "Codec",
            instance: false
        };
        api.discord.update(config, config.enabled ? activity : null).catch(() => {});
    }, 400);
}

api.discord.onStatus(msg => logOutput(msg));

async function saveSession() {
    if (!S.root) return;
    const st = await api.state.get();
    st.sessions = st.sessions || {};
    st.sessions[S.root] = {
        tabs: S.tabs.filter(t => t.path).map(t => t.path),
        active: currentTab()?.path || null
    };
    await api.state.set({
        sessions: st.sessions,
        lastFolder: S.root
    });
}

api.onBeforeClose(async () => {
    const dirty = S.tabs.filter(isDirty);
    if (dirty.length) {
        const {response: response} = await api.dialog.message({
            type: "warning",
            buttons: [ "Save All", "Don't Save", "Cancel" ],
            defaultId: 0,
            cancelId: 2,
            message: `Do you want to save the changes to the following ${dirty.length} files?`,
            detail: dirty.map(t => t.title).join("\n") + "\n\nYour changes will be lost if you don't save them."
        });
        if (response === 2) return;
        if (response === 0) for (const t of dirty) if (!await saveTab(t)) return;
    }
    await saveSession();
    await api.window.confirmClose();
});

function defineThemes() {
    monaco.editor.defineTheme("ks-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#121314",
            "editor.foreground": "#cccccc",
            "editor.lineHighlightBackground": "#242526",
            "editorLineNumber.foreground": "#6e7681",
            "editorLineNumber.activeForeground": "#cccccc",
            "editor.lineHighlightBorder": "#00000000",
            "editorIndentGuide.background1": "#404040",
            "editorIndentGuide.activeBackground1": "#707070",
            "editorWidget.background": "#202020",
            "editorWidget.border": "#313131",
            "editorGutter.background": "#121314",
            "editorStickyScroll.background": "#121314",
            "editorStickyScrollHover.background": "#2a2d2e",
            "minimap.background": "#121314",
            focusBorder: "#0078d4",
            "input.background": "#313131",
            "dropdown.background": "#313131",
            "list.activeSelectionBackground": "#04395e",
            "list.hoverBackground": "#2a2d2e",
            "quickInput.background": "#222222"
        }
    });
    monaco.editor.defineTheme("ks-light", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#ffffff",
            "editorLineNumber.foreground": "#6e7681",
            "editorLineNumber.activeForeground": "#171184",
            "editor.lineHighlightBorder": "#eeeeee",
            "editorWidget.background": "#f8f8f8",
            "editorStickyScroll.background": "#ffffff",
            focusBorder: "#005fb8"
        }
    });
}

async function start() {
    settingsDefaults = await api.settings.defaults();
    settings = {
        ...settingsDefaults,
        ...await api.settings.get()
    };
    if (settings.autoSave === true) settings.autoSave = "afterDelay";
    if (settings.autoSave === false) settings.autoSave = "off";
    defineThemes();
    registerExtraLanguages(monaco);
    editor = monaco.editor.create($("#editor"), {
        model: null,
        automaticLayout: false,
        theme: settings.theme === "light" ? "ks-light" : "ks-dark",
        ...editorOptions(),
        tabCompletion: "on",
        "semanticHighlighting.enabled": true
    });
    registerHTMLBoilerplateCompletion();
    registerLanguageCompletions();
    enableAutoCloseTags(editor);
    editor.onDidChangeCursorPosition(updateStatus);
    editor.onDidChangeCursorSelection(updateStatus);
    const saveOnFocusChange = () => {
        if (settings.autoSave !== "onFocusChange") return;
        for (const t of S.tabs) if (t.path && isDirty(t)) saveTab(t);
    };
    editor.onDidBlurEditorText(saveOnFocusChange);
    window.addEventListener("blur", saveOnFocusChange);
    monaco.editor.onDidChangeMarkers(() => renderProblems());
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => runCommand("toggle.wordWrap"));
    editor.addCommand(monaco.KeyCode.F5, () => runCommand("terminal.runFile"));
    monaco.editor.registerEditorOpener({
        openCodeEditor: (_src, uri, selection) => {
            openFile(uri.fsPath).then(() => selection && editor.setSelection(selection));
            return true;
        }
    });
    for (const d of [ monaco.languages.typescript?.javascriptDefaults, monaco.languages.typescript?.typescriptDefaults ]) {
        d?.setCompilerOptions({
            target: 99,
            allowJs: true,
            allowNonTsExtensions: true,
            jsx: 1,
            module: 99,
            moduleResolution: 2,
            esModuleInterop: true
        });
        d?.setDiagnosticsOptions({
            noSemanticValidation: true
        });
    }
    setupMenubar();
    updateNavButtons();
    $("#tb-back").onclick = () => navGo(-1);
    $("#tb-forward").onclick = () => navGo(1);
    $("#command-center").onclick = () => openPalette("");
    $("#tb-toggle-sidebar").onclick = () => runCommand("view.toggleSidebar");
    $("#tb-toggle-panel").onclick = () => runCommand("view.togglePanel");
    $("#btn-run").onclick = () => runCommand("terminal.runFile");
    $("#btn-editor-more").onclick = e => {
        const r = e.currentTarget.getBoundingClientRect();
        openMenu([ {
            label: "Close All",
            kb: "Ctrl+K W",
            run: closeAllTabs
        }, {
            label: "Close Saved",
            kb: "Ctrl+K U",
            run: closeSaved
        }, "-", {
            label: "Word Wrap",
            kb: "Alt+Z",
            checked: settings.wordWrap === "on",
            run: () => runCommand("toggle.wordWrap")
        }, {
            label: "Minimap",
            checked: !!settings.minimap,
            run: () => runCommand("toggle.minimap")
        } ], r.right - 240, r.bottom + 2);
    };
    $("#btn-settings").onclick = e => {
        const r = e.currentTarget.getBoundingClientRect();
        openMenu([ {
            label: "Command Palette...",
            kb: "Ctrl+Shift+P",
            run: () => runCommand("palette.commands")
        }, "-", {
            label: "Settings",
            kb: "Ctrl+,",
            run: () => showSettings()
        }, {
            label: "Keyboard Shortcuts",
            kb: "Ctrl+K Ctrl+S",
            run: () => openPalette(">")
        }, "-", {
            label: "Themes",
            submenu: [ {
                label: "Color Theme",
                kb: "Ctrl+K Ctrl+T",
                submenu: themeMenu
            } ]
        } ], r.right + 6, r.top - 150);
    };
    setupSettingsModal();
    setupPanel();
    setupExplorer();
    setupSearch();
    setupSashes();
    setupPalette();
    document.querySelectorAll(".act[data-view]").forEach(b => b.onclick = () => showView(b.dataset.view));
    $("#sb-pos").onclick = () => openPalette(":");
    $("#sb-lang").onclick = () => runCommand("edit.lang");
    $("#sb-eol").onclick = toggleEol;
    $("#sb-indent").onclick = () => {
        const t = currentTab();
        if (!t) return;
        const o = t.model.getOptions();
        t.model.updateOptions({
            insertSpaces: true,
            tabSize: o.tabSize === 4 ? 2 : 4
        });
        updateStatus();
    };
    document.querySelectorAll(".welcome a[data-cmd]").forEach(a => a.onclick = e => (e.preventDefault(), 
    runCommand(a.dataset.cmd)));
    document.querySelectorAll(".wm-row[data-cmd]").forEach(r => r.onclick = () => runCommand(r.dataset.cmd));
    new ResizeObserver(() => currentTab()?.applyZoom?.()).observe($("#editor-area"));
    api.onCommand(runCommand);
    api.onOpenFolder(openFolder);
    api.onOpenFile(p => openFile(p));
    document.addEventListener("dragover", e => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    }, true);
    document.addEventListener("drop", async e => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        e.stopPropagation();
        for (const f of e.dataTransfer.files) {
            const p = api.pathForFile(f);
            if (!p) continue;
            const isDir = await api.fs.readDir(p).then(() => true, () => false);
            if (!S.root) {
                if (isDir) await openFolder(p); else await openFile(p);
                continue;
            }
            const rootPath = P.resolve(S.root).toLowerCase();
            const sourcePath = P.resolve(p).toLowerCase();
            const isInProject = sourcePath === rootPath || sourcePath.startsWith(rootPath + P.sep.toLowerCase());
            if (isInProject) {
                if (isDir) {
                    S.expanded.add(p);
                    S.selected = p;
                    await renderTree();
                } else await openFile(p);
                continue;
            }
            const originalName = P.basename(p);
            const extension = isDir ? "" : P.extname(originalName);
            const stem = extension ? originalName.slice(0, -extension.length) : originalName;
            let destination = P.join(S.root, originalName);
            for (let suffix = 2; await api.fs.exists(destination); suffix++) {
                destination = P.join(S.root, `${stem} (${suffix})${extension}`);
            }
            await guard(async () => {
                await api.fs.copyFrom(p, destination);
                S.dirCache.clear();
                S.fileList = null;
                S.expanded.add(S.root);
                if (isDir) {
                    S.selected = destination;
                    S.expanded.add(destination);
                }
                await renderTree();
                if (isDir) {
                    toast(`Added ${P.basename(destination)} to the project.`);
                } else {
                    await openFile(destination);
                    toast(`Added ${P.basename(destination)} to the project.`);
                }
            });
        }
    }, true);
    const st = await api.state.get();
    S.recentFiles = st.recentFiles || [];
    if (st.layout?.sidebar) $("#sidebar").style.width = st.layout.sidebar + "px";
    if (st.layout?.panel) $("#panel").style.height = st.layout.panel + "px";
    if (st.layout?.problems) $("#problems-pane").style.width = st.layout.problems + "px";
    await ExtUI.init();
    applySettings();
    await renderWelcome();
    await renderTree();
    updateStatus();
    const folderArg = new URLSearchParams(location.search).get("folder");
    const fresh = new URLSearchParams(location.search).get("fresh") === "1";
    const folder = folderArg || (!fresh && settings.restoreFolder !== false ? st.lastFolder : null);
    if (folder && await api.fs.exists(folder)) await openFolder(folder);
    const fileArg = new URLSearchParams(location.search).get("file");
    if (fileArg && await api.fs.exists(fileArg)) await openFile(fileArg);
    logOutput("Codec started.");
    updatePresence();
    renderProblems();
    layout();
}

require.config({
    paths: {
        vs: "../node_modules/monaco-editor/min/vs"
    }
});

require([ "vs/editor/editor.main", "vs/language/html/monaco.contribution", "vs/language/css/monaco.contribution", "vs/language/json/monaco.contribution", "vs/language/typescript/monaco.contribution", "vs/basic-languages/monaco.contribution" ], () => {
    monaco = window.monaco;
    start().catch(e => toast("Failed to start: " + e.message, true));
});