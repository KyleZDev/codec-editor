"use strict";

const ExtUI = (() => {
    const state = {
        installed: [],
        popular: null,
        recIds: new Set,
        loadingMore: false,
        results: null,
        query: "",
        busy: new Set,
        collapsed: new Set,
        themes: [],
        themeCache: new Map,
        disposables: []
    };
    const OPEN_VSX = "https://open-vsx.org/extension";
    const fmtCount = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n || 0);
    const fmtSize = b => !b ? "-" : b >= 1048576 ? (b / 1048576).toFixed(2) + "MB" : (b / 1024).toFixed(1) + "KB";
    function ago(iso) {
        if (!iso) return "-";
        const s = (Date.now() - new Date(iso).getTime()) / 1e3;
        const units = [ [ "year", 31536e3 ], [ "month", 2592e3 ], [ "week", 604800 ], [ "day", 86400 ], [ "hour", 3600 ], [ "minute", 60 ] ];
        for (const [u, sec] of units) if (s >= sec) {
            const v = Math.floor(s / sec);
            return `${v} ${u}${v > 1 ? "s" : ""} ago`;
        }
        return "just now";
    }
    const isInstalled = id => state.installed.find(x => x.id === id);
    const iconSrc = x => x.localIcon ? fileUrl(x.localIcon) : x.icon || null;
    function iconEl(x, cls) {
        const src = iconSrc(x);
        if (src) {
            const img = el("img", cls);
            img.src = src;
            img.draggable = false;
            img.onerror = () => img.replaceWith(placeholderIcon(cls));
            return img;
        }
        return placeholderIcon(cls);
    }
    function placeholderIcon(cls) {
        const d = el("div", cls + " ext-icon-ph");
        d.append(el("i", "codicon codicon-extensions"));
        return d;
    }
    function stars(rating) {
        const box = el("span", "ext-stars");
        for (let i = 1; i <= 5; i++) {
            const full = rating >= i - .25;
            const half = !full && rating >= i - .75;
            box.append(el("i", "codicon codicon-" + (full ? "star-full" : half ? "star-half" : "star-empty")));
        }
        return box;
    }
    const verifiedBadge = () => {
        const v = el("i", "codicon codicon-verified-filled ext-verified");
        v.title = "Verified publisher";
        return v;
    };
    async function applyContributions() {
        for (const d of state.disposables) d.dispose?.();
        state.disposables = [];
        state.themes = [];
        for (const x of state.installed) {
            if (!x.enabled) continue;
            const c = x.contributes;
            for (const t of c.themes) state.themes.push({
                id: `ext:${x.id}:${t.label}`,
                label: t.label,
                uiTheme: t.uiTheme,
                path: t.path,
                extId: x.id,
                extName: x.displayName
            });
            for (const l of c.languages) await registerLanguage(l);
            for (const s of c.snippets) await registerSnippets(s);
        }
        if (String(settings.theme || "").startsWith("ext:") && !state.themes.some(t => t.id === settings.theme)) setSetting("theme", "dark"); else if (String(settings.theme || "").startsWith("ext:")) applySettings();
    }
    const toRegExp = v => {
        if (!v) return undefined;
        try {
            return typeof v === "string" ? new RegExp(v) : new RegExp(v.pattern, v.flags);
        } catch {
            return undefined;
        }
    };
    async function registerLanguage(l) {
        if (!l.id) return;
        if (!monaco.languages.getLanguages().some(x => x.id === l.id)) monaco.languages.register({
            id: l.id,
            aliases: l.aliases,
            extensions: l.extensions,
            filenames: l.filenames
        });
        FileIcons.addLanguage?.(l.id, l.extensions, l.filenames);
        if (!l.configuration) return;
        try {
            const c = await api.ext.readJsonc(l.configuration);
            const pair = p => Array.isArray(p) ? {
                open: p[0],
                close: p[1]
            } : p;
            const conf = {
                comments: c.comments,
                brackets: c.brackets,
                autoClosingPairs: (c.autoClosingPairs || []).map(pair),
                surroundingPairs: (c.surroundingPairs || []).map(pair),
                wordPattern: toRegExp(c.wordPattern)
            };
            if (c.indentationRules) {
                conf.indentationRules = {
                    increaseIndentPattern: toRegExp(c.indentationRules.increaseIndentPattern),
                    decreaseIndentPattern: toRegExp(c.indentationRules.decreaseIndentPattern)
                };
                if (!conf.indentationRules.increaseIndentPattern || !conf.indentationRules.decreaseIndentPattern) delete conf.indentationRules;
            }
            if (c.folding?.markers) conf.folding = {
                markers: {
                    start: toRegExp(c.folding.markers.start),
                    end: toRegExp(c.folding.markers.end)
                }
            };
            for (const k of Object.keys(conf)) if (conf[k] === undefined) delete conf[k];
            state.disposables.push(monaco.languages.setLanguageConfiguration(l.id, conf));
        } catch {}
    }
    async function registerSnippets(s) {
        if (!s.language) return;
        let data;
        try {
            data = await api.ext.readJsonc(s.path);
        } catch {
            return;
        }
        const items = Object.entries(data || {}).filter(([, v]) => v && v.body).flatMap(([name, v]) => (Array.isArray(v.prefix) ? v.prefix : [ v.prefix || name ]).map(prefix => ({
            name: name,
            prefix: prefix,
            body: Array.isArray(v.body) ? v.body.join("\n") : String(v.body),
            description: v.description || name
        })));
        if (!items.length) return;
        for (const lang of String(s.language).split(",").map(x => x.trim())) {
            state.disposables.push(monaco.languages.registerCompletionItemProvider(lang, {
                provideCompletionItems(model, position) {
                    const word = model.getWordUntilPosition(position);
                    const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                    return {
                        suggestions: items.map(it => ({
                            label: {
                                label: it.prefix,
                                description: it.name
                            },
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: it.description,
                            insertText: it.body,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range: range
                        }))
                    };
                }
            }));
        }
    }
    const SCOPE_MAP = [ [ "comment", [ "comment" ] ], [ "string.regexp", [ "regexp" ] ], [ "constant.character.escape", [ "string.escape" ] ], [ "string", [ "string" ] ], [ "constant.numeric", [ "number" ] ], [ "keyword.operator", [ "operator", "delimiter" ] ], [ "keyword", [ "keyword" ] ], [ "storage", [ "keyword" ] ], [ "constant.language", [ "keyword.constant", "predefined" ] ], [ "entity.name.type", [ "type", "type.identifier" ] ], [ "entity.name.class", [ "type", "type.identifier" ] ], [ "support.type", [ "type" ] ], [ "support.class", [ "type.identifier" ] ], [ "entity.name.function", [ "function" ] ], [ "support.function", [ "predefined", "function" ] ], [ "variable", [ "variable", "identifier" ] ], [ "entity.name.tag", [ "tag" ] ], [ "entity.other.attribute-name", [ "attribute.name" ] ], [ "punctuation", [ "delimiter" ] ], [ "markup.heading", [ "keyword.md" ] ], [ "markup.bold", [ "strong" ] ], [ "markup.italic", [ "emphasis" ] ], [ "meta.preprocessor", [ "meta" ] ] ];
    const hex = c => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c) ? c : null;
    function convertTheme(t, uiTheme) {
        const base = uiTheme === "vs" ? "vs" : uiTheme === "hc-black" ? "hc-black" : uiTheme === "hc-light" ? "hc-light" : "vs-dark";
        const rules = [];
        const fg = hex(t.colors?.["editor.foreground"] || t.colors?.foreground);
        if (fg) rules.push({
            token: "",
            foreground: fg.slice(1, 7)
        });
        for (const tc of t.tokenColors || []) {
            const st = tc.settings || {};
            const color = hex(st.foreground);
            if (!color && !st.fontStyle) continue;
            const scopes = Array.isArray(tc.scope) ? tc.scope : String(tc.scope || "").split(",");
            for (const raw of scopes) {
                const scope = raw.trim();
                if (!scope || scope.includes(" ")) continue;
                for (const [prefix, tokens] of SCOPE_MAP) {
                    if (scope === prefix || scope.startsWith(prefix + ".")) {
                        for (const token of tokens) rules.push({
                            token: token,
                            ...color ? {
                                foreground: color.slice(1, 7)
                            } : {},
                            ...st.fontStyle !== undefined ? {
                                fontStyle: st.fontStyle
                            } : {}
                        });
                        break;
                    }
                }
            }
        }
        const colors = {};
        for (const [k, v] of Object.entries(t.colors || {})) if (hex(v)) colors[k] = v;
        return {
            base: base,
            inherit: true,
            rules: rules,
            colors: colors
        };
    }
    async function loadTheme(themeId) {
        if (state.themeCache.has(themeId)) return state.themeCache.get(themeId);
        const t = state.themes.find(x => x.id === themeId);
        if (!t) return null;
        const data = await api.ext.loadTheme(t.path);
        const def = convertTheme(data, t.uiTheme);
        const monacoId = "ext-" + Math.abs([ ...themeId ].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7)).toString(36);
        monaco.editor.defineTheme(monacoId, def);
        const entry = {
            monacoId: monacoId,
            kind: def.base === "vs" || def.base === "hc-light" ? "light" : "dark",
            colors: data.colors || {}
        };
        state.themeCache.set(themeId, entry);
        return entry;
    }
    const CSS_MAP = {
        "editor.background": [ "--editor-bg", "--tab-active-bg" ],
        foreground: [ "--fg" ],
        descriptionForeground: [ "--fg-dim" ],
        "sideBar.background": [ "--side-bg" ],
        "sideBar.foreground": [ "--side-fg" ],
        "activityBar.background": [ "--act-bg" ],
        "activityBar.foreground": [ "--act-fg" ],
        "activityBar.inactiveForeground": [ "--act-fg-inactive" ],
        "titleBar.activeBackground": [ "--title-bg", "--shell-bg" ],
        "titleBar.activeForeground": [ "--title-fg" ],
        "editorGroupHeader.tabsBackground": [ "--tabs-bg" ],
        "tab.inactiveBackground": [ "--tab-bg" ],
        "tab.activeBackground": [ "--tab-active-bg" ],
        "tab.activeForeground": [ "--tab-active-fg" ],
        "tab.inactiveForeground": [ "--tab-fg" ],
        "tab.border": [ "--tab-border" ],
        "panel.background": [ "--panel-bg" ],
        "panel.border": [ "--border" ],
        "editorGroup.border": [ "--card-border" ],
        "list.hoverBackground": [ "--hover" ],
        "list.activeSelectionBackground": [ "--select" ],
        "list.inactiveSelectionBackground": [ "--select-inactive" ],
        focusBorder: [ "--focus" ],
        "button.background": [ "--accent" ],
        "button.hoverBackground": [ "--accent-hover" ],
        "input.background": [ "--input-bg" ],
        "input.border": [ "--input-border" ],
        "input.foreground": [ "--input-fg" ],
        "menu.background": [ "--menu-bg" ],
        "menu.selectionBackground": [ "--menu-sel" ],
        "menu.border": [ "--menu-border" ],
        "editorWidget.background": [ "--widget-bg" ],
        "textLink.foreground": [ "--link" ],
        "badge.background": [ "--badge" ],
        "statusBar.background": [ "--status-bg" ]
    };
    const ALL_VARS = [ ...new Set(Object.values(CSS_MAP).flat()) ];
    function clearWorkbenchColors() {
        for (const v of ALL_VARS) document.body.style.removeProperty(v);
    }
    function setWorkbenchColors(colors) {
        clearWorkbenchColors();
        for (const [key, vars] of Object.entries(CSS_MAP)) {
            const c = hex(colors[key]);
            if (c) for (const v of vars) document.body.style.setProperty(v, c);
        }
    }
    function applyTheme(themeId) {
        if (!String(themeId || "").startsWith("ext:")) {
            clearWorkbenchColors();
            return false;
        }
        loadTheme(themeId).then(t => {
            if (!t || settings.theme !== themeId) return;
            document.body.className = t.kind === "light" ? "theme-light" : "theme-dark";
            monaco.editor.setTheme(t.monacoId);
            setWorkbenchColors(t.colors);
            api.window.setOverlay(t.kind === "light" ? "light" : "dark");
        }).catch(e => toast(`Could not load theme: ${e.message}`, true));
        return true;
    }
    function themeMenuItems() {
        if (!state.themes.length) return [];
        return [ "-", ...state.themes.map(t => ({
            label: t.label,
            checked: settings.theme === t.id,
            run: () => setSetting("theme", t.id)
        })) ];
    }
    const themeOptions = () => [ [ "dark", "Dark Modern" ], [ "light", "Light Modern" ], ...state.themes.map(t => [ t.id, t.label ]) ];
    async function refreshInstalled() {
        state.installed = await api.ext.installed();
        await applyContributions();
        render();
        rerenderPages();
    }
    async function install(x, version) {
        const id = x.id || `${x.namespace}.${x.name}`;
        state.busy.add(id);
        render();
        rerenderPages();
        try {
            await api.ext.install(x.namespace, x.name, version);
            logOutput(`Installed extension ${id}`);
            await refreshInstalled();
            const inst = isInstalled(id);
            if (inst?.contributes.themes.length) toast(`${inst.displayName} installed. Use "Set Color Theme" to apply it.`); else toast(`${x.displayName || id} installed.`);
        } catch (e) {
            toast(`Failed to install ${x.displayName || id}: ${e.message}`, true);
        } finally {
            state.busy.delete(id);
            render();
            rerenderPages();
        }
    }
    async function uninstall(x) {
        state.busy.add(x.id);
        render();
        try {
            await api.ext.uninstall(x.id);
            logOutput(`Uninstalled extension ${x.id}`);
            await refreshInstalled();
        } catch (e) {
            toast(e.message, true);
        } finally {
            state.busy.delete(x.id);
            render();
            rerenderPages();
        }
    }
    async function setEnabled(x, v) {
        await api.ext.setEnabled(x.id, v);
        await refreshInstalled();
    }
    function gearMenu(x, ev) {
        const r = ev.currentTarget.getBoundingClientRect();
        openMenu([ x.enabled ? {
            label: "Disable",
            run: () => setEnabled(x, false)
        } : {
            label: "Enable",
            run: () => setEnabled(x, true)
        }, {
            label: "Uninstall",
            run: () => uninstall(x)
        }, "-", ...x.contributes.themes.length ? [ {
            label: "Set Color Theme",
            run: () => themePicker(x, ev)
        }, "-" ] : [], {
            label: "Auto Update",
            checked: x.autoUpdate,
            run: () => api.ext.setAutoUpdate(x.id, !x.autoUpdate).then(refreshInstalled)
        }, {
            label: "Copy Extension ID",
            run: () => navigator.clipboard.writeText(x.id)
        }, {
            label: "Open in Open VSX",
            run: () => window.open(`${OPEN_VSX}/${x.namespace}/${x.name}`)
        } ], r.left, r.bottom + 2);
    }
    function themePicker(x, ev) {
        const themes = state.themes.filter(t => t.extId === x.id);
        const r = ev.currentTarget.getBoundingClientRect();
        openMenu(themes.map(t => ({
            label: t.label,
            checked: settings.theme === t.id,
            run: () => setSetting("theme", t.id)
        })), r.left, r.bottom + 2);
    }
    function itemRow(x) {
        const id = x.id;
        const inst = isInstalled(id);
        const row = el("div", "ext-item" + (inst && !inst.enabled ? " disabled" : ""));
        const iconBox = el("div", "ext-icon-box");
        iconBox.append(iconEl(inst || x, "ext-icon"));
        if (!inst && state.recIds.has(id)) {
            const star = el("span", "ext-rec-badge");
            star.title = "Recommended";
            star.append(el("i", "codicon codicon-star-empty"));
            iconBox.append(star);
        }
        row.append(iconBox);
        const info = el("div", "ext-info");
        const top = el("div", "ext-top");
        top.append(el("span", "ext-name", inst?.displayName || x.displayName));
        if (!inst && x.downloadCount) {
            const meta = el("span", "ext-meta");
            meta.append(el("i", "codicon codicon-cloud-download"), document.createTextNode(fmtCount(x.downloadCount)));
            if (x.averageRating) meta.append(el("i", "codicon codicon-star-full ext-star"), document.createTextNode(String(Math.round(x.averageRating * 10) / 10)));
            top.append(meta);
        }
        info.append(top, el("div", "ext-desc", inst?.description || x.description));
        const bottom = el("div", "ext-bottom");
        const pub = el("span", "ext-pub");
        if (inst?.verified || x.verified) pub.append(verifiedBadge());
        pub.append(document.createTextNode(inst?.publisher || x.publisher));
        bottom.append(pub);
        if (state.busy.has(id)) bottom.append(el("span", "ext-busy", inst ? "Uninstalling..." : "Installing...")); else if (inst) {
            if (!inst.enabled) bottom.append(el("span", "ext-state", "Disabled"));
            const gear = el("button", "ext-gear");
            gear.title = "Manage";
            gear.append(el("i", "codicon codicon-settings-gear"));
            gear.onclick = e => {
                e.stopPropagation();
                gearMenu(inst, e);
            };
            bottom.append(gear);
        } else {
            const b = el("button", "ext-install", "Install");
            b.onclick = e => {
                e.stopPropagation();
                install(x);
            };
            bottom.append(b);
        }
        info.append(bottom);
        row.append(info);
        row.onclick = () => openPage(inst ? {
            namespace: inst.namespace,
            name: inst.name,
            displayName: inst.displayName
        } : x);
        return row;
    }
    function section(key, title, items, emptyText) {
        const frag = document.createDocumentFragment();
        const head = el("div", "ext-section");
        const open = !state.collapsed.has(key);
        head.append(el("i", "codicon codicon-chevron-" + (open ? "down" : "right")), el("span", null, title));
        if (items) head.append(el("span", "ext-count", String(items.length)));
        head.onclick = () => {
            open ? state.collapsed.add(key) : state.collapsed.delete(key);
            render();
        };
        frag.append(head);
        if (open) {
            if (!items) frag.append(el("div", "ext-empty", "Loading...")); else if (!items.length) frag.append(el("div", "ext-empty", emptyText)); else for (const x of items) frag.append(itemRow(x));
        }
        return frag;
    }
    function render(keepScroll = true) {
        const body = $("#ext-body");
        if (!body || $("#view-extensions").classList.contains("hidden")) return;
        const scroll = body.scrollTop;
        const frag = document.createDocumentFragment();
        if (state.query) {
            const r = state.results;
            frag.append(section("results", r ? `Open VSX (${r.total.toLocaleString("en-US")})` : "Open VSX", r?.items || null, "No extensions found."));
            if (r && r.items.length < r.total) frag.append(el("div", "ext-empty", state.loadingMore ? "Loading more..." : "Scroll to load more"));
        } else {
            frag.append(section("installed", "Installed", state.installed, "No extensions installed."));
            const rec = state.popular?.filter(x => !isInstalled(x.id)) ?? null;
            frag.append(section("popular", "Recommended", rec, "No recommendations right now."));
        }
        body.replaceChildren(frag);
        if (keepScroll) body.scrollTop = scroll;
    }
    const REC = {
        python: [ "ms-python.python", "ms-python.debugpy", "ms-python.black-formatter" ],
        javascript: [ "dbaeumer.vscode-eslint", "esbenp.prettier-vscode" ],
        typescript: [ "dbaeumer.vscode-eslint", "esbenp.prettier-vscode" ],
        html: [ "ecmel.vscode-html-css", "ritwickdey.LiveServer" ],
        css: [ "ecmel.vscode-html-css", "bradlc.vscode-tailwindcss" ],
        scss: [ "ecmel.vscode-html-css" ],
        rust: [ "rust-lang.rust-analyzer", "tamasfe.even-better-toml" ],
        go: [ "golang.Go" ],
        c: [ "llvm-vs-code-extensions.vscode-clangd", "ms-vscode.cpptools-themes" ],
        cpp: [ "llvm-vs-code-extensions.vscode-clangd", "ms-vscode.cpptools-themes" ],
        csharp: [ "muhammad-sammy.csharp" ],
        java: [ "redhat.java", "vscjava.vscode-java-debug" ],
        kotlin: [ "fwcd.kotlin" ],
        lua: [ "sumneko.lua" ],
        luau: [ "JohnnyMorganz.luau-lsp" ],
        php: [ "bmewburn.vscode-intelephense-client" ],
        ruby: [ "Shopify.ruby-lsp" ],
        dart: [ "Dart-Code.dart-code" ],
        markdown: [ "yzhang.markdown-all-in-one", "DavidAnson.vscode-markdownlint" ],
        yaml: [ "redhat.vscode-yaml" ],
        xml: [ "redhat.vscode-xml" ],
        toml: [ "tamasfe.even-better-toml" ],
        sql: [ "mtxr.sqltools" ],
        mysql: [ "mtxr.sqltools" ],
        pgsql: [ "mtxr.sqltools" ],
        powershell: [ "ms-vscode.powershell" ],
        shell: [ "mads-hartmann.bash-ide-vscode", "timonwong.shellcheck" ],
        dockerfile: [ "ms-azuretools.vscode-docker" ],
        graphql: [ "graphql.vscode-graphql" ],
        hcl: [ "hashicorp.terraform" ],
        sol: [ "JuanBlanco.solidity" ],
        julia: [ "julialang.language-julia" ],
        r: [ "REditorSupport.r" ],
        scala: [ "scalameta.metals" ],
        elixir: [ "elixir-lsp.elixir-ls" ],
        zig: [ "ziglang.vscode-zig" ],
        vue: [ "Vue.volar" ],
        svelte: [ "svelte.svelte-vscode" ],
        git: [ "eamodio.gitlens" ]
    };
    const GENERAL = [ "eamodio.gitlens", "usernamehw.errorlens", "christian-kohler.path-intellisense", "PKief.material-icon-theme", "dracula-theme.theme-dracula", "GitHub.github-vscode-theme" ];
    function usedLanguages() {
        const counts = new Map;
        const add = (p, w = 1) => {
            const name = P.basename(p);
            const lower = name.toLowerCase();
            let lang = lower.endsWith(".vue") ? "vue" : lower.endsWith(".svelte") ? "svelte" : FileIcons.language(name);
            if (lang && lang !== "plaintext") counts.set(lang, (counts.get(lang) || 0) + w);
        };
        const inRoot = f => !S.root || f.toLowerCase().startsWith(S.root.toLowerCase());
        for (const f of (S.recentFiles || []).filter(inRoot)) add(f, 3);
        for (const t of S.tabs) if (t.path) add(t.path, 3);
        for (const f of (S.fileList || []).slice(0, 4e3)) add(f, 1);
        for (const it of S.dirCache.get(S.root) || []) {
            if (!it.isDir) add(it.path, 1);
            if (it.name === ".git") counts.set("git", 50);
        }
        return [ ...counts.entries() ].sort((a, b) => b[1] - a[1]).map(([l]) => l);
    }
    async function loadPopular(force = false) {
        if (state.popular && !force) return;
        if (S.root && !S.fileList) S.fileList = await api.fs.listFiles(S.root).catch(() => []);
        if (S.root && await api.fs.exists(P.join(S.root, ".git"))) usedLanguagesGit = true;
        const langs = usedLanguages();
        if (usedLanguagesGit) langs.push("git");
        const ids = [ ...new Set(langs.flatMap(l => REC[l] || [])) ];
        for (const g of GENERAL) if (ids.length < 8 && !ids.includes(g)) ids.push(g);
        state.recIds = new Set(ids);
        const items = await Promise.all(ids.slice(0, 14).map(async id => {
            const [ns, ...rest] = id.split(".");
            try {
                return await api.ext.details(ns, rest.join("."));
            } catch {
                return null;
            }
        }));
        state.popular = items.filter(Boolean);
        render();
    }
    let usedLanguagesGit = false;
    async function loadMore() {
        const r = state.results;
        if (!state.query || !r || state.loadingMore || r.items.length >= r.total) return;
        state.loadingMore = true;
        try {
            const more = await api.ext.search(state.query, {
                size: 40,
                offset: r.items.length
            });
            if (state.results === r) r.items.push(...more.items.filter(x => !r.items.some(y => y.id === x.id)));
        } catch {}
        state.loadingMore = false;
        render(true);
    }
    let searchTimer;
    function onSearch() {
        clearTimeout(searchTimer);
        state.query = $("#ext-search").value.trim();
        state.results = null;
        render();
        if (!state.query) return;
        const q = state.query;
        searchTimer = setTimeout(async () => {
            try {
                const r = await api.ext.search(q, {
                    size: 50
                });
                if (q === state.query) state.results = r;
            } catch (e) {
                state.results = {
                    items: [],
                    total: 0
                };
                toast(e.message, true);
            }
            render();
        }, 350);
    }
    function openPage(x) {
        let tab = S.tabs.find(t => t.kind === "extension" && t.ext.namespace === x.namespace && t.ext.name === x.name);
        if (!tab) {
            tab = {
                id: nextId++,
                path: null,
                title: `Extension: ${x.displayName || x.name}`,
                kind: "extension",
                ext: {
                    namespace: x.namespace,
                    name: x.name
                },
                model: null,
                savedVersion: 0,
                page: "details"
            };
            S.tabs.push(tab);
        }
        activateTab(tab.id);
    }
    function rerenderPages() {
        const t = currentTab();
        if (t?.kind === "extension") renderPage($("#media-view"), t, true);
    }
    function md(text) {
        const html = DOMPurify.sanitize(marked.parse(text || "", {
            gfm: true
        }), {
            ADD_ATTR: [ "target" ]
        });
        const box = el("div", "ext-md");
        box.innerHTML = html;
        box.querySelectorAll("a[href]").forEach(a => {
            a.onclick = e => {
                e.preventDefault();
                const href = a.getAttribute("href");
                if (/^https?:/i.test(href)) window.open(href);
            };
        });
        box.querySelectorAll("img").forEach(img => {
            if (!/^(https?:|data:)/i.test(img.getAttribute("src") || "")) img.remove();
        });
        return box;
    }
    async function renderPage(view, tab, keepScroll = false) {
        const key = `${tab.ext.namespace}.${tab.ext.name}`;
        const scroller = view.querySelector(".ext-page-main");
        const scroll = keepScroll && scroller ? scroller.scrollTop : 0;
        if (!tab.details) {
            view.replaceChildren(el("div", "ext-loading", "Loading extension..."));
            try {
                tab.details = await api.ext.details(tab.ext.namespace, tab.ext.name);
            } catch (e) {
                const inst = isInstalled(key);
                tab.details = inst ? {
                    ...inst,
                    offline: true
                } : null;
                if (!inst) return view.replaceChildren(el("div", "ext-loading", `Could not load this extension: ${e.message}`));
            }
            if (currentTab() !== tab) return;
        }
        const d = tab.details;
        const inst = isInstalled(key);
        const page = el("div", "ext-page");
        const head = el("div", "ext-page-head");
        head.append(iconEl(inst?.localIcon ? inst : d, "ext-page-icon"));
        const hi = el("div", "ext-page-info");
        const title = el("div", "ext-page-title");
        title.append(el("span", null, d.displayName));
        if (d.preRelease) title.append(el("span", "ext-chip", "pre-release"));
        const sub = el("div", "ext-page-sub");
        const pub = el("span", "ext-page-pub");
        pub.append(document.createTextNode(d.publisher));
        if (d.verified) pub.append(verifiedBadge());
        sub.append(pub);
        if (d.downloadCount) {
            sub.append(el("span", "ext-sep"));
            const dl = el("span", "ext-page-dl");
            dl.append(el("i", "codicon codicon-cloud-download"), document.createTextNode(Number(d.downloadCount).toLocaleString("en-US")));
            sub.append(dl);
        }
        if (d.averageRating) {
            sub.append(el("span", "ext-sep"));
            const rt = el("span", "ext-page-rating");
            rt.append(stars(d.averageRating), document.createTextNode(`(${d.reviewCount || 0})`));
            sub.append(rt);
        }
        const actions = el("div", "ext-page-actions");
        const split = (label, primary, onMain, menuItems) => {
            const box = el("div", "ext-split" + (primary ? " primary" : ""));
            const main = el("button", "ext-split-main", label);
            main.onclick = onMain;
            const drop = el("button", "ext-split-drop");
            drop.append(el("i", "codicon codicon-chevron-down"));
            drop.onclick = e => {
                const r = e.currentTarget.getBoundingClientRect();
                openMenu(typeof menuItems === "function" ? menuItems() : menuItems, r.left, r.bottom + 2);
            };
            box.append(main, drop);
            return box;
        };
        const versionMenu = () => (d.versions || []).length ? [ {
            label: "Install Specific Version...",
            submenu: () => d.versions.map(v => ({
                label: v,
                checked: inst?.version === v,
                run: () => install({
                    ...d,
                    id: key
                }, v)
            }))
        } ] : [ {
            label: "Install Specific Version...",
            disabled: true
        } ];
        if (state.busy.has(key)) actions.append(el("span", "ext-busy", inst ? "Working..." : "Installing...")); else if (inst) {
            if (inst.contributes.themes.length) {
                const st = el("button", "ext-btn", "Set Color Theme");
                st.onclick = e => themePicker(inst, e);
                actions.append(st);
            }
            actions.append(split(inst.enabled ? "Disable" : "Enable", false, () => setEnabled(inst, !inst.enabled), [ inst.enabled ? {
                label: "Disable",
                run: () => setEnabled(inst, false)
            } : {
                label: "Enable",
                run: () => setEnabled(inst, true)
            } ]), split("Uninstall", false, () => uninstall(inst), () => [ {
                label: "Uninstall",
                run: () => uninstall(inst)
            }, "-", ...versionMenu() ]));
            const au = el("label", "ext-auto");
            const cb = el("input");
            cb.type = "checkbox";
            cb.checked = inst.autoUpdate;
            cb.onchange = () => api.ext.setAutoUpdate(inst.id, cb.checked).then(refreshInstalled);
            au.append(cb, document.createTextNode("Auto Update"));
            const gear = el("button", "ext-gear");
            gear.title = "Manage";
            gear.append(el("i", "codicon codicon-settings-gear"));
            gear.onclick = e => gearMenu(inst, e);
            actions.append(au, gear);
        } else {
            actions.append(split("Install", true, () => install({
                ...d,
                id: key
            }), versionMenu));
            const au = el("label", "ext-auto");
            const cb = el("input");
            cb.type = "checkbox";
            cb.checked = true;
            cb.disabled = true;
            au.append(cb, document.createTextNode("Auto Update"));
            actions.append(au);
        }
        const recNote = !inst && state.recIds.has(key) ? (() => {
            const n = el("div", "ext-rec-note");
            n.append(el("i", "codicon codicon-star-empty"), el("span", null, "This extension is recommended based on the files you recently opened."));
            return n;
        })() : null;
        hi.append(title, sub, el("div", "ext-page-desc", d.description || ""), actions);
        if (recNote) hi.append(recNote);
        head.append(hi);
        page.append(head);
        if (inst && (inst.contributes.hasCode || inst.contributes.grammars)) {
            const used = [ inst.contributes.themes.length && "color themes", inst.contributes.snippets.length && "snippets", inst.contributes.languages.length && "language settings" ].filter(Boolean);
            const note = el("div", "ext-note");
            note.append(el("i", "codicon codicon-info"), el("span", null, used.length ? `Codec uses this extension's ${used.join(", ")}. Features that run code (IntelliSense, debuggers, commands) are not supported yet.` : "This extension runs code (IntelliSense, debuggers, commands), which Codec does not support yet. It is installed but has no effect."));
            page.append(note);
        }
        const tabs = el("div", "ext-tabs");
        for (const [k, label] of [ [ "details", "DETAILS" ], [ "features", "FEATURES" ], [ "changelog", "CHANGELOG" ] ]) {
            const t = el("button", "ext-tab" + (tab.page === k ? " active" : ""), label);
            t.onclick = () => {
                tab.page = k;
                renderPage(view, tab);
            };
            tabs.append(t);
        }
        page.append(tabs);
        const body = el("div", "ext-page-body");
        const main = el("div", "ext-page-main");
        const side = el("div", "ext-page-side");
        body.append(main, side);
        page.append(body);
        const group = (titleText, rows) => {
            const g = el("div", "ext-side-group");
            g.append(el("div", "ext-side-title", titleText));
            const tbl = el("div", "ext-side-table");
            for (const [k, v, cls] of rows) {
                tbl.append(el("span", "k", k));
                const val = el("span", "v " + (cls || ""), v);
                tbl.append(val);
            }
            g.append(tbl);
            return g;
        };
        if (inst) side.append(group("Installation", [ [ "Identifier", inst.id, "mono" ], [ "Version", inst.version, "mono" ], [ "Last Updated", ago(inst.installedAt) ], [ "Size", fmtSize(inst.size), "link" ] ]));
        if (!d.offline) side.append(group("Marketplace", [ [ "Publisher", d.publisher ], [ "Last Released", ago(d.timestamp) ], [ "Version", d.version, "mono" ] ]));
        if (d.categories?.length) {
            const g = el("div", "ext-side-group");
            g.append(el("div", "ext-side-title", "Categories"));
            const chips = el("div", "ext-chips");
            for (const c of d.categories) chips.append(el("span", "ext-cat", c));
            g.append(chips);
            side.append(g);
        }
        const res = [];
        if (d.repository) res.push([ "Repository", d.repository.replace(/^git\+/, "").replace(/\.git$/, ""), "repo" ]);
        if (d.bugs) res.push([ "Issues", typeof d.bugs === "string" ? d.bugs : d.bugs.url, "issues" ]);
        if (d.homepage && d.homepage !== d.repository) res.push([ "Homepage", d.homepage, "home" ]);
        if (d.licenseUrl) res.push([ d.license ? `License (${d.license})` : "License", d.licenseUrl, "law" ]);
        res.push([ "Open VSX", `${OPEN_VSX}/${tab.ext.namespace}/${tab.ext.name}`, "link-external" ]);
        const rg = el("div", "ext-side-group");
        rg.append(el("div", "ext-side-title", "Resources"));
        for (const [label, url, icon] of res) {
            const a = el("a", "ext-res");
            a.href = "#";
            a.append(el("i", "codicon codicon-" + icon), document.createTextNode(label));
            a.onclick = e => {
                e.preventDefault();
                window.open(url);
            };
            rg.append(a);
        }
        side.append(rg);
        view.replaceChildren(page);
        if (tab.page === "features") {
            main.append(renderFeatures(inst, tab));
        } else {
            const url = tab.page === "details" ? d.readmeUrl : d.changelogUrl;
            const cacheKey = tab.page + "Text";
            if (tab[cacheKey] === undefined) {
                main.append(el("div", "ext-loading", "Loading..."));
                try {
                    tab[cacheKey] = url ? await api.ext.text(url) : null;
                } catch {
                    tab[cacheKey] = null;
                }
                if (currentTab() !== tab || tab.page + "Text" !== cacheKey) return;
                main.replaceChildren();
            }
            main.append(tab[cacheKey] ? md(tab[cacheKey]) : el("div", "ext-empty", tab.page === "details" ? "No README available." : "No changelog available."));
        }
        main.scrollTop = scroll;
    }
    function renderFeatures(inst) {
        const box = el("div", "ext-features");
        if (!inst) {
            box.append(el("p", null, "Install the extension to see which of its features Codec can use."));
            return box;
        }
        const c = inst.contributes;
        const rows = [ [ "Color Themes", c.themes.length, true, c.themes.map(t => t.label).join(", ") ], [ "Snippets", c.snippets.length, true, c.snippets.map(s => s.language).join(", ") ], [ "Languages", c.languages.length, true, c.languages.map(l => l.aliases[0] || l.id).join(", ") ], [ "Syntax Grammars (TextMate)", c.grammars, false, "" ], [ "Commands", c.commands, false, "" ], [ "File Icon Themes", c.iconThemes, false, "" ], [ "Extension Code", c.hasCode ? 1 : 0, false, "" ] ].filter(r => r[1]);
        if (!rows.length) {
            box.append(el("p", null, "This extension does not contribute any features."));
            return box;
        }
        const tbl = el("div", "ext-feat-table");
        for (const [name, count, ok, detail] of rows) {
            const r = el("div", "ext-feat-row");
            r.append(el("i", "codicon codicon-" + (ok ? "pass-filled ok" : "circle-slash no")), el("span", "n", `${name}${typeof count === "number" && count > 1 ? ` (${count})` : ""}`), el("span", "d", ok ? detail || "Supported" : "Not supported in Codec yet"));
            tbl.append(r);
        }
        box.append(tbl);
        return box;
    }
    async function init() {
        $("#ext-search").addEventListener("input", onSearch);
        $("#ext-body").addEventListener("scroll", e => {
            const b = e.currentTarget;
            if (b.scrollTop + b.clientHeight > b.scrollHeight - 200) loadMore();
        });
        $("#btn-ext-clear").onclick = () => {
            $("#ext-search").value = "";
            onSearch();
        };
        $("#btn-ext-refresh").onclick = async () => {
            state.popular = null;
            await refreshInstalled();
            loadPopular(true);
            if (state.query) onSearch();
        };
        $("#btn-ext-more").onclick = e => {
            const r = e.currentTarget.getBoundingClientRect();
            openMenu([ {
                label: "Check for Extension Updates",
                run: checkUpdates
            }, {
                label: "Refresh",
                run: () => $("#btn-ext-refresh").click()
            }, "-", {
                label: "Browse Open VSX",
                run: () => window.open("https://open-vsx.org")
            } ], r.left, r.bottom + 2);
        };
        try {
            state.installed = await api.ext.installed();
            await applyContributions();
        } catch (e) {
            logOutput(`Extensions: ${e.message}`);
        }
        setTimeout(checkUpdates, 8e3, true);
    }
    async function checkUpdates(silent) {
        try {
            const updated = await api.ext.checkUpdates();
            if (updated.length) {
                await refreshInstalled();
                state.themeCache.clear();
                toast(`Updated: ${updated.join(", ")}`);
            } else if (silent !== true) toast("All extensions are up to date.");
        } catch (e) {
            if (silent !== true) toast(e.message, true);
        }
    }
    function onShow() {
        render();
        loadPopular(true);
        $("#ext-search").focus();
    }
    function tabIcon() {
        const i = el("i", "codicon codicon-extensions tab-ext-icon");
        return i;
    }
    return {
        init: init,
        onShow: onShow,
        render: render,
        renderPage: renderPage,
        tabIcon: tabIcon,
        applyTheme: applyTheme,
        themeMenuItems: themeMenuItems,
        themeOptions: themeOptions,
        openPage: openPage
    };
})();