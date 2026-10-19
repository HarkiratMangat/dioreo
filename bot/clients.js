// ==========================================
// THE TWO APPLICATIONS — Dioreo and Dioreo Admin
// ==========================================
// Since 2026-10-19 13:44 EDT (Dioreo Admin) one process can log in as TWO Discord applications: the public Dioreo app and Dioreo Admin, a user-install-only app holding the admin and experimental commands so they stop showing in every user's command list (docs/db-deferred-list.md, "Dioreo Admin"). Both clients share one router, one command Collection and one database.
//
// This module holds the pair so code answering an ADMIN-app interaction can still reach bot-wide facts. `interaction.client` is the admin client there, and its guild count (0), gateway status and hotpatch list describe that second connection, not the bot. /bot's health panel and the hotpatch record read through publicClient() for exactly that reason.
//
// ⚠️ Requires nothing on purpose: utils/hotpatch.js and commands/bot.js require it, and a dependency here could close a require cycle through either.

const clients = { public: null, admin: null };

function setClients({ public: pub = null, admin = null } = {}) {
    clients.public = pub;
    clients.admin = admin;
}

// The public client when one is registered, else whatever the caller already had (a test's fake client, a script with no index.js boot).
function publicClient(fallback) {
    return clients.public || fallback;
}

// The admin app's token, or null when the admin app is off. Off means: no ADMIN_BOT_TOKEN, a blank one, or one equal to BOT_TOKEN. Off is today's behaviour, every command on the public app -- the dev fallback, and what keeps prod safe if this code deploys before the VM's .env has the line (his ask 2026-10-19 13:26 EDT, "explain in simple terms?"). ⚠️ The dotenv backfill trap applies (CLAUDE.md, the local dev bot): a key .env.dev omits is backfilled from .env. The prod admin token therefore stays OUT of every .env on the Mac, and .env.dev carries the dev admin token or the key set blank.
function adminTokenFrom(env = process.env) {
    const token = String(env.ADMIN_BOT_TOKEN || '').trim();
    if (!token || token === String(env.BOT_TOKEN || '').trim()) return null;
    return token;
}

module.exports = { clients, setClients, publicClient, adminTokenFrom };
