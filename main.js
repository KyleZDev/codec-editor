const {app: app, BrowserWindow: BrowserWindow, Menu: Menu, ipcMain: ipcMain, dialog: dialog, shell: shell} = require("electron");

const path = require("node:path");

const fs = require("node:fs");

const fsp = require("node:fs/promises");

const http = require("node:http");

const os = require("node:os");

let previewServer = null;

let previewRoot = null;

let previewPort = null;

async function openProjectPreview(root, file, openInBrowser = true) {
    root = path.resolve(root);
    file = path.resolve(file);
    const relativeFile = path.relative(root, file);
    if (!relativeFile || relativeFile.startsWith(`..${path.sep}`) || relativeFile === ".." || path.isAbsolute(relativeFile)) {
        throw new Error("The HTML file must be inside the open project folder.");
    }
    if (!(await fsp.stat(file)).isFile()) throw new Error("The selected preview file is not a regular file.");
    if (!previewServer?.listening || previewRoot !== root) {
        if (previewServer?.listening) await new Promise(resolve => previewServer.close(resolve));
        const mime = {
            ".avif": "image/avif",
            ".css": "text/css; charset=utf-8",
            ".gif": "image/gif",
            ".htm": "text/html; charset=utf-8",
            ".html": "text/html; charset=utf-8",
            ".ico": "image/x-icon",
            ".jpeg": "image/jpeg",
            ".jpg": "image/jpeg",
            ".js": "text/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".mjs": "text/javascript; charset=utf-8",
            ".png": "image/png",
            ".svg": "image/svg+xml",
            ".txt": "text/plain; charset=utf-8",
            ".wasm": "application/wasm",
            ".webp": "image/webp",
            ".woff": "font/woff",
            ".woff2": "font/woff2"
        };
        previewServer = http.createServer(async (req, res) => {
            try {
                if (req.method !== "GET" && req.method !== "HEAD") {
                    res.writeHead(405, {
                        Allow: "GET, HEAD"
                    }).end();
                    return;
                }
                const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
                let target = path.resolve(root, `.${pathname}`);
                if (target !== root && !target.startsWith(root + path.sep)) {
                    res.writeHead(403).end("Forbidden");
                    return;
                }
                const info = await fsp.stat(target);
                if (info.isDirectory()) target = path.join(target, "index.html");
                const contentInfo = await fsp.stat(target);
                if (!contentInfo.isFile()) throw new Error("Not a file");
                res.writeHead(200, {
                    "Cache-Control": "no-cache",
                    "Content-Length": contentInfo.size,
                    "Content-Type": mime[path.extname(target).toLowerCase()] || "application/octet-stream",
                    "X-Content-Type-Options": "nosniff"
                });
                if (req.method === "HEAD") res.end(); else fs.createReadStream(target).pipe(res);
            } catch {
                if (!res.headersSent) res.writeHead(404, {
                    "Cache-Control": "no-cache"
                }).end("Not found"); else res.destroy();
            }
        });
        await new Promise((resolve, reject) => {
            previewServer.once("error", reject);
            previewServer.listen(0, "127.0.0.1", resolve);
        });
        previewRoot = root;
        previewPort = previewServer.address().port;
    }
    const encodedPath = relativeFile.split(path.sep).map(encodeURIComponent).join("/");
    const url = `http://127.0.0.1:${previewPort}/${encodedPath}`;
    if (openInBrowser) await shell.openExternal(url);
    return url;
}

let pty = null;

try {
    pty = require("@lydell/node-pty");
} catch (e) {
    console.error("node-pty unavailable, terminal disabled:", e.message);
}

const IGNORED = new Set([ "node_modules", ".git", "dist", "build", "out", ".next", "__pycache__", ".venv", "venv", ".cache" ]);

(() => {
    const oldDir = path.join(app.getPath("appData"), "KS Code");
    const newDir = app.getPath("userData");
    for (const f of [ "settings.json", "state.json" ]) {
        const from = path.join(oldDir, f);
        const to = path.join(newDir, f);
        if (fs.existsSync(from) && !fs.existsSync(to)) {
            fs.mkdirSync(newDir, {
                recursive: true
            });
            fs.copyFileSync(from, to);
        }
    }
})();

const SETTINGS_FILE = path.join(app.getPath("userData"), "settings.json");

