const {contextBridge: contextBridge, ipcRenderer: ipcRenderer, webUtils: webUtils} = require("electron");

const path = require("node:path");

const fs = require("node:fs");

const ICON_MANIFEST = JSON.parse(fs.readFileSync(path.join(__dirname, "node_modules", "material-icon-theme", "dist", "material-icons.json"), "utf8"));

const iconCache = new Map;

function iconFor(name, isDir, open, langId, light) {
    const key = `${name}|${isDir}|${open}|${langId}|${light}`;
    if (iconCache.has(key)) return iconCache.get(key);
    const m = ICON_MANIFEST;
    const n = name.toLowerCase();
    let id;
    if (isDir) {
        id = (open ? m.folderNamesExpanded : m.folderNames)[n] || (open ? m.folderExpanded : m.folder);
    } else {
        id = light && m.light.fileNames?.[n] || m.fileNames[n];
        const parts = n.split(".");
        for (let i = 1; !id && i < parts.length; i++) {
            const ext = parts.slice(i).join(".");
            id = light && m.light.fileExtensions?.[ext] || m.fileExtensions[ext];
        }
        if (!id && langId && langId !== "plaintext") id = m.languageIds[langId];
        id = id || m.file;
    }
    const def = m.iconDefinitions[id] || m.iconDefinitions[m.file];
    const file = path.basename(def.iconPath, ".svg");
    iconCache.set(key, file);
    return file;
}

const invoke = ch => (...args) => ipcRenderer.invoke(ch, ...args);

const on = ch => fn => {
    const listener = (_e, ...args) => fn(...args);
    ipcRenderer.on(ch, listener);
    return () => ipcRenderer.removeListener(ch, listener);
};

contextBridge.exposeInMainWorld("api", {
    platform: process.platform,
    pathForFile: file => webUtils.getPathForFile(file),
    iconFor: iconFor,
    debugInput: process.env.KS_SCREENSHOT ? invoke("debug:input") : undefined,
    path: {
        sep: path.sep,
        join: (...p) => path.join(...p),
        resolve: p => path.resolve(p),
        dirname: p => path.dirname(p),
        basename: p => path.basename(p),
        extname: p => path.extname(p),
        relative: (a, b) => path.relative(a, b)
    },
    window: {
        confirmClose: invoke("window:confirmClose"),
        setTitle: invoke("window:setTitle"),
        setOverlay: invoke("window:setOverlay"),
        action: invoke("window:action"),
        setFolder: invoke("window:setFolder"),
        info: invoke("app:info")
    },
    dialog: {
        message: invoke("dialog:message"),
        openFolder: invoke("dialog:openFolder"),
        openFile: invoke("dialog:openFile"),
        saveFile: invoke("dialog:saveFile")
    },
    reveal: invoke("shell:reveal"),
    preview: {
        open: invoke("preview:open")
    },
    settings: {
        get: invoke("settings:get"),
        set: invoke("settings:set"),
        defaults: invoke("settings:defaults"),
        path: invoke("settings:path")
    },
    state: {
        get: invoke("state:get"),
        addRecent: invoke("state:addRecent"),
        set: invoke("state:set")
    },
    fs: {
        readDir: invoke("fs:readDir"),
        readFile: invoke("fs:readFile"),
        writeFile: invoke("fs:writeFile"),
        copyFrom: invoke("fs:copyFrom"),
        createFile: invoke("fs:createFile"),
        createDir: invoke("fs:createDir"),
        rename: invoke("fs:rename"),
        delete: invoke("fs:delete"),
        deleteUndoable: invoke("fs:deleteUndoable"),
        restoreDeleted: invoke("fs:restoreDeleted"),
        exists: invoke("fs:exists"),
        listFiles: invoke("fs:listFiles"),
        watch: invoke("fs:watch"),
        onChanged: on("fs:changed")
    },
    search: invoke("search:run"),
    ext: {
        search: invoke("ext:search"),
        details: invoke("ext:details"),
        text: invoke("ext:text"),
        installed: invoke("ext:installed"),
        install: invoke("ext:install"),
        uninstall: invoke("ext:uninstall"),
        setEnabled: invoke("ext:setEnabled"),
        setAutoUpdate: invoke("ext:setAutoUpdate"),
        checkUpdates: invoke("ext:checkUpdates"),
        loadTheme: invoke("ext:loadTheme"),
        readJsonc: invoke("ext:readJsonc")
    },
    discord: {
        update: invoke("discord:update"),
        onStatus: on("discord:status")
    },
    term: {
        available: invoke("term:available"),
        create: invoke("term:create"),
        write: (id, d) => ipcRenderer.send("term:write", id, d),
        resize: (id, c, r) => ipcRenderer.send("term:resize", id, c, r),
        kill: invoke("term:kill"),
        onData: on("term:data"),
        onExit: on("term:exit")
    },
    onCommand: on("command"),
    onOpenFolder: on("open-folder"),
    onOpenFile: on("open-file"),
    openDoc: invoke("app:openDoc"),
    onBeforeClose: on("before-close")
});