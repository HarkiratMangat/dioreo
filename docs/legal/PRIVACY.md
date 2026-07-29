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

We don't sell your data, run ads, or use analytics or tracking of any kind.

You can have everything deleted by emailing **info@harkiratmangat.com**.

*This summary is for convenience. The sections below are the actual policy.*

---

## 1. Who is responsible for your data

The **data controller** is:

**Harkirat Mangat**, also known as **"dior"**, an individual based in Ontario,
Canada.
📧 **info@harkiratmangat.com**

This is a hobby project run by one person. There is no company, no data
protection officer, and no formal privacy team. Email goes to a real person.

---

## 2. What we collect

### 2.1 Information stored about you

Everything below is stored in a single `UserPreference` record, keyed to your
Discord user ID. **A record is only created once you actually use the Bot.**

| Data | What it is | Why we have it |
|---|---|---|
| **Discord user ID** | Your permanent numeric Discord ID (e.g. `1139845545754632283`) | The key that links your preferences to you. Required. |
| **Timezone** | An IANA timezone you set (e.g. `America/Toronto`) | So `/timestamp` and countdowns show correct local times |
| **Timestamp style** | Your preferred timestamp format | Remembers your `/timestamp` choice |
| **Visibility settings** | Whether responses are public or private, per feature group | Remembers whether you want replies visible to others |
| **Region preference** | Your CP pricing region and whether it's pinned | Shows the right prices without re-selecting |
| **Calendar filter** | Active-events-only vs all events | Remembers your `/calendar` toggle |
| **Accent colour style** | Which colour source you've chosen | Controls how your messages are coloured |
| **Cached colour values** | Hex colour codes and 6-swatch palettes derived from your Discord profile images | Avoids re-downloading and re-analysing your avatar on every command |
| **Colour source hashes** | The Discord asset hash your cached colour was computed from | Lets us detect when you change your avatar so the cache refreshes |

### 2.2 About the colour data specifically

If you use the accent-colour or "View Colors" features, the Bot downloads your
Discord **avatar, banner, avatar decoration, or nameplate image** and analyses it
to extract dominant colours.

- **The images themselves are never stored.** They're fetched, analysed in
  memory, and discarded.
- **Only the resulting colour values are saved** — hex codes and palettes.
- **Display Name colours** are the two colours you picked in Discord's Nitro
  settings, stored as-is rather than extracted from an image.
- The stored "source" value is Discord's own asset hash, used purely to notice
  when you've changed your image.

### 2.3 Temporary data held in memory

The following exists only in the server's memory while it's running, and is
**lost on every restart or deploy**:

- Anti-spam cooldown timestamps (your user ID → the time of your last interaction)
- A short-lived cache of your Discord profile data
- A per-message colour choice, so a message keeps its colour when you click buttons

### 2.4 Operational logs

The Bot keeps an **alert log** of technical events — crashes, database problems,
gateway disconnects, daily health checks. Each entry records the alert level,
a description, timestamps, process memory use, and uptime.

These are about the *bot's health*, not about you. However, **an error message
captured in a crash report could incidentally contain a Discord user ID** if the
error happened while processing that person's command. We don't do this
deliberately and we don't use these logs to analyse users.

**Alert logs are automatically deleted after 30 days.**

---

## 3. What we do NOT collect

To be explicit, because this is the part people usually worry about:

| ❌ We do not have | Why |
|---|---|
| **Your messages** | The Bot runs with only the `Guilds` gateway intent. It does **not** have the Message Content intent, so Discord does not send us message text at all. This is a technical impossibility, not a policy promise. |
| **Your DMs** | Same reason. |
| **Your email address** | Never requested, never received from Discord. |
| **Your real name** | Never requested. |
| **Your Discord username or display name** | Used momentarily to render a response, never written to the database. |
| **Your IP address** | Discord handles the connection; we never see it. |
| **Payment information** | The Bot is free and has no payment feature. |
| **A list of your servers** | Not collected or stored. |
| **Analytics or tracking data** | There is no analytics SDK, no telemetry, no tracking pixel, no advertising network, and no third-party cookie anywhere in this project. |
| **Voice data, location, or contacts** | Not applicable and not collected. |

We also do **no** profiling, behavioural advertising, or automated
decision-making that produces legal or similarly significant effects.

---

## 4. Why we process it, and our legal basis

| Purpose | Legal basis (GDPR Art. 6) |
|---|---|
| Remembering your preferences | **Consent** — you chose to set them (Art. 6(1)(a)) |
| Making the Bot work when you invoke a command | **Performance of a contract** — these Terms (Art. 6(1)(b)) |
| Keeping the Bot secure and stable (cooldowns, crash logs) | **Legitimate interests** — running a functioning, non-abused service (Art. 6(1)(f)) |
| Complying with legal obligations | **Legal obligation** (Art. 6(1)(c)) |

