// eslint.config.mjs — ONE RULE, AND IT IS THE ONE THAT HAS COST THIS PROJECT SIX INCIDENTS.
//
// 🔴 `no-use-before-define` CATCHES A TEMPORAL DEAD ZONE. `node --check` cannot — the file PARSES and
// throws only at evaluation, which under Preact renders a blank section with nothing in the page's
// console. Six occurrences: four on 2026-08-30 alone, one inside the edit fixing the previous one, and one
// on 2026-08-31 in `scripts/handoffCheck.mjs`, written minutes after committing a plan whose Task 1 is
// "build this check".
//
// ⚠️ I DISMISSED ESLINT AS "HEAVY FOR ONE RULE" AND THEN SPENT EIGHT TURNS BUILDING A WORSE ONE. A static
// analyser gave 40 findings, nearly all false. An import-based checker could not evaluate `season.js` —
// the very file where the defect keeps happening — so its falsifier passed for the wrong reason twice.
// Both were deleted. **The standard tool was one install and this file.** Reaching past a known-good tool
// because it "feels heavy" is the actual failure, and it is worth more than the rule it was avoiding.
export default [
    {
        files: ['portal/ui/**/*.js', 'scripts/**/*.mjs', 'scripts/**/*.js', 'core/**/*.js', 'handlers/**/*.js', 'bot/**/*.js'],
        languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
        rules: {
            // Functions are hoisted and are used before definition all over this codebase deliberately;
            // it is `const`/`let`/`class` in a temporal dead zone that actually breaks at runtime.
            'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
        },
    },
];
