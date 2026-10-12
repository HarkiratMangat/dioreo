// portal/ui/download.js — ESM. One way to put text on somebody's disk.
//
// 🔴 TWO REALMS HAD A DEAD EXPORT BUTTON AND NOTHING SAID SO. Season's and Armory's "Export selection" both called `window.open('data:text/plain;…')`, which browsers have blocked as a top-level navigation for years — measured in this app, not assumed: the call returns `null`, throws nothing, and the page does not change. A button that runs, reports success by saying nothing, and produces no file is the worst possible shape for an export, because export is the thing the one-way confirmations name as the way back.
//
// The Blob-and-anchor path below is not new: `exportChangeset` has used it since the tier-3 interlock was built, which is the one export in this app that was known to work. This is that path, extracted, so there is one mechanism rather than a working one and a broken one.
//
// ⚠️ The URL is revoked on the NEXT FRAME rather than immediately. Chrome starts the download asynchronously and revoking in the same tick has been observed to cancel it — a save that silently does not happen.
export function downloadText(filename, text, mime) {
    const blob = new Blob([text ?? ''], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    requestAnimationFrame(() => URL.revokeObjectURL(url));
    return true;
}