const STATE_FILE = path.join(app.getPath("userData"), "state.json");

const DEFAULT_SETTINGS = {
    language: "en",
    theme: "dark",
    fontSize: 14,
    fontFamily: "Consolas, 'Courier New', monospace",
    fontLigatures: false,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: "off",
    lineNumbers: "on",
    renderWhitespace: "selection",
    renderLineHighlight: "line",
    minimap: true,
    cursorStyle: "line",
    cursorBlinking: "blink",
    smoothScrolling: false,
    bracketPairs: true,
    stickyScroll: true,
    mouseWheelZoom: false,
    formatOnSave: false,
    autoSave: "off",
    autoSaveDelay: 1e3,
    trimTrailingWhitespace: false,
    insertFinalNewline: false,
    statusBar: false,
    breadcrumbs: true,
    commandCenter: true,
    restoreFolder: true,
    compactFolders: true,
    confirmDelete: true,
    terminalShell: "",
    terminalFontSize: 14,
    terminalLineHeight: 1.2,
    terminalCursorStyle: "block",
    terminalCursorBlink: false,
    discordEnabled: true,
    discordClientId: "1575226815327244449",
    discordShowFile: true,
    discordShowWorkspace: true,
    discordLargeImage: "codec"
};

function readJson(file, fallback) {
    try {
        return {
            ...fallback,
            ...JSON.parse(fs.readFileSync(file, "utf8"))
        };
    } catch {
        return {
            ...fallback
        };
    }
}

function writeJson(file, data) {
    fs.mkdirSync(path.dirname(file), {
        recursive: true
    });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let win = null;

const terminals = new Map;

const watchers = new Map;

const winOf = e => BrowserWindow.fromWebContents(e.sender);

function send(channel, ...args) {
    if (win && !win.isDestroyed()) win.webContents.send(channel, ...args);
}

const cmd = name => () => send("command", name);

function buildMenu() {
    Menu.setApplicationMenu(null);
}

function createWindow(target, {fresh: fresh = false} = {}) {
    const state = readJson(STATE_FILE, {
        recent: [],
        bounds: null
    });
    const w = new BrowserWindow({
        show: false,
        width: state.bounds?.width || 1280,
        height: state.bounds?.height || 820,
        minWidth: 600,
        minHeight: 400,
        backgroundColor: "#191a1b",
        icon: path.join(__dirname, "renderer", process.platform === "win32" ? "logo.ico" : "logo.png"),
        title: "Codec",
        titleBarStyle: "hidden",
        titleBarOverlay: overlayFor(readJson(SETTINGS_FILE, DEFAULT_SETTINGS).theme),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });
    win = w;
    const query = target ? target.isDir ? {
        folder: target.path
    } : {
        file: target.path
    } : {};
    if (fresh) query.fresh = "1";
    w.loadFile(path.join(__dirname, "renderer", "index.html"), {
        query: query
    });
    w.once("ready-to-show", () => {
        w.show();
        w.maximize();
    });
    w.on("focus", () => win = w);
    if (process.env.KS_DEBUG || process.env.KS_SCREENSHOT) {
        w.webContents.on("console-message", e => console.log(`[renderer:${e.level}] ${e.message}`));
    }
    if (process.env.KS_SCREENSHOT && BrowserWindow.getAllWindows().length === 1) {
        ipcMain.removeHandler("debug:input");
        ipcMain.handle("debug:input", (e, ev) => e.sender.sendInputEvent(ev));
        w.webContents.setBackgroundThrottling(false);
        w.webContents.once("did-finish-load", () => setTimeout(async () => {
            if (process.env.KS_EXEC) await w.webContents.executeJavaScript(process.env.KS_EXEC).catch(e => console.log("exec error", e));
            setTimeout(async () => {
                w.show();
                w.focus();
                await new Promise(r => setTimeout(r, 500));
                fs.writeFileSync(process.env.KS_SCREENSHOT, (await w.webContents.capturePage()).toPNG());
                console.log(`[test] windows=${BrowserWindow.getAllWindows().length} folders=${JSON.stringify(BrowserWindow.getAllWindows().map(x => x.codecFolder || null))}`);
                for (const x of BrowserWindow.getAllWindows()) x.forceClose = true;
                app.quit();
            }, 2500);
        }, 2500));
    }
    w.on("close", e => {
        if (w.forceClose) return;
        e.preventDefault();
        w.webContents.send("before-close");
    });
    const wcId = w.webContents.id;
    w.on("closed", () => {
        for (const [key, t] of terminals) if (key.startsWith(wcId + ":")) {
            t.p.kill();
            terminals.delete(key);
        }
        watchers.get(wcId)?.close();
        watchers.delete(wcId);
        if (win === w) win = BrowserWindow.getAllWindows()[0] || null;
    });
    w.webContents.setWindowOpenHandler(({url: url}) => {
        shell.openExternal(url);
        return {
            action: "deny"
        };
    });
    return w;
}

function overlayFor(theme) {
    return theme === "light" ? {
        color: "#e8e8e8",
        symbolColor: "#1e1e1e",
        height: 35
    } : {
        color: "#191a1b",
        symbolColor: "#cccccc",
        height: 35
    };
}

ipcMain.handle("window:setOverlay", (e, theme) => {
    try {
        winOf(e)?.setTitleBarOverlay(overlayFor(theme));
    } catch {}
});

ipcMain.handle("window:action", (e, action) => {
    const w = winOf(e);
    if (action === "newWindow") return void createWindow(null, {
        fresh: true
    });
    if (!w) return;
    switch (action) {
      case "devtools":
        return w.webContents.toggleDevTools();

      case "reload":
        return w.webContents.reload();

      case "fullscreen":
        return w.setFullScreen(!w.isFullScreen());

      case "close":
        return w.close();
    }
});

ipcMain.handle("window:setFolder", (e, folder) => {
    const w = winOf(e);
    if (w) w.codecFolder = folder || null;
});

ipcMain.handle("app:openDoc", (_e, name) => {
    const file = app.isPackaged ? path.join(process.resourcesPath, name) : path.join(__dirname, name);
    return fs.existsSync(file) ? shell.openPath(file) : "missing";
});

ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    os: `${os.type()} ${os.arch()} ${os.release()}`
}));