We do not process any **special category** data (Art. 9) — no health, biometric,
racial or ethnic origin, political, religious, or sexual-orientation data.

Under Canadian law (**PIPEDA**), our basis is your **implied consent**: you
install the Bot and set a preference, and we store it for the obvious purpose of
honouring it. You can withdraw consent at any time (§9).

---

## 5. Who your data is shared with

**We do not sell your data. We do not share it for advertising. We do not
disclose it to data brokers.**

Your data touches these service providers, all acting as processors on our behalf:

| Provider | What it handles | Where |
|---|---|---|
| **Discord Inc.** | The platform itself — your ID, your interactions | Governed by [Discord's Privacy Policy](https://discord.com/privacy) |
| **MongoDB Atlas** (MongoDB, Inc.) | Stores your preference record | Cloud-hosted — see §6 |
| **Google Cloud Platform** (Google LLC) | Hosts the server the Bot runs on | `us-east1` (South Carolina, USA) |
| **Cloudinary Ltd.** | Hosts cached **game images** — draw thumbnails, patch-note screenshots, weapon images | Cloud-hosted — see §6 |

### 5.1 Two clarifications worth making

**Cloudinary holds no personal data.** The images stored there are game
screenshots and weapon artwork supplied by the administrator. Your avatar is
never uploaded there.

**Google's Vertex AI is not used on your data.** The `/autobuild` command sends
screenshots to Google's Gemini model for text extraction, but that command is
**restricted to the administrator's Discord account only**. No end-user data,
image, or message is ever sent to any AI service. There is no AI processing of
your information anywhere in this Bot.

### 5.2 Other disclosure

We may disclose information if legally required — a valid court order, subpoena,
or law-enforcement request under Canadian law — or where necessary to
investigate a security incident or protect someone's rights or safety. Given what
we hold, such a request would yield very little.

If the Bot were ever transferred to another operator, your data could transfer
with it. We would give notice first, and you could delete your data before it
happened.

---

## 6. International transfers

The Bot's server is in the **United States** (Google Cloud `us-east1`), and our
database and image hosting are cloud services that may store or process data in
the United States, the European Union, or elsewhere.

**If you are in the EEA, the UK, or Switzerland**, this means your data leaves
your region. The transfer relies on the providers' own transfer mechanisms —
Standard Contractual Clauses and, where applicable, the EU–US Data Privacy
Framework — as set out in their respective data processing agreements.

> ⚠️ **Being precise about a limit here:** the exact storage regions for MongoDB
> Atlas and Cloudinary are set in those providers' consoles and are not stated in
> the code. We describe them as "may be in the US or EU" rather than asserting a
> specific region we haven't verified. If exact region information matters to you,
> ask and we will confirm it.

Given the data involved is a user ID and a set of colour preferences, the
practical risk of these transfers is low.

---

## 7. How long we keep it

| Data | Retention |
|---|---|
| **Your preference record** | **Kept indefinitely** until you ask us to delete it — see below |
| **Alert / operational logs** | **30 days**, then automatically deleted |
| **In-memory caches** | Until the next restart or deploy, typically hours to days |
| **Cloudinary game images** | Until the underlying content rolls out of the Bot's history |

### 7.1 An honest disclosure about deletion

**There is currently no automated deletion of preference records, and no
self-service delete command in the Bot.**

Removing the Bot from your Discord account stops all future interaction, but does
**not** by itself erase your stored preferences — they simply sit unused.

**Deletion is currently a manual process:** email us and we will delete your
record by hand. We commit to doing this **within 30 days**, and in practice much
faster.

We consider this a shortcoming rather than a design choice. A self-service
deletion command and an automatic clean-up of long-inactive records are planned.
This policy will be updated when they ship.

---

## 8. Security

What actually protects your data:

- **Credentials** are kept in environment variables, never committed to the
  repository, and the secrets file is permanently excluded from version control.
- **Database access** is restricted and authenticated.
- **All connections** to Discord, MongoDB, Cloudinary, and Google Cloud use TLS.
- **Administrative commands** are locked to a single hard-coded Discord ID —
  no one else can reach the management, alerting, or automation features.
- **Rate limiting and cooldowns** guard against abuse.
- **Only one bot instance** may run at a time, enforced by a database lock.

**Being straight with you about the limits:** this is a personal project on a
single small server. There is no formal information-security programme, no
penetration testing, no SOC 2 audit, and no 24/7 monitoring. No system is
perfectly secure, and we cannot guarantee absolute security.

The upside is that the data at risk is minimal — a public Discord ID and some
colour preferences. There are no passwords, no emails, no payment details, and no
message content to lose.

### 8.1 If there's a breach

If a breach occurs that creates a **real risk of significant harm**, we will:

1. Report it to the **Office of the Privacy Commissioner of Canada**, as PIPEDA
   requires, and keep a record of it.
2. Notify affected users, through the Bot or the project's public channels,
   without undue delay.
3. For EEA/UK users, notify the relevant supervisory authority within **72 hours**
   where GDPR requires it.

---

## 9. Your rights and how to use them

**Whoever and wherever you are, you can ask us to do all of the following** — we
apply the strongest standard to everyone rather than sorting users by
jurisdiction:

| Right | What it means |
|---|---|
| 🔍 **Access** | Get a copy of everything stored about you |
| ✏️ **Correction** | Fix anything inaccurate |
| 🗑️ **Deletion** | Have your record erased entirely |
| 📦 **Portability** | Receive your data in a machine-readable format (JSON) |
| ⛔ **Object / restrict** | Object to processing based on legitimate interests, or ask us to pause it |
| ↩️ **Withdraw consent** | Withdraw at any time, without affecting past lawful processing |
| 🚫 **Non-discrimination** | We will not degrade the Bot for you for exercising a right (CCPA/CPRA) |

### 9.1 How to make a request

Email **info@harkiratmangat.com** with your **Discord user ID** and what you want.

- We will respond within **30 days** (GDPR allows one month, extendable to three
  for complex requests; CCPA allows 45 days).
- **Verification:** we may ask you to confirm the request from an account we can
  tie to that Discord ID, so we don't act on someone else's behalf.
- **Free of charge**, unless a request is manifestly unfounded or excessive.

**Note:** `/settings` lets you *change* your stored preferences at any time, which
overwrites the old values. It does **not** currently offer a reset-to-default or a
delete. For deletion, email us — see §7.1.

### 9.2 Complaints

If you're unhappy with how we handle your data, please tell us first — but you
have the right to go straight to a regulator:

- **Canada:** [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/) — 1-800-282-1376
- **EEA:** your national data protection authority ([list](https://edpb.europa.eu/about-edpb/board/members_en))
- **UK:** [Information Commissioner's Office](https://ico.org.uk/) — 0303 123 1113
- **California:** [California Privacy Protection Agency](https://cppa.ca.gov/)

---

## 10. Children's privacy

The Bot is **not directed at children**. You must meet Discord's minimum age for
your country — **13 in most places, and 14, 15, or 16 in parts of the EU and
elsewhere**. See §3 of the [Terms of Service](TERMS.md).

We do not knowingly collect data from anyone below that age. If you believe a
child's data is stored, email **info@harkiratmangat.com** and we will delete it
promptly.

Because we never collect names, emails, photographs, or message content, the data
we hold about any user — including a young one — is limited to a Discord ID and
display preferences.

---

## 11. Third-party links and content

The Bot displays images and information sourced from third parties, and may link
elsewhere. **We are not responsible for the privacy practices of any third-party
site or service.** Discord's own handling of your data is governed by
[Discord's Privacy Policy](https://discord.com/privacy), which we recommend
reading — it covers far more data than we ever see.

---

## 12. Changes to this policy

We may update this policy. When we do:

- The **effective date and version** at the top change.
- The full change history is public in the repository's git log.
- For **material** changes — new data collected, a new recipient, a new purpose —
  we will make reasonable efforts to give notice before they take effect, and
  will seek fresh consent where the law requires it.

Continued use after a change means you accept the updated policy.

---

## 13. Contact

**Harkirat Mangat ("dior")** — Data Controller
Ontario, Canada
📧 **info@harkiratmangat.com**
🔗 https://github.com/HarkiratMangat/diors-builds

For privacy requests, put **"Privacy Request"** in the subject line and include
your Discord user ID.

---

## Appendix A — Complete data inventory

Every field stored about a user, for full transparency. This mirrors the
`UserPreference` schema in the source code, which you can read yourself at
[`models/UserPreference.js`](../../models/UserPreference.js).

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
- `avatarPalette`, `bannerPalette`, `decorationPalette`, `nameplatePalette` (+ their source hashes)

**That's the whole list.** The source code is public — you're welcome to verify
this yourself rather than take our word for it.

---

*Dior's Builds is an unofficial fan project and is not affiliated with Activision
Publishing, Inc. or Discord Inc.*
