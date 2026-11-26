const {Client: Client} = require("@xhayper/discord-rpc");

let client = null;

let ready = false;

let clientId = null;

let pending = null;

let retryTimer = null;

let notify = () => {};

function scheduleRetry() {
    clearTimeout(retryTimer);
    if (clientId) retryTimer = setTimeout(connect, 2e4);
}

async function connect() {
    if (!clientId || client) return;
    const id = clientId;
    client = new Client({
        clientId: id
    });
    client.on("ready", () => {
        ready = true;
        notify(`Discord Rich Presence connected (${client.user?.username || "user"}).`);
        apply();
    });
    client.on("disconnected", () => {
        if (!ready) return;
        ready = false;
        client = null;
        notify("Discord Rich Presence disconnected; retrying in 20s.");
        scheduleRetry();
    });
    try {
        await client.login();
    } catch (e) {
        ready = false;
        client?.destroy().catch(() => {});
        client = null;
        if (id === clientId) {
            notify(`Discord Rich Presence: could not connect (${e.message}). Is Discord open? Retrying in 20s.`);
            scheduleRetry();
        }
    }
}

async function disconnect() {
    clearTimeout(retryTimer);
    ready = false;
    const c = client;
    client = null;
    if (c) await c.destroy().catch(() => {});
}

function apply() {
    if (!ready || !client?.user) return;
    (pending ? client.user.setActivity(pending) : client.user.clearActivity()).catch(e => notify(`Discord Rich Presence error: ${e.message}`));
}

async function update(config, activity) {
    const wanted = config.enabled && config.clientId ? String(config.clientId).trim() : null;
    if (wanted !== clientId) {
        await disconnect();
        clientId = wanted;
        if (clientId) connect();
    }
    pending = activity;
    apply();
}

module.exports = {
    update: update,
    disconnect: disconnect,
    onStatus: fn => notify = fn
};