ipcMain.handle("window:confirmClose", e => {
    const w = winOf(e);
    if (!w) return;
    const st = readJson(STATE_FILE, {
        recent: []
    });
    if (!w.isMaximized()) st.bounds = w.getBounds();
    writeJson(STATE_FILE, st);
    w.forceClose = true;
    w.close();
});

ipcMain.handle("window:setTitle", (e, title) => winOf(e)?.setTitle(title));

ipcMain.handle("dialog:message", (e, opts) => dialog.showMessageBox(winOf(e), opts));

ipcMain.handle("dialog:openFolder", async e => {
    const r = await dialog.showOpenDialog(winOf(e), {
        properties: [ "openDirectory" ]
    });
    return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle("dialog:openFile", async e => {
    const r = await dialog.showOpenDialog(winOf(e), {
        properties: [ "openFile", "multiSelections" ]
    });
    return r.canceled ? [] : r.filePaths;
});

ipcMain.handle("dialog:saveFile", async (e, defaultPath) => {
    const r = await dialog.showSaveDialog(winOf(e), {
        defaultPath: defaultPath
    });
    return r.canceled ? null : r.filePath;
});

ipcMain.handle("shell:reveal", (_e, p) => shell.showItemInFolder(p));

ipcMain.handle("preview:open", (_e, root, file, openInBrowser) => openProjectPreview(root, file, openInBrowser));

ipcMain.handle("settings:get", () => readJson(SETTINGS_FILE, DEFAULT_SETTINGS));

ipcMain.handle("settings:defaults", () => DEFAULT_SETTINGS);

ipcMain.handle("settings:path", () => {
    if (!fs.existsSync(SETTINGS_FILE)) writeJson(SETTINGS_FILE, {});
    return SETTINGS_FILE;
});

ipcMain.handle("settings:set", (_e, s) => {
    writeJson(SETTINGS_FILE, s);
    buildMenu();
});

ipcMain.handle("state:get", () => readJson(STATE_FILE, {
    recent: []
}));

ipcMain.handle("state:addRecent", (_e, folder) => {
    folder = path.resolve(folder);
    const st = readJson(STATE_FILE, {
        recent: []
    });
    st.recent = [ folder, ...st.recent.filter(p => path.resolve(p).toLowerCase() !== folder.toLowerCase()) ].slice(0, 10);
    st.lastFolder = folder;
    writeJson(STATE_FILE, st);
    buildMenu();
});

ipcMain.handle("state:set", (_e, patch) => writeJson(STATE_FILE, {
    ...readJson(STATE_FILE, {
        recent: []
    }),
    ...patch
}));

ipcMain.handle("fs:readDir", async (_e, dir) => {
    const entries = await fsp.readdir(dir, {
        withFileTypes: true
    });
    return entries.filter(e => e.name !== ".git").map(e => ({
        name: e.name,
        path: path.join(dir, e.name),
        isDir: e.isDirectory()
    })).sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name, undefined, {
        sensitivity: "base"
    }));
});

