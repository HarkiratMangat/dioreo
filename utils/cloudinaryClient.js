// ==========================================
// CLOUDINARY CLIENT -- the one place the SDK is reached, so timing attaches ONCE
// ==========================================
// Added 2026-08-16 (observability layer stage 2). Six runtime modules used to each do `require('cloudinary').v2` and call the SDK directly across ~18 call sites; the design's §5 is explicit that dependency timing wraps the external CLIENT, not every call site. This module is that client. The six modules now require this instead, and every api.*/uploader.* call they already make is timed and reported into the current interaction's event with no change at the call site.
//
// The proxy is transparent by construction: it forwards `this`, all arguments and the return value untouched, and only observes promises. A synchronous helper (cloudinary.url(), config()) passes straight through -- there is nothing to time.
//
// ⚠️ THE CLOUDINARY SECRET-LOGGING BAN APPLIES HERE MORE THAN ANYWHERE (CLAUDE.md hard invariant). A rejected Cloudinary promise carries the account's live API key AND secret in plaintext under `request_options.auth`. This module therefore NEVER touches, logs, stores or re-throws anything from the error object -- it records a duration and an ok:false flag and rethrows the ORIGINAL rejection unread, so the existing safeErrorMessage()/errorHttpCode() handling at each call site stays the only thing that ever reads it.

const cloudinary = require('cloudinary').v2;
const { noteDep } = require('./eventStore');

function timedNamespace(namespace, depName) {
    if (!namespace || typeof namespace !== 'object') return namespace;
    return new Proxy(namespace, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof value !== 'function') return value;
            return function (...args) {
                const started = Date.now();
                let result;
                try {
                    result = value.apply(target, args);
                } catch (err) {
                    noteDep(depName, Date.now() - started, false);
                    throw err;
                }
                if (result && typeof result.then === 'function') {
                    // Observe without consuming: the returned promise is the ORIGINAL one, so the caller's own .catch() is still the only handler that reads the error object.
                    result.then(
                        () => noteDep(depName, Date.now() - started, true),
                        () => noteDep(depName, Date.now() - started, false),
                    );
                } else {
                    noteDep(depName, Date.now() - started, true);
                }
                return result;
            };
        },
    });
}

const timedApi = timedNamespace(cloudinary.api, 'cloudinary');
const timedUploader = timedNamespace(cloudinary.uploader, 'cloudinary');

// Same surface as `require('cloudinary').v2`, so the six call sites changed nothing but their require line. Anything not listed falls through to the real SDK object unchanged.
module.exports = new Proxy(cloudinary, {
    get(target, prop, receiver) {
        if (prop === 'api') return timedApi;
        if (prop === 'uploader') return timedUploader;
        return Reflect.get(target, prop, receiver);
    },
});
