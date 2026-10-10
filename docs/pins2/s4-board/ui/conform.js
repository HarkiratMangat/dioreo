// portal/ui/conform.js -- ESM. One question, asked by every component that carries a DELIBERATE divergence from the mockup that specifies it: is this page being loaded by the overlay harness with `?conform=1`?
//
// The overlay method (docs/superpowers/specs/2026-08-28-portal-overlay-conformance-design.md) grades the built portal against its mockup by subtracting one screenshot from the other, so a place where the portal is deliberately AHEAD of the design has to be able to stand down for the duration of that comparison. Without that, every improvement reads as a defect, the region count never reaches zero, and the number stops meaning anything -- which is the failure mode that made adjudication-by-judgement unfalsifiable in the first place.
//
// It lives in its own module rather than in shell.js because manifest.js needs it too and shell.js does not import manifest.js: routing this through the Shell would create the portal's first import cycle for the sake of one DOM read.
export const conforming = () => typeof document !== 'undefined' && document.documentElement.dataset.conform === '1';