ipcMain.handle("fs:readFile", async (_e, p) => {
    const buf = await fsp.readFile(p);
    const binary = buf.subarray(0, 8e3).includes(0);
    return {
        content: binary ? "" : buf.toString("utf8"),
        binary: binary,
        size: buf.length
    };
});

ipcMain.handle("fs:writeFile", (_e, p, content) => fsp.writeFile(p, content, "utf8"));

ipcMain.handle("fs:copyFrom", async (_e, source, destination) => {
    if (fs.existsSync(destination)) throw new Error(`A file or folder '${path.basename(destination)}' already exists at this location.`);
    await fsp.cp(source, destination, {
        recursive: true,
        errorOnExist: true,
        force: false
    });
});

ipcMain.handle("fs:createFile", async (_e, p) => {
    if (fs.existsSync(p)) throw new Error(`A file or folder '${path.basename(p)}' already exists at this location.`);
    await fsp.mkdir(path.dirname(p), {
        recursive: true
    });
    await fsp.writeFile(p, "");
});

ipcMain.handle("fs:createDir", (_e, p) => fsp.mkdir(p, {
    recursive: true
}));

ipcMain.handle("fs:rename", async (_e, from, to) => {
    if (fs.existsSync(to)) throw new Error(`A file or folder '${path.basename(to)}' already exists at this location.`);
    await fsp.rename(from, to);
});

ipcMain.handle("fs:delete", (_e, p) => shell.trashItem(p));

const DELETED_DIR = path.join(app.getPath("userData"), "deleted");

async function moveAcross(from, to) {
    await fsp.mkdir(path.dirname(to), {
        recursive: true
    });
    for (let attempt = 0; ;attempt++) {
        try {
            await fsp.rename(from, to);
            return;
        } catch (e) {
            if (e.code === "EXDEV") break;
            if (![ "EPERM", "EBUSY", "EACCES" ].includes(e.code) || attempt >= 8) {
                if (e.code === "EPERM" || e.code === "EACCES") break;
                throw e;
            }
            await new Promise(r => setTimeout(r, 150));
        }
    }
    await fsp.cp(from, to, {
        recursive: true
    });
    await fsp.rm(from, {
        recursive: true,
        force: true,
        maxRetries: 8,
        retryDelay: 150
    });
}

ipcMain.handle("fs:deleteUndoable", async (_e, p) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await moveAcross(p, path.join(DELETED_DIR, id, path.basename(p)));
    return id;
});

ipcMain.handle("fs:restoreDeleted", async (_e, id, original) => {
    if (fs.existsSync(original)) throw new Error(`'${path.basename(original)}' already exists.`);
    await moveAcross(path.join(DELETED_DIR, id, path.basename(original)), original);
    await fsp.rm(path.join(DELETED_DIR, id), {
        recursive: true,
        force: true
    });
});

async function flushDeleted() {
    if (!fs.existsSync(DELETED_DIR)) return;
    for (const id of await fsp.readdir(DELETED_DIR)) {
        const dir = path.join(DELETED_DIR, id);
        for (const name of await fsp.readdir(dir).catch(() => [])) await shell.trashItem(path.join(dir, name)).catch(() => {});
        await fsp.rm(dir, {
            recursive: true,
            force: true
        }).catch(() => {});
    }
}

ipcMain.handle("fs:exists", (_e, p) => fs.existsSync(p));

async function* walk(dir) {
    let entries;
    try {
        entries = await fsp.readdir(dir, {
            withFileTypes: true
        });
    } catch {
        return;
    }
    for (const e of entries) {
        if (e.isDirectory()) {
            if (!IGNORED.has(e.name)) yield* walk(path.join(dir, e.name));
        } else if (e.isFile()) yield path.join(dir, e.name);
    }
}

