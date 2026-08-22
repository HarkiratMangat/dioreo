// portal/ui/v2Render.logic.js — CommonJS, imports nothing. The pure per-line markdown classifier v2Render.js renders from. Scoped to exactly what buildLoadoutCard() (utils/loadoutRender.js) emits inside a type-10 TextDisplay: `# `/`### `/`-# ` line prefixes and `> ` blockquote lines, never a general markdown grammar.
function parseV2Markdown(text) {
    return String(text || '').split('\n').map((line) => {
        if (line.startsWith('# ')) return { type: 'h1', text: line.slice(2) };
        if (line.startsWith('### ')) return { type: 'h3', text: line.slice(4) };
        if (line.startsWith('-# ')) return { type: 'small', text: line.slice(3) };
        if (line.startsWith('> ')) return { type: 'blockquote', text: line.slice(2) };
        return { type: 'p', text: line };
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseV2Markdown };
}
