// utils/formChoice.js -- one choice in a pop-up form, as the lightest control that holds it (2026-11-09, Harkirat: "why are we using dropdowns for everything in forms when forms are capable of holding things such as checkboxes and radio boxes as well?").
//
// Discord's forms take three choice controls besides the dropdown, each inside a Label (type 18): a Radio Group (type 21, pick one), a Checkbox Group (type 22, pick several) and a single Checkbox (type 23, yes or no). Each group holds at most 10 options and none can show an emoji. So:
//   - pick one of 10 or fewer  -> radio buttons
//   - pick several of 10 or fewer -> checkboxes
//   - more than 10, a list that needs search, or options that show emojis -> the dropdown, as before
// `choiceField` decides; `readChoice` reads any of the three back as an array of values, so a handler never needs to know which control the form showed (and a form opened before a change still reads).
// ⚠️ Discord's radio and checkbox groups have no emoji field, so any option with an `emoji` keeps the whole list a dropdown. `placeholder` is dropped on a group; a dropdown keeps it.

const MAX_GROUP = 10;

// opts: { id, label, description, options: [{ label, value, description?, emoji?, default? }], multi = false, required = true, min, max, placeholder, forceSelect = false }
function choiceField({ id, label, description, options = [], multi = false, required = true, min, max, placeholder, forceSelect = false }) {
    const shown = options.slice(0, 25);
    const head = { type: 18, label: String(label).slice(0, 45), ...(description ? { description: String(description).slice(0, 100) } : {}) };
    // A list whose options carry emojis stays a dropdown (2026-11-10, Harkirat: "oh then leave it out for items that use emojis"): a radio or checkbox group would drop them.
    const hasEmoji = shown.some(o => o && o.emoji);
    if (!forceSelect && !hasEmoji && shown.length > 0 && shown.length <= MAX_GROUP) {
        const plain = shown.map(o => ({ label: String(o.label).slice(0, 100), value: String(o.value), ...(o.description ? { description: String(o.description).slice(0, 100) } : {}), ...(o.default ? { default: true } : {}) }));
        if (multi) {
            const lo = Math.max(0, Math.min(min ?? (required ? 1 : 0), plain.length));
            const hi = Math.max(lo || 1, Math.min(max ?? plain.length, plain.length));
            return { ...head, component: { type: 22, custom_id: id, required: required && lo > 0, min_values: lo, max_values: hi, options: plain } };
        }
        // A radio group lets one option be the default; a second default would be refused, so only the first counts.
        let seen = false;
        const one = plain.map(o => { if (!o.default) return o; if (seen) { const { default: _d, ...rest } = o; return rest; } seen = true; return o; });
        return { ...head, component: { type: 21, custom_id: id, required: Boolean(required), options: one } };
    }
    const lo = multi ? (min ?? (required ? 1 : 0)) : (required ? 1 : 0);
    const hi = multi ? Math.min(max ?? shown.length, shown.length) : 1;
    return { ...head, component: { type: 3, custom_id: id, required: Boolean(required), min_values: Math.min(lo, shown.length), max_values: Math.max(1, hi), ...(placeholder ? { placeholder: String(placeholder).slice(0, 150) } : {}), options: shown } };
}

// A single yes/no box (type 23). `value` reads back as true or false.
function checkboxField({ id, label, description, checked = false }) {
    return { type: 18, label: String(label).slice(0, 45), ...(description ? { description: String(description).slice(0, 100) } : {}), component: { type: 23, custom_id: id, ...(checked ? { default: true } : {}) } };
}

// The picked values of a choice, whichever control the form held: [] when nothing was picked or the field is absent.
function readChoice(interaction, id) {
    const f = interaction?.fields;
    if (!f) return [];
    if (typeof f.getField === 'function') {
        let field = null;
        try { field = f.getField(id); } catch { field = null; }
        if (field) {
            if (Array.isArray(field.values)) return field.values.map(String);
            if (typeof field.value === 'boolean') return field.value ? ['true'] : [];
            return field.value === null || field.value === undefined || field.value === '' ? [] : [String(field.value)];
        }
    }
    // A form the old way, or a test's stand-in that only knows dropdowns.
    try { return (f.getStringSelectValues(id) || []).map(String); } catch { return []; }
}

// The one picked value, or null.
const readOne = (interaction, id) => readChoice(interaction, id)[0] ?? null;

// A yes/no box's answer.
function readCheckbox(interaction, id) {
    const f = interaction?.fields;
    try { if (typeof f?.getCheckbox === 'function') return Boolean(f.getCheckbox(id)); } catch { /* not a checkbox: read below */ }
    return readChoice(interaction, id).some(v => v === 'true' || v === 'yes');
}

module.exports = { choiceField, checkboxField, readChoice, readOne, readCheckbox, MAX_GROUP };