ipcMain.handle("fs:listFiles", async (_e, root) => {
    const out = [];
    for await (const f of walk(root)) {
        out.push(f);
        if (out.length >= 2e4) break;
    }
    return out;
});

ipcMain.handle("search:run", async (_e, root, query, {regex: regex, caseSensitive: caseSensitive, wholeWord: wholeWord, include: include, exclude: exclude}) => {
    let re;
    try {
        let src = regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (wholeWord) src = `\\b${src}\\b`;
        re = new RegExp(src, caseSensitive ? "g" : "gi");
    } catch (e) {
        return {
            error: "Invalid regular expression: " + e.message,
            results: []
        };
    }
    const globList = g => new RegExp(g.split(",").map(x => x.trim()).filter(Boolean).map(x => x.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")).join("|"), "i");
    const excludeRe = exclude && exclude.trim() ? globList(exclude) : null;
    const includeRe = include ? new RegExp(include.split(",").map(g => g.trim().replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")).join("|") + "$", "i") : null;
    const results = [];
    let total = 0;
    for await (const f of walk(root)) {
        if (includeRe && !includeRe.test(f)) continue;
        if (excludeRe && excludeRe.test(f)) continue;
        let text;
        try {
            const buf = await fsp.readFile(f);
            if (buf.length > 3e6 || buf.subarray(0, 8e3).includes(0)) continue;
            text = buf.toString("utf8");
        } catch {
            continue;
        }
        const matches = [];
        text.split(/\r?\n/).forEach((line, i) => {
            re.lastIndex = 0;
            const m = re.exec(line);
            if (m) matches.push({
                line: i + 1,
                col: m.index + 1,
                len: m[0].length,
                text: line.slice(0, 300)
            });
        });
        if (matches.length) {
            results.push({
                file: f,
                matches: matches
            });
            total += matches.length;
            if (total > 5e3) break;
        }
    }
    return {
        results: results,
        total: total
    };
});

ipcMain.handle("fs:watch", (e, root) => {
    const wc = e.sender;
    watchers.get(wc.id)?.close();
    watchers.delete(wc.id);
    if (!root) return;
    let watcher = null;
    let timer = null;
    const changed = new Set;
    try {
        watcher = fs.watch(root, {
            recursive: true
        }, (_ev, file) => {
            if (!file || file.split(/[\\/]/).some(p => IGNORED.has(p))) return;
            changed.add(path.join(root, file));
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (!wc.isDestroyed()) wc.send("fs:changed", [ ...changed ]);
                changed.clear();
            }, 300);
        });
        watchers.set(wc.id, watcher);
    } catch (e) {
        console.error("watch failed:", e.message);
    }
});

const discord = require("./discord");

discord.onStatus(msg => send("discord:status", msg));

ipcMain.handle("discord:update", (_e, config, activity) => discord.update(config, activity));

require("./extensions").register(ipcMain);

function defaultShell() {
    const s = readJson(SETTINGS_FILE, DEFAULT_SETTINGS).terminalShell;
    if (s) return s;
    return process.platform === "win32" ? "powershell.exe" : process.env.SHELL || "/bin/bash";
}

const SHIM_DIR = path.join(app.getPath("userData"), "bin");

function writeShims() {
    try {
        fs.mkdirSync(SHIM_DIR, {
            recursive: true
        });
        const exe = process.execPath;
        const appArg = app.isPackaged ? "" : ` "${app.getAppPath()}"`;
        const cmdText = `@echo off\r\nstart "" "${exe}"${appArg} %*\r\n`;
        const posixExe = exe.replace(/\\/g, "/");
        const posixApp = app.isPackaged ? "" : ` "${app.getAppPath().replace(/\\/g, "/")}"`;
        const shText = `#!/bin/sh\n"${posixExe}"${posixApp} "$@" >/dev/null 2>&1 &\n`;
        for (const name of [ "code", "codec" ]) {
            fs.writeFileSync(path.join(SHIM_DIR, `${name}.cmd`), cmdText);
            fs.writeFileSync(path.join(SHIM_DIR, name), shText);
        }
    } catch (e) {
        console.error("could not write code shims:", e.message);
    }
}

function terminalEnv() {
    const env = {
        ...process.env,
        TERM_PROGRAM: "codec",
        CODEC: "1"
    };
    for (const k of Object.keys(env)) if (/^KS_/.test(k)) delete env[k];
    const key = Object.keys(env).find(k => k.toLowerCase() === "path") || "PATH";
    env[key] = SHIM_DIR + path.delimiter + (env[key] || "");
    return env;
}

ipcMain.handle("term:available", () => !!pty);

ipcMain.handle("term:create", (e, id, cwd, cols, rows, shellOverride) => {
    if (!pty) throw new Error("The terminal is unavailable (node-pty failed to load).");
    const shellPath = shellOverride || defaultShell();
    const args = /powershell(\.exe)?$|pwsh(\.exe)?$/i.test(shellPath) ? [ "-NoLogo" ] : [];
    const p = pty.spawn(shellPath, args, {
        name: "xterm-256color",
        cols: cols || 80,
        rows: rows || 24,
        cwd: cwd && fs.existsSync(cwd) ? cwd : os.homedir(),
        env: terminalEnv()
    });
    const wc = e.sender;
    const key = `${wc.id}:${id}`;
    terminals.set(key, {
        p: p,
        wc: wc
    });
    p.onData(d => !wc.isDestroyed() && wc.send("term:data", id, d));
    p.onExit(({exitCode: exitCode}) => {
        terminals.delete(key);
        if (!wc.isDestroyed()) wc.send("term:exit", id, exitCode);
    });
    return path.basename(shellPath);
});

ipcMain.on("term:write", (e, id, data) => terminals.get(`${e.sender.id}:${id}`)?.p.write(data));

ipcMain.on("term:resize", (e, id, cols, rows) => {
    try {
        terminals.get(`${e.sender.id}:${id}`)?.p.resize(Math.max(cols, 2), Math.max(rows, 1));
    } catch {}
});

ipcMain.handle("term:kill", (e, id) => {
    const key = `${e.sender.id}:${id}`;
    terminals.get(key)?.p.kill();
    terminals.delete(key);
});

function pathFromArgs(argv, cwd = process.cwd()) {
    let args = argv.slice(1).filter(a => !a.startsWith("-"));
    if (!app.isPackaged) args = args.slice(1);
    for (const a of args) {
        const p = path.resolve(cwd, a);
        if (fs.existsSync(p)) return {
            path: p,
            isDir: fs.statSync(p).isDirectory(),
            reuse: argv.includes("-r") || argv.includes("--reuse-window")
        };
    }
    return null;
}

function openTarget(target) {
    if (process.env.KS_DEBUG) console.log(`[cli] openTarget ${JSON.stringify(target)} windows=${BrowserWindow.getAllWindows().length}`);
    if (!target) {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        } else createWindow(null);
        return;
    }
    if (target.isDir) {
        const existing = BrowserWindow.getAllWindows().find(w => w.codecFolder && path.resolve(w.codecFolder).toLowerCase() === target.path.toLowerCase());
        if (existing) {
            if (existing.isMinimized()) existing.restore();
            return existing.focus();
        }
        if (target.reuse && win) {
            win.focus();
            return win.webContents.send("open-folder", target.path);
        }
        return createWindow(target, {
            fresh: true
        });
    }
    if (!win) return createWindow(target);
    if (win.isMinimized()) win.restore();
    win.focus();
    win.webContents.send("open-file", target.path);
}

if (!process.env.KS_SCREENSHOT && !process.env.KS_PROBE && !app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on("second-instance", (_e, argv, workingDirectory) => openTarget(pathFromArgs(argv, workingDirectory)));
}

app.whenReady().then(() => {
    buildMenu();
    flushDeleted();
    writeShims();
    createWindow(pathFromArgs(process.argv));
    if (process.env.KS_AUTOQUIT) setTimeout(() => {
        console.log(`[autoquit] windows=${JSON.stringify(BrowserWindow.getAllWindows().map(w => w.getTitle()))}`);
        for (const w of BrowserWindow.getAllWindows()) w.forceClose = true;
        app.quit();
    }, Number(process.env.KS_AUTOQUIT));
    app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow(null));
});

app.on("before-quit", () => {
    discord.disconnect();
    previewServer?.close();
});

app.on("window-all-closed", () => {
    for (const w of watchers.values()) w.close();
    if (process.platform !== "darwin") app.quit();
});