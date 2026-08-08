# Commit & branch naming — the house convention

**Adopted 2026-07-26 15:20 EDT** (Harkirat's call). Single source of truth for how commit subjects, branch names, and PR titles are written in this repo.

We follow **[Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) as specified** — no house deviations. A custom `/` separator was considered and **rejected 2026-07-26 15:26 EDT** in favour of staying spec-compliant, so any future changelog generator or release automation can parse our history without a custom parser.

---

## The format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Spec rule 1: the type is followed by the OPTIONAL scope, OPTIONAL `!`, and **REQUIRED terminal colon and space**. Rule 5: the description **immediately follows that colon and space**.

- **`: ` — colon then exactly one space.** Not `:`, not `/`, not two spaces.
- **Scope is optional**, a noun in parentheses naming the area touched (spec rule 4): `feat(emoji): …`.
- **Description:** imperative mood ("add", not "added"/"adds"), lowercase first letter, **no trailing period**. The spec's FAQ permits any casing but asks for consistency — lowercase is ours.
- **Breaking changes:** `!` before the colon — `feat(api)!: drop v1 endpoints` — and/or a `BREAKING CHANGE:` footer. If used as a footer the token MUST be uppercase (spec rule 12); `BREAKING-CHANGE` is an accepted synonym. Footers follow git trailer format, one blank line after the body.

### Examples
```
feat(emoji): resolve application-emoji ids by name at boot
fix(pagination): stop duplicate custom_id crash at exactly 2 pages
docs: document the local dev bot across every record
chore(release): finalize v2.33.5 changelog entries + version bump
refactor(drawprices): derive every total from DRAW_DATA
feat(draws)!: remove the region toggle
```

---

## The type vocabulary

These 11 are the canonical set — spec rule 4's recommendation plus `@commitlint/config-conventional`. **Use only these.**

| Type | Use for | SemVer |
|---|---|---|
| `feat` | new user-facing capability or behaviour | MINOR |
| `fix` | patches a bug / unintended behaviour | PATCH |
| `docs` | documentation only — **no code, no `package.json`** | — |
| `refactor` | restructures code without adding a feature or fixing a bug | — |
| `perf` | improves speed or resource usage | — |
| `style` | formatting only; no meaning change (whitespace, linter autofix) | — |
| `test` | adds or updates tests | — |
| `build` | build system, bundler, or **dependencies** (`build(deps): …`) | — |
| `ci` | CI/CD pipeline + workflow files (`.github/workflows/**`) | — |
| `chore` | repo maintenance touching no source or test files | — |
| `revert` | reverts a previous commit; reference the reverted SHA in the body | — |

Only `feat` and `fix` have spec-mandated meaning (rules 2–3). The rest are the Angular/commitlint recommended set and carry **no implicit SemVer effect** unless they contain a breaking change.

### Types we do NOT use, and what to write instead

The local reference list (`local/Conventional Commits Reference List.md`, Gemini-authored) includes six types that are **not** standard. The spec permits arbitrary types, but `@commitlint/config-conventional` rejects every one of these, and they carry no shared meaning. Mappings:

| Non-standard | Write instead | Why |
|---|---|---|
| `deps` | `build(deps): bump x from 1.0 to 1.1` | Dependabot's own convention; `deps` is a scope, not a type |
| `release` | `chore(release): …` | what `standard-version` emits; `release` is not a type |
| `sec` / `security` | `fix(security): …` | a vulnerability patch *is* a fix |
| `wip` | — | draft status belongs on the PR (`--draft`), never in history |
| `types` | — | no TypeScript in this repo |
| `i18n` / `l10n` | — | bot is English-only |

That list is otherwise accurate on the 11 standard types, the `!` notation, and the imperative/lowercase/ no-period rules.

---

## Branch names

The spec says **nothing** about branch names — this half is purely ours and predates the commit convention. Branches keep `/` because that is a path separator, not the spec's subject separator.

```
<type>/<kebab-case-description>
```

Same type vocabulary, no scope, no ticket numbers: `feat/emoji-id-sync`, `docs/board-view-setup-reminder`, `chore/remove-draw-prices-note`.

> ### 🚨 Never rename a branch that has an open PR
> GitHub's branch-rename **auto-closes** any PR whose *head* is the renamed branch, and the PR **cannot be reopened** once the old ref is gone — rename only retargets PRs whose *base* moved. This cost PR #2 on 2026-07-26 15:02 EDT (it had to be re-created as #16). Name the branch correctly **at `git checkout -b` time**; if a badly-named branch already has a PR, the only clean options are to leave it or accept a new number.

---

## PR titles

Same format as commit subjects. This matters mechanically: on a **single-commit** PR, GitHub's squash uses **the commit's own message**, not the PR title — so the commit subject is what lands on `main`. On a multi-commit PR the PR title becomes the squash subject. Write both correctly.

---

## Scope of adoption

Applies to everything authored **from 2026-07-26 15:20 EDT onward**. History before that is left alone: `main` carries 23 `docs:` and 4 `feat:` subjects that were already compliant, plus a stretch of unprefixed `v2.30.0 — …` subjects from before the workflow existed. **Rewriting merged history is not on the table** — it would break every SHA cited across `docs/CHANGELOG.md`, the version tags, and memory.

No commit tooling is installed today (no `commitlint`, `husky`, `semantic-release`, `standard-version`, or `conventional-changelog` — verified 2026-07-26 15:20 EDT), so compliance is currently by hand. Adding `commitlint` is a candidate for `docs/db-deferred-list.md` if drift shows up.
