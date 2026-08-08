# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Email **harkirat117@gmail.com** with the details. Include enough to reproduce it: what you did, what happened, and what you expected. A proof of concept helps, and so does telling us roughly when you tested and in what timezone.

There is no bug bounty. This is a hobby project run by one person, and reports are handled on a best-effort basis — but they are genuinely welcome, and anyone whose report leads to a fix is credited in [`CONTRIBUTORS.md`](CONTRIBUTORS.md) and in the changelog entry for the release it ships in, unless you ask us not to.

**Reporting a vulnerability does not require agreeing to the Contributor Licence Agreement.** That only applies to code contributions.

## What you may test — and what you may not

§4.11 of the [LICENSE](LICENSE) governs this, and it is short:

- ✅ Test against **your own local instance**.
- ❌ Do **not** test against the live bot or any infrastructure it runs on.
- ❌ Do **not** access, modify, or exfiltrate anyone else's data. If you encounter someone else's data by accident, stop, and say so in your report.
- ❌ Do **not** run denial-of-service, load, or brute-force testing.
- ❌ Do **not** disclose publicly until it is fixed, or until a reasonable period has passed and we have had a chance to respond.

Good-faith research within those limits is explicitly permitted by the licence. Research outside them is not, and the permission in §4.11 does not extend to it.

## Scope

**In scope:** the source code in this repository, and the documentation website built from it under `public/`.

**Out of scope:** Discord itself, and the third-party services the project depends on — MongoDB Atlas, Google Cloud, Cloudinary, and Cloudflare. Report issues in those to their own vendors; they run their own disclosure programmes and are far better placed to act.

## What we can promise

Not a fixed SLA — that would be a commitment one person cannot honestly keep. What we will do is acknowledge a report when we see it, tell you whether we think it is a real issue, and say plainly if we are not going to fix something and why.

Supported version: whatever is currently deployed. There are no maintained older release branches.
