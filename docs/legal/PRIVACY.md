# Privacy Policy — Dior's Builds

**Effective date:** 28 July 2026
**Version:** 1.0
**Applies to:** the Dior's Builds Discord application (the "Bot")

---

## 0. The short version

We store **your Discord user ID** and **your display preferences** — timezone,
visibility toggles, region, and colour settings. That's essentially it.

**We cannot read your messages.** The Bot doesn't have Discord's Message Content
permission, so message text is technically inaccessible to us, not merely
unused.

**Your data is stored in Canada.** No advertising, no analytics, no tracking, no
cookies, no profiling, and nothing is sold or shared for marketing.

You can have everything deleted by emailing **info@harkiratmangat.com** — see §9.

*This summary is for convenience. The sections below are the actual policy.*

---

## 1. Who is responsible for your data

The **data controller** is:

**Harkirat Mangat**, also known as **"dior"**, an individual based in Ontario,
Canada.
📧 **info@harkiratmangat.com**

This is a hobby project run by one person. There is no company, no data
protection officer (none is required — we do not carry out large-scale or
systematic monitoring), and no privacy team. Email reaches a real person.

### 1.1 EU representative

We have not appointed an EU representative under **GDPR Article 27**. We rely on
the exemption in **Article 27(2)(a)**: our processing is occasional, does not
include special-category or criminal-conviction data on any scale, involves only
a user ID and display preferences, and is unlikely to result in a risk to the
rights and freedoms of individuals.

If that assessment ever stops being accurate, we will appoint a representative
and update this policy. EU and UK users can reach us directly at the address
above, and we answer.

---

## 2. What we collect

### 2.1 Information stored about you

Everything below lives in a single `UserPreference` record keyed to your Discord
user ID. **A record is only created once you actually use the Bot.**

| Data | What it is | Why we have it |
|---|---|---|
| **Discord user ID** | Your permanent numeric Discord ID | The key linking your preferences to you. Required. |
| **Timezone** | An IANA timezone you set (e.g. `America/Toronto`) | So `/timestamp` and countdowns show correct local times |
| **Timestamp style** | Your preferred timestamp format | Remembers your `/timestamp` choice |
| **Visibility settings** | Public or private replies, per feature group | Remembers whether you want replies others can see |
| **Region preference** | Your CP pricing region, and whether it's pinned | Shows the right prices without re-selecting |
| **Calendar filter** | Active-events-only vs all events | Remembers your `/calendar` toggle |
| **Accent colour style** | Which colour source you've chosen | Controls how your messages are coloured |
| **Cached colour values** | Hex codes and 6-swatch palettes derived from your Discord profile images | Avoids re-analysing your avatar on every command |
| **Colour source hashes** | The Discord asset hash a cached colour was computed from | Detects when you change your avatar so the cache refreshes |

**Is a Discord user ID personal data?** Yes — we treat it as such. It's a
persistent unique identifier that can be linked back to you, which brings it
within GDPR Art. 4(1) and PIPEDA's definition of personal information. We say so
rather than arguing otherwise.

### 2.2 About the colour data specifically

If you use the accent-colour or "View Colors" features, the Bot downloads your
Discord **avatar, banner, avatar decoration, or nameplate image** and analyses it
to extract dominant colours.

- **The images themselves are never stored.** Fetched, analysed in memory,
  discarded.
- **Only the resulting colour values are saved** — hex codes and palettes.
- **Display Name colours** are the two colours you picked in Discord's Nitro
  settings, stored as-is rather than extracted from an image.
- The stored "source" value is Discord's own asset hash, used purely to notice
  when you've changed your image.

### 2.3 Temporary data held in memory

Exists only in the server's memory while it runs, and is **lost on every restart
or deploy** (typically hours to days):

- Anti-spam cooldown timestamps (your user ID → time of your last interaction)
- A short-lived cache of your Discord profile data
- A per-message colour choice, so a message keeps its colour when you click buttons

### 2.4 Operational logs and alerts

The Bot keeps an **alert log** of technical events — crashes, database problems,
gateway disconnects, daily health checks — recording the alert level, a
description, timestamps, process memory use, and uptime. Alerts are also posted
to a **private Discord channel** that only the administrator can see, via a
Discord webhook.

These concern the *bot's health*, not you. However, **an error captured in a
crash report could incidentally contain a Discord user ID** if the failure
happened while processing that person's command. This isn't deliberate, and these
logs are never used to analyse users.

**Alert logs are automatically deleted after 30 days.**

### 2.5 If you use GitHub

Filing an issue or pull request on our public repository means GitHub processes
your data under [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement),
and your contribution is public. That's GitHub's processing, not ours, and it is
entirely separate from using the Bot.

---

