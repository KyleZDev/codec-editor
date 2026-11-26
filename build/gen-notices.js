const fs = require("node:fs");

const path = require("node:path");

const {execSync: execSync} = require("node:child_process");

const root = path.resolve(__dirname, "..");

const tree = JSON.parse(execSync("npm ls --omit=dev --all --json", {
    cwd: root,
    encoding: "utf8",
    stdio: [ "ignore", "pipe", "ignore" ]
}));

const seen = new Map;

(function walk(deps) {
    for (const [name, info] of Object.entries(deps || {})) {
        const key = `${name}@${info.version}`;
        if (!seen.has(key)) seen.set(key, {
            name: name,
            version: info.version
        });
        walk(info.dependencies);
    }
})(tree.dependencies);

function findLicense(dir) {
    if (!fs.existsSync(dir)) return null;
    const file = fs.readdirSync(dir).find(f => /^(licen[cs]e|copying|notice)(\.|$)/i.test(f));
    return file ? fs.readFileSync(path.join(dir, file), "utf8").trim() : null;
}

const parts = [];

for (const {name: name, version: version} of [ ...seen.values() ].sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = path.join(root, "node_modules", ...name.split("/"));
    let pkg = {};
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    } catch {}
    const text = findLicense(dir) || `License: ${pkg.license || "see package"}${pkg.author ? `\nAuthor: ${typeof pkg.author === "string" ? pkg.author : pkg.author.name}` : ""}`;
    parts.push(`${"-".repeat(79)}\n${name} ${version}\nLicense: ${pkg.license || "see below"}\n${pkg.homepage || pkg.repository && (pkg.repository.url || pkg.repository) || ""}\n${"-".repeat(79)}\n\n${text}\n`);
}

const electronVersion = require(path.join(root, "node_modules", "electron", "package.json")).version;

const header = `CODEC - THIRD-PARTY NOTICES\n===========================\n\nCodec is proprietary software (see LICENSE.txt). It includes the open-source\ncomponents listed below, each distributed under its own license. Their\ncopyright notices and license texts are reproduced here as those licenses\nrequire.\n\nElectron ${electronVersion} (MIT) and Chromium are also included; their license texts\nare shipped next to the executable as LICENSE.electron.txt and\nLICENSES.chromium.html.\n\n`;

fs.writeFileSync(path.join(root, "THIRD_PARTY_NOTICES.txt"), header + parts.join("\n"));

console.log(`THIRD_PARTY_NOTICES.txt: ${seen.size} packages`);