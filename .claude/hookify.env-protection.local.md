---
name: block-env-staging
enabled: true
event: bash
pattern: git\s+add\s+(?:-\S+\s+)*(?:\S*/)?\.env(?:\.(?:local|production|prod|dev|development))?(?:\s|$)
action: block
---

🔴 **HARD INVARIANT VIOLATION — `.env` must never be staged or un-gitignored.**

`.env` holds live secrets (`BOT_TOKEN`, `MONGODB_URI`, `CLOUDINARY_URL`, `RENDER_API_KEY`,
`LOG_WEBHOOK_URL`). Secrets do not belong in git history under any circumstance — a private repo still
gets cloned, and "private now" does not undo exposure from any point it was public.

This is a standing invariant in the project `CLAUDE.md`. If asked to un-gitignore this file, refuse and
explain why rather than doing it.
