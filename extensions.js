const {app: app, net: net} = require("electron");

const path = require("node:path");

const fs = require("node:fs");

const fsp = require("node:fs/promises");

const AdmZip = require("adm-zip");

const REGISTRY = "https://open-vsx.org/api";

const EXT_DIR = path.join(app.getPath("userData"), "extensions");

const INDEX = path.join(EXT_DIR, "extensions.json");

async function getJson(url) {
    const res = await net.fetch(url, {
        headers: {
            Accept: "application/json"
        }
    });
    if (!res.ok) throw new Error(`Open VSX request failed (${res.status})`);
    return res.json();
}

async function getText(url) {
    const res = await net.fetch(url);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.text();
}

function readIndex() {
    try {
        return JSON.parse(fs.readFileSync(INDEX, "utf8"));
    } catch {
        return {};
    }
}

function writeIndex(idx) {
    fs.mkdirSync(EXT_DIR, {
        recursive: true
    });
    fs.writeFileSync(INDEX, JSON.stringify(idx, null, 2));
}

function parseJsonc(text) {
    let out = "";
    let i = 0;
    let inStr = false;
    while (i < text.length) {
        const c = text[i];
        const n = text[i + 1];
        if (inStr) {
            out += c;
            if (c === "\\") {
                out += n ?? "";
                i += 2;
                continue;
            }
            if (c === '"') inStr = false;
            i++;
        } else if (c === '"') {
            inStr = true;
            out += c;
            i++;
        } else if (c === "/" && n === "/") {
            while (i < text.length && text[i] !== "\n") i++;
        } else if (c === "/" && n === "*") {
            i += 2;
            while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
            i += 2;
        } else {
            out += c;
            i++;
        }
    }
    return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1").replace(/^﻿/, ""));
}

async function loadTheme(file, depth = 0) {
    const data = parseJsonc(await fsp.readFile(file, "utf8"));
    if (data.include && depth < 5) {
        const base = await loadTheme(path.resolve(path.dirname(file), data.include), depth + 1);
        data.colors = {
            ...base.colors,
            ...data.colors
        };
        data.tokenColors = [ ...base.tokenColors || [], ...Array.isArray(data.tokenColors) ? data.tokenColors : [] ];
        data.type = data.type || base.type;
    }
    if (typeof data.tokenColors === "string") {
        const t = parseJsonc(await fsp.readFile(path.resolve(path.dirname(file), data.tokenColors), "utf8"));
        data.tokenColors = t.settings || t.tokenColors || [];
    }
    return data;
}

function summarize(e) {
    return {
        id: `${e.namespace}.${e.name}`,
        namespace: e.namespace,
        name: e.name,
        displayName: e.displayName || e.name,
        description: e.description || "",
        version: e.version,
        icon: e.files?.icon || null,
        downloadCount: e.downloadCount || 0,
        averageRating: e.averageRating || 0,
        reviewCount: e.reviewCount || 0,
        verified: !!e.verified,
        timestamp: e.timestamp,
        publisher: e.namespaceDisplayName || e.namespace
    };
}

function contributionsOf(manifest, dir) {
    const c = manifest.contributes || {};
    return {
        themes: (c.themes || []).map(t => ({
            label: t.label || t.id || "Theme",
            uiTheme: t.uiTheme || "vs-dark",
            path: path.join(dir, t.path)
        })),
        snippets: (c.snippets || []).filter(s => s.path).map(s => ({
            language: s.language,
            path: path.join(dir, s.path)
        })),
        languages: (c.languages || []).map(l => ({
            id: l.id,
            aliases: l.aliases || [],
            extensions: l.extensions || [],
            filenames: l.filenames || [],
            configuration: l.configuration ? path.join(dir, l.configuration) : null
        })),
        grammars: (c.grammars || []).length,
        commands: (c.commands || []).length,
        iconThemes: (c.iconThemes || []).length,
        hasCode: !!(manifest.main || manifest.browser)
    };
}