## 3. What we do NOT collect

| ❌ We do not have | Why |
|---|---|
| **Your messages** | The Bot runs with only the `Guilds` gateway intent. It does **not** have the Message Content intent, so Discord never sends us message text. A technical impossibility, not just a policy promise. |
| **Your DMs** | Same reason. |
| **Your email address** | Never requested, never received from Discord. |
| **Your real name** | Never requested. |
| **Your Discord username or display name** | Used momentarily to render a response, never written to the database. |
| **Your IP address** | Discord handles the connection; we never see it. |
| **Payment information** | The Bot is free and has no payment feature. |
| **A list of your servers** | Not collected or stored. |
| **Analytics or tracking data** | No analytics SDK, no telemetry, no tracking pixel, no ad network, no fingerprinting. |
| **Cookies** | There is no website. The Bot runs entirely inside Discord and sets no cookies or similar storage on your device. |
| **Voice data, location, contacts, or biometrics** | Not applicable, not collected. |

We do **no** profiling, no behavioural advertising, and **no automated
decision-making producing legal or similarly significant effects** (GDPR Art. 22).

---

## 4. Why we process it, and our legal basis

| Purpose | Legal basis (GDPR Art. 6) |
|---|---|
| Remembering your preferences | **Consent** — you chose to set them (Art. 6(1)(a)) |
| Making the Bot work when you invoke a command | **Contract** — the Terms of Service (Art. 6(1)(b)) |
| Keeping the Bot secure and stable (cooldowns, crash logs) | **Legitimate interests** — running a functioning, non-abused service (Art. 6(1)(f)) |
| Complying with legal obligations | **Legal obligation** (Art. 6(1)(c)) |

No **special category** data (Art. 9) is processed — no health, biometric, racial
or ethnic origin, political, religious, or sexual-orientation data.

Under **PIPEDA**, our basis is your **implied consent**: you install the Bot and
set a preference, and we store it for the obvious purpose of honouring it. You
can withdraw consent at any time (§9).

> **A note on PIPEDA's scope.** PIPEDA applies to organisations collecting
> personal information "in the course of commercial activity." This Bot is free
> and non-commercial, so PIPEDA arguably doesn't bind us at all. **We comply with
> it regardless**, and don't rely on that argument to hold anything back.

---

## 5. Who your data is shared with

**We do not sell your data. We do not share it for advertising or
cross-context behavioural advertising. We do not disclose it to data brokers.**
We have never done so, and we have no plans to.

| Provider | What it handles | Where |
|---|---|---|
| **Discord Inc.** | The platform itself — your ID, your interactions | Per [Discord's Privacy Policy](https://discord.com/privacy) |
| **MongoDB Atlas** (MongoDB, Inc.) | **Stores your preference record** | **🇨🇦 Azure Canada Central (Toronto)** |
| **Google Cloud Platform** (Google LLC) | Hosts the server the Bot runs on | 🇺🇸 `us-east1` (South Carolina) |
| **Cloudinary Ltd.** | Hosts cached **game images** only | 🇺🇸 United States |

### 5.1 Three clarifications worth making

**Your stored personal data stays in Canada.** The `UserPreference` records —
the only place your preferences live — are in an Atlas cluster hosted in **Azure
Canada Central, Toronto**. Verified 2026-07-28 21:36 EDT by resolving the
cluster's DNS records.

**Cloudinary holds no personal data.** The images there are game screenshots and
weapon artwork supplied by the administrator. Your avatar is never uploaded.

**No AI system processes your data.** The `/autobuild` command sends screenshots
to Google's Gemini model for text extraction, but it is **restricted to the
administrator's own Discord account**. No end-user data, image, or message is
ever sent to any AI service. (Separately, AI tools were used to help *write* this
project's code — see [NOTICE](../../NOTICE) §6. That's development, not runtime
processing of your data.)

### 5.2 Other disclosure

We may disclose information where legally required — a valid court order,
subpoena, or law-enforcement request under Canadian law — or where necessary to
investigate a security incident or protect someone's rights or safety. Given what
we hold, such a request would yield very little. Where we are lawfully permitted
to tell you about such a request, we will.

If the Bot were ever transferred to another operator, your data could transfer
with it. We would give notice first, and you could delete your data beforehand.

---

## 6. International transfers

**Your stored preferences do not leave Canada.** They sit in Azure Canada Central.

Some *processing* happens elsewhere: the server that runs the Bot is in the
United States (Google Cloud `us-east1`), so your data is handled in memory there
while a command runs. Discord operates globally and handles your data under its
own policy.

**If you are in the EEA, the UK, or Switzerland:** Canada holds a partial
**adequacy decision** from the European Commission for organisations subject to
PIPEDA, which means transfers to Canada are recognised as offering adequate
protection. For the US-based processing, we rely on Google's transfer mechanisms
— Standard Contractual Clauses and the EU–US Data Privacy Framework — as set out
in the Google Cloud data processing terms.

Given the data involved is a user ID and colour preferences, the practical risk
of these transfers is low.

---

## 7. How long we keep it

| Data | Retention |
|---|---|
| **Your preference record** | **Kept until you ask us to delete it** — see §9 |
| **Alert / operational logs** | **30 days**, then automatically deleted |
| **In-memory caches** | Until the next restart or deploy — hours to days |
| **Cloudinary game images** | Until the underlying content rolls out of the Bot's history |

### 7.1 An honest disclosure about deletion

**There is currently no automated deletion and no self-service delete command.**

Removing the Bot from your Discord account stops all future interaction, but does
**not** by itself erase your stored preferences — they simply sit unused.

**Deletion is currently handled manually, on request, by email.** That is a
legitimate and compliant route — the law requires that you be able to exercise
the right, not that a button exist — but we consider the absence of self-service
a shortcoming rather than a design choice. A `/settings` delete option and an
automatic clean-up of long-dormant records are planned, and this policy will be
updated when they ship.

`/settings` currently lets you **change** stored values, which overwrites them. It
has no reset or delete.

---

## 8. Security

What actually protects your data:

- **Credentials** live in environment variables, never committed to the
  repository; the secrets file is permanently excluded from version control.
- **Database access** is restricted and authenticated.
- **All connections** to Discord, MongoDB, Cloudinary, and Google Cloud use TLS.
- **Administrative commands** are locked to a single hard-coded Discord ID — no
  one else can reach the management, alerting, or automation features.
- **Rate limiting and cooldowns** guard against abuse.
- **Only one bot instance** may run at a time, enforced by a database lock.

**The limits, stated plainly:** this is a personal project on a single small
server. There is no formal information-security programme, no penetration
testing, no SOC 2 audit, and no 24/7 monitoring. No system is perfectly secure,
and we cannot guarantee absolute security.

The mitigating factor is that there is very little to lose — a public Discord ID
and some colour preferences. No passwords, no emails, no payment details, no
message content.

### 8.1 If there's a breach

If a breach creates a **real risk of significant harm**, we will:

1. Report it to the **Office of the Privacy Commissioner of Canada** as PIPEDA
   requires, and keep a record of it.
2. Notify affected users through the Bot or the project's public channels,
   without undue delay.
3. For EEA/UK users, notify the relevant supervisory authority within **72
   hours** where GDPR requires it, and notify you directly where the risk is high.

---

## 9. Your rights and how to use them

**Whoever and wherever you are, you can ask us to do all of the following.** We
apply the strongest standard to everyone rather than sorting users by
jurisdiction.

| Right | What it means |
|---|---|
| 🔍 **Access** | Get a copy of everything stored about you |
| ✏️ **Correction** | Fix anything inaccurate |
| 🗑️ **Deletion** | Have your record erased entirely |
| 📦 **Portability** | Receive your data in a machine-readable format (JSON) |
| ⛔ **Object / restrict** | Object to legitimate-interests processing, or ask us to pause it |
| ↩️ **Withdraw consent** | At any time, without affecting past lawful processing |
| 🚫 **Non-discrimination** | We will not degrade the Bot for you for exercising a right |

### 9.1 How to make a request

**Email info@harkiratmangat.com** with the subject line **"Privacy Request"**,
and include:

1. **Your Discord user ID** — the numeric one. In Discord: Settings → Advanced →
   enable Developer Mode, then right-click your own name and "Copy User ID".
2. **What you want** — access, correction, deletion, a copy of your data, or
   withdrawal of consent.

**That's the whole process.** There is no form, no account, and no fee.

### 9.2 Verifying it's really you

Because a Discord user ID is public, we need to know the request actually comes
from the account holder before we act on it — otherwise anyone could delete
someone else's settings.

**We will ask you to confirm the request from the Discord account in question**,
normally by sending a direct message to the administrator (`dior`) from that
account referencing your email. If we can't reasonably verify you, we may decline
to act, and we'll tell you why (GDPR Art. 12(6)).

This step exists to protect you, not to obstruct you.

### 9.3 Timing

- We respond within **30 days**.
- Complex requests may be extended by up to a further **60 days**, and we'll tell
  you within the first 30 if that happens (GDPR Art. 12(3)).
- Requests are **free**. We may charge a reasonable fee for, or refuse, requests
  that are manifestly unfounded or excessive — particularly repetitive ones (GDPR
  Art. 12(5)). We'll explain if we ever do.

### 9.4 What deletion actually does

We delete your `UserPreference` record entirely. Your preferences revert to
defaults, and the Bot behaves as though you'd never used it. Nothing is retained
in a shadow copy.

Two honest caveats:

- **Alert logs** may briefly contain an incidental user ID (§2.4). These purge
  automatically within 30 days and are not indexed by user, so we do not
  routinely search them. Ask and we will.
- **Database backups** maintained by MongoDB Atlas may retain a copy until they
  age out on Atlas's own schedule. We cannot selectively edit a backup, which is a
  normal and accepted limitation.

### 9.5 Complaints

If you're unhappy with how we've handled your data, please tell us first — but
you have every right to go straight to a regulator:

- **Canada:** [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/) — 1-800-282-1376
- **EEA:** your national data protection authority ([list](https://edpb.europa.eu/about-edpb/board/members_en))
- **UK:** [Information Commissioner's Office](https://ico.org.uk/) — 0303 123 1113
- **Quebec:** [Commission d'accès à l'information](https://www.cai.gouv.qc.ca/)
- **California:** [California Privacy Protection Agency](https://cppa.ca.gov/)

### 9.6 A note on California

The CCPA/CPRA applies to "businesses" meeting thresholds — over $25M in annual
revenue, personal information on 100,000+ consumers, or 50%+ of revenue from
selling personal information. **We meet none of them**, so the CCPA does not
apply to us as a matter of law.

We honour the equivalent rights anyway. For the record, in CCPA terms: the only
category of personal information we collect is **identifiers** (a Discord user ID)
plus user-set preferences; we collect it directly from your use of the Bot; we
use it solely to operate the Bot; **we do not and have never sold or shared
personal information**; and we do not collect sensitive personal information.

---

## 10. Children's privacy

The Bot is **not directed at children**. You must meet Discord's minimum age for
your country — **13 in most places, and 14, 15, or 16 in parts of the EU and
elsewhere**. See §3 of the [Terms of Service](TERMS.md).

We do not knowingly collect data from anyone below that age, and we have no
mechanism to verify age beyond Discord's own — we rely on Discord's enforcement of
its minimum age.

If you believe a child's data is stored, email **info@harkiratmangat.com** and we
will delete it promptly and without requiring the verification steps in §9.2.

Because we never collect names, emails, photographs, or message content, the data
we hold about any user — including a young one — is limited to a Discord ID and
display preferences.

---

## 11. Third-party links and content

The Bot displays images and information sourced from third parties and may link
elsewhere. **We are not responsible for the privacy practices of any third-party
site or service.** Discord's own handling of your data is governed by
[Discord's Privacy Policy](https://discord.com/privacy), which is worth reading —
it covers far more data than we ever see.

---

## 12. Changes to this policy

We may update this policy. When we do:

- The **effective date and version** at the top change.
- The full change history is public in the repository's git log.
- For **material** changes — new data collected, a new recipient, a new purpose —
  we will make reasonable efforts to give notice before they take effect, and will
  seek fresh consent where the law requires it.

Continued use after a change takes effect means you accept the updated policy. We
will not apply a materially different use of already-collected data retroactively
without your consent.

---

## 13. Contact

**Harkirat Mangat ("dior")** — Data Controller
Ontario, Canada
📧 **info@harkiratmangat.com**
🔗 https://github.com/HarkiratMangat/diors-builds

For privacy requests, use the subject line **"Privacy Request"** and include your
Discord user ID.

---

## Appendix A — Complete data inventory

Every field stored about a user. This mirrors the `UserPreference` schema, which
you can read yourself at [`models/UserPreference.js`](../../models/UserPreference.js).

**Identity**
- `discordId` — your Discord user ID

**Preferences**
- `timezone`, `timestampStyle`
- `loadoutVisibility`, `seasonalVisibility`, `timestampVisibility`, `settingsVisibility`
- `defaultRegion`, `defaultRegionMode`
- `calendarEventFilter`
- `accentColorStyle`

**Cached colour values** (derived, not raw images)
- `avatarColorHex` / `avatarColorSource`
- `bannerColorHex` / `bannerColorSource`
- `displayNameColorHex` / `displayNameColorSource`
- `decorationColorSource`, `nameplateColorSource`
- `avatarPalette`, `bannerPalette`, `decorationPalette`, `nameplatePalette` (+ source hashes)

**That's the whole list.** The source code is public — verify it yourself rather
than taking our word for it.

---

## Appendix B — Change history

| Version | Date | Change |
|---|---|---|
| **1.0** | 28 July 2026 | Initial policy. |

Future revisions will be listed here. The complete drafting history is public in
the repository's git log.

---

*Dior's Builds is an unofficial fan project and is not affiliated with Activision
Publishing, Inc. or Discord Inc.*
