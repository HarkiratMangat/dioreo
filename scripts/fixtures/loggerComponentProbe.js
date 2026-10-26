// Test fixture for scripts/logger.test.js ONLY — a real in-repo call site so utils/logger.js's stack-derived `component` field has a genuine caller to resolve to (not synthesized code passed via `node -e`, which has no on-disk repo-relative path for the stack parser to match against).
function markHandlerProbe() {
    console.log('component probe from a real repo file');
}

module.exports = { markHandlerProbe };