function installed() {
    const idx = readIndex();
    const list = [];
    for (const [id, entry] of Object.entries(idx)) {
        const dir = path.join(EXT_DIR, entry.folder);
        let manifest;
        try {
            manifest = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
        } catch {
            continue;
        }
        const icon = manifest.icon && fs.existsSync(path.join(dir, manifest.icon)) ? path.join(dir, manifest.icon) : null;
        list.push({
            id: id,
            namespace: entry.namespace,
            name: entry.name,
            displayName: manifest.displayName || manifest.name,
            description: manifest.description || "",
            version: manifest.version,
            publisher: entry.publisher || manifest.publisher || entry.namespace,
            verified: !!entry.verified,
            enabled: entry.enabled !== false,
            autoUpdate: entry.autoUpdate !== false,
            installedAt: entry.installedAt,
            size: entry.size || 0,
            localIcon: icon,
            dir: dir,
            contributes: contributionsOf(manifest, dir)
        });
    }
    return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function dirSize(dir) {
    let total = 0;
    for (const e of await fsp.readdir(dir, {
        withFileTypes: true
    })) {
        const p = path.join(dir, e.name);
        total += e.isDirectory() ? await dirSize(p) : (await fsp.stat(p)).size;
    }
    return total;
}

async function install(namespace, name, version) {
    const info = await getJson(`${REGISTRY}/${namespace}/${name}${version ? "/" + encodeURIComponent(version) : ""}`);
    if (!info.files?.download) throw new Error("This extension has no downloadable package.");
    const res = await net.fetch(info.files.download);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    const id = `${namespace}.${name}`;
    const folder = `${id}-${info.version}`;
    const dest = path.join(EXT_DIR, folder);
    const tmp = dest + ".tmp";
    await fsp.rm(tmp, {
        recursive: true,
        force: true
    });
    await fsp.mkdir(tmp, {
        recursive: true
    });
    const zip = new AdmZip(buf);
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory || !entry.entryName.startsWith("extension/")) continue;
        const rel = entry.entryName.slice("extension/".length);
        const target = path.resolve(tmp, rel);
        if (!target.startsWith(path.resolve(tmp) + path.sep)) continue;
        await fsp.mkdir(path.dirname(target), {
            recursive: true
        });
        await fsp.writeFile(target, entry.getData());
    }
    if (!fs.existsSync(path.join(tmp, "package.json"))) throw new Error("Invalid extension package (missing package.json).");
    const idx = readIndex();
    const old = idx[id];
    if (old) await fsp.rm(path.join(EXT_DIR, old.folder), {
        recursive: true,
        force: true
    });
    await fsp.rm(dest, {
        recursive: true,
        force: true
    });
    await fsp.rename(tmp, dest);
    idx[id] = {
        namespace: namespace,
        name: name,
        folder: folder,
        version: info.version,
        publisher: info.namespaceDisplayName || namespace,
        verified: !!info.verified,
        enabled: old ? old.enabled : true,
        autoUpdate: old ? old.autoUpdate : true,
        installedAt: (new Date).toISOString(),
        size: await dirSize(dest)
    };
    writeIndex(idx);
    return id;
}

async function uninstall(id) {
    const idx = readIndex();
    const entry = idx[id];
    if (!entry) return;
    await fsp.rm(path.join(EXT_DIR, entry.folder), {
        recursive: true,
        force: true
    });
    delete idx[id];
    writeIndex(idx);
}

function setFlag(id, key, value) {
    const idx = readIndex();
    if (!idx[id]) return;
    idx[id][key] = value;
    writeIndex(idx);
}

async function checkUpdates() {
    const updated = [];
    for (const [id, entry] of Object.entries(readIndex())) {
        if (entry.autoUpdate === false) continue;
        try {
            const info = await getJson(`${REGISTRY}/${entry.namespace}/${entry.name}`);
            if (info.version && info.version !== entry.version) {
                await install(entry.namespace, entry.name);
                updated.push(`${info.displayName || id} ${info.version}`);
            }
        } catch {}
    }
    return updated;
}

function register(ipcMain) {
    ipcMain.handle("ext:search", async (_e, query, opts = {}) => {
        const params = new URLSearchParams({
            query: query || "",
            size: String(opts.size || 30),
            offset: String(opts.offset || 0),
            sortBy: opts.sortBy || (query ? "relevance" : "downloadCount"),
            sortOrder: "desc"
        });
        if (opts.category) params.set("category", opts.category);
        const data = await getJson(`${REGISTRY}/-/search?${params}`);
        return {
            total: data.totalSize || 0,
            items: (data.extensions || []).filter(e => !e.deprecated).map(summarize)
        };
    });
    ipcMain.handle("ext:details", async (_e, namespace, name) => {
        const d = await getJson(`${REGISTRY}/${namespace}/${name}`);
        return {
            ...summarize(d),
            categories: d.categories || [],
            tags: d.tags || [],
            license: d.license || "",
            repository: d.repository || "",
            homepage: d.homepage || "",
            bugs: d.bugs || "",
            preRelease: !!d.preRelease,
            readmeUrl: d.files?.readme || null,
            changelogUrl: d.files?.changelog || null,
            licenseUrl: d.files?.license || null,
            size: d.downloadSizes ? Object.values(d.downloadSizes)[0] : null,
            versions: Object.keys(d.allVersions || {}).filter(v => /^\d/.test(v)).slice(0, 30),
            manifestUrl: d.files?.manifest || null,
            publishedBy: d.publishedBy?.loginName || ""
        };
    });
    ipcMain.handle("ext:text", (_e, url) => getText(url));
    ipcMain.handle("ext:installed", () => installed());
    ipcMain.handle("ext:install", (_e, namespace, name, version) => install(namespace, name, version));
    ipcMain.handle("ext:uninstall", (_e, id) => uninstall(id));
    ipcMain.handle("ext:setEnabled", (_e, id, v) => setFlag(id, "enabled", v));
    ipcMain.handle("ext:setAutoUpdate", (_e, id, v) => setFlag(id, "autoUpdate", v));
    ipcMain.handle("ext:checkUpdates", () => checkUpdates());
    ipcMain.handle("ext:loadTheme", (_e, file) => loadTheme(file));
    ipcMain.handle("ext:readJsonc", async (_e, file) => parseJsonc(await fsp.readFile(file, "utf8")));
}

module.exports = {
    register: register
};