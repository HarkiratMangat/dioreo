# Contributing to Dior's Builds

Contributions are genuinely welcome — bug reports, security findings, fixes, and
features. If your contribution ships, **you get credited by name in
the [contributors list](CONTRIBUTORS.md) and in the changelog entry for the release
it lands in.** That's a binding commitment, written into §5.6 of the
[LICENSE](LICENSE), not just a nice intention.

Before you start, please read this whole file. It's short, and the legal part at
the end matters.

---

## The one-line version of the licence

Dior's Builds is **source-available, not open source**. You can read it, study
it, audit it, and run it locally by yourself. You **cannot** deploy it anywhere
other people can use it, redistribute it, or build a competing bot from it. Full
terms: [LICENSE](LICENSE).

This means contributing here is a bit different from contributing to an MIT
project: your contribution becomes part of software that only the maintainer
operates and distributes. The Contributor Licence Agreement below is what makes
that work legally. Please make sure you're comfortable with it.

---

## Ways to contribute

### 🐞 Bug reports

Open a [GitHub issue](https://github.com/HarkiratMangat/diors-builds/issues).
Useful reports include:

- What you did (the exact slash command and options)
- What you expected
- What actually happened, with a screenshot if it's a rendering issue
- Roughly when it happened, and your timezone — it helps correlate against logs

### 🔒 Security vulnerabilities

**Do not open a public issue for a security problem.**

Email **harkirat117@gmail.com** with the details. Please read §4.11 of the
LICENSE first — the short version:

- ✅ Test against **your own local instance**
- ❌ Do **not** test against the live bot or its infrastructure
- ❌ Do **not** access or exfiltrate anyone's data
- ❌ Do **not** disclose publicly until it's been fixed, or a reasonable time has
  passed

Good-faith research within those limits is explicitly permitted by the licence
and is welcome.

### 💡 Feature ideas

Open an issue and describe the problem you want solved rather than the
implementation you have in mind. The
[roadmap](docs/ROADMAP.md) shows what's already planned — worth a look first, so
you don't duplicate something in flight.

### 🔧 Code

Open an issue before writing anything substantial. It saves you from building
something that doesn't fit the architecture or is already half-done on a branch.

---

## Setting up locally

You'll need Node.js 24+, a MongoDB instance, and **your own Discord
application** — never the production bot's token.

```bash
git clone https://github.com/HarkiratMangat/diors-builds.git
```

```bash
npm install
```

Create a `.env.dev` file with your own credentials (it's gitignored):

```bash
BOT_TOKEN=your_own_dev_bot_token
MONGODB_URI=mongodb://localhost:27017/diors-builds-dev
NODE_ENV=development
```

Run it with auto-reload:

```bash
node --watch --env-file=.env.dev index.js
```

> ⚠️ **`dotenv.config()` runs after `--env-file` and backfills anything you
> omit.** Leaving a key out of `.env.dev` doesn't unset it — it silently inherits
> whatever is in `.env`. To disable something in dev, set it **explicitly
> blank**.

Deployment notes and the fuller dev-bot setup: [`docs/reference/deployment-and-ops.md`](docs/reference/deployment-and-ops.md).

---

## Code conventions

The repo has detailed, path-scoped conventions in `.claude/rules/*.md` and
architectural invariants in [`CLAUDE.md`](CLAUDE.md). The essentials:

- **Commit messages follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)** —
  `<type>(<scope>): <description>`, colon and one space, imperative, lowercase,
  no trailing period. Only the 11 standard types.
- **Branch names** are `<type>/<kebab-description>`.
- **Keep the "why" comments.** This codebase explains *why* code is written a
  certain way — especially around fixed bugs and Discord platform quirks. If
  your change makes a comment stale, update it. If you fix a bug or work around
  a platform limitation, add one in the same style.
- **New schema fields must be added to the Mongoose schema in `models/` in the
  same change.** Mongoose silently drops undeclared fields — they work in memory
  and vanish on the next fetch. This has caused real bugs more than once.
- **Test on a dev bot before opening the PR.** Boot it, run the affected command,
  confirm it actually works.

---

## Pull requests

1. Branch off `main` (or off `v3-pre-release` for v3 work).
2. Keep the PR focused on one thing.
3. Describe what you changed and how you tested it.
4. Confirm the CLA (see below).

Review is by the maintainer. There's no SLA — this is a hobby project.

---

## Contributor Licence Agreement (CLA)

**By submitting a contribution, you agree to the terms in [§5 of the LICENSE](LICENSE).**
That section is the operative legal text; this is a plain-English explanation of
it, not a replacement.

### What you're granting

You give the maintainer a **perpetual, worldwide, irrevocable, royalty-free
licence** to use your contribution — to modify it, ship it, deploy it,
commercialise it, and to license or relicense it under any terms, including
proprietary ones.

This is necessary because the project is source-available and may change
licensing later. Without it, every contributor would effectively hold a veto
over the project's future.

### What you keep

- **You keep your copyright.** This is a licence, not an assignment.
- **The licence is non-exclusive** — you can still use your own code elsewhere.
- **You keep your credit.** §5.6 obliges the maintainer to credit you and not to
  pass your work off as his own.

### What you're confirming

That you actually have the right to give this — specifically:

- The contribution is **your own work**, or you have the rights to submit it
- Any third-party code in it is **clearly identified with its licence** when you
  submit it
- It doesn't knowingly infringe anyone's copyright, patent, trademark, or trade
  secret
- **If your employer has rights to what you create**, you've either got their
  permission or they've waived those rights — please check this properly if you
  write code professionally
- It contains **no malicious code, backdoors, or hidden functionality**

### What you're not getting

No payment, no co-ownership of the project, no approval right over how your
contribution is later modified or used, and no ownership stake in Dior's Builds
as a whole.

### How to confirm it

Include this line in your pull request description:

```
I have read and agree to the Contributor Licence Agreement in §5 of the LICENSE.
```

If you'd rather not agree to the CLA, you can still help enormously — file
issues, report bugs, report security findings, and suggest ideas. Those don't
require it.

---

## Questions

Open an issue, or email **harkirat117@gmail.com**.

Thanks for being here. 🖤
