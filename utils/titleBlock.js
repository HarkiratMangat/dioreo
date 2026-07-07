// utils/titleBlock.js
// Shared two-line header pattern introduced across calendar/draws/patchnotes/drawprices in the
// same redesign pass: a smaller context line (season title, patch name, or region) on top, with
// the command's own animated-emoji header as the bigger line below it. Centralized here instead of
// copy-pasted in each command so the four stay visually identical and any future tweak (spacing,
// heading levels) only needs to happen once.

// Converts Latin letters to their Unicode "Mathematical Bold Italic" equivalents, and digits to
// "Mathematical Bold" equivalents wrapped in markdown italic (`*...*`) -- Unicode has no
// bold-italic digit variant, so this hybrid (Unicode bold + markdown italic on top) is the closest
// visual match to the surrounding bold-italic letters. Runs of consecutive digits are wrapped as
// ONE `*...*` span (e.g. "10" -> "*𝟏𝟎*") rather than one per digit, so the markdown parser sees a
// single clean italic span instead of adjacent ones that could fail to merge visually. Letters use
// real Unicode glyphs rather than markdown emphasis because heading lines (`#`/`##`/`###`) don't
// reliably render nested inline emphasis on every Discord client; digits have no such Unicode
// option, so markdown is the only way to get any slant on them at all. Everything else (spaces,
// punctuation, colons, em dashes) passes through untouched.
function toBoldItalicUnicode(str) {
    const upperBase = 0x1D468; // 𝑨
    const lowerBase = 0x1D482; // 𝒂
    const digitBase = 0x1D7CE; // 𝟎 (bold, not bold-italic -- no such digit variant exists)
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const code = str.codePointAt(i);
        if (code >= 48 && code <= 57) {
            let digits = '';
            while (i < str.length && str.codePointAt(i) >= 48 && str.codePointAt(i) <= 57) {
                digits += String.fromCodePoint(digitBase + (str.codePointAt(i) - 48));
                i++;
            }
            result += `*${digits}*`;
            i--; // compensate for the outer loop's own i++
            continue;
        }
        if (code >= 65 && code <= 90) result += String.fromCodePoint(upperBase + (code - 65));
        else if (code >= 97 && code <= 122) result += String.fromCodePoint(lowerBase + (code - 97));
        else result += str[i];
    }
    return result;
}

// NOTE (reordered during review): the big command-header line (emoji + label) now comes FIRST,
// with the smaller context line (season title / CP region) underneath it as a caption -- reversed
// from the original season-name-on-top layout per Harkirat's request. topLine is NOT a real heading
// (no leading `#`) -- it used to be its own `### ` heading stacked against the `# ` emoji/label
// heading, but two adjacent headings in one Text Display each carry Discord's own heading-level
// vertical margin that doesn't collapse just because the source only has one \n between them, which
// showed up as a disproportionately large gap. toBoldItalicUnicode()'s styling keeps the visual
// weight without needing literal heading markup.
function buildTitleBlock(topLine, emoji, label) {
    return { type: 10, content: `# ${emoji} ${label}\n${toBoldItalicUnicode(topLine)}` };
}

module.exports = { buildTitleBlock, toBoldItalicUnicode };
