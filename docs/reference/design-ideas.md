# Design ideas — held for later

*Ideas that are **good and not yet buildable**, usually because the content they need does not
exist yet. This is deliberately **not** `docs/db-deferred-list.md`: that file tracks work with an
outcome (a bug to fix, a chore to do, a decision to make). An entry here has no outcome pending —
nobody is waiting on it, nothing is blocked by it, and it may never be built. It exists so the
shape is not lost and so the same ground is not re-explored from scratch in a year.*

*The backward-looking counterpart is `docs/reference/design-history.md`, which narrates redesigns
that already happened. This file is the forward-looking one.*

**How to use it.** Add an entry when an idea is rejected **for timing rather than on merit** —
that distinction is the whole filter. An idea rejected on merit belongs in the deferred list's
🚫 Decided-no section, where the reasoning stops it coming back. An idea rejected on timing
belongs here, with the condition that would make it right written down, because otherwise the
next session either rebuilds it prematurely or never finds it again. When an entry's condition is
met, move it into `docs/db-deferred-list.md` as real queued work and delete it from here.

---

## The cross-referenced contributor index

**Status:** parked 2026-08-02 22:46 EDT · **Condition to revisit:** more than one contributor, or
more than one route with credited entries.

**What it is.** The Contributors page rendered as three side-by-side columns — *Who* · *Route in* ·
*First shipped in*. Hovering or tapping any single item dims every other column to grey and lights
only its related entries across all of them, puts a `→` marker on the source row, and (in the
reference implementation) pops a thumbnail. It is a relational database rendered as three plain
lists, legible instantly with no explanation.

**Where it comes from.** `snp.agency`, captured in the nine-site crawl written up at
`local/site-redesign/reference-research.md` (2026-08-02 14:20 EDT), where it is called the
strongest structural idea in the whole set after the vertical column grid. Note that file lives in
gitignored `local/`, so it is on Harkirat's machine only — this entry carries the essentials so it
survives independently.

**Why it is right for this page eventually.** It is the answer to "how does a credits page do more
than list names". Contribution here already has a natural relational shape: a person came in
through a *route* (bug report · security finding · idea · code) and their work shipped in a
*release*. Those are real, already-recorded facts, not invented metadata — `CONTRIBUTORS.md`'s own
entry template records name, contribution, and first-shipped version. It also degrades gracefully:
with few entries it is still three tidy lists.

**Why it is parked.** There is one contributor and one release, so it would render a relationship
diagram of a single node — a mechanism demonstrating itself with nothing to demonstrate on. That
is worse than not having it, because a relational view with no relations reads as broken rather
than as empty. Harkirat's call, and it is the right one.

**What was decided instead**, and what the page ships with meanwhile: the roster is cut into small
**named sections** — one per route, carrying that route's hue — so no section is ever expected to
be full. One name under "Code" reads as a record where one name in a single wide roster read as a
gap. That solves the emptiness problem structurally and is a precondition the index can build on
later rather than something it would replace.

**A working implementation exists** in `local/site-redesign/mockup-v2.html` (Contributors →
*Index → + Cross-reference*), tap- and hover-driven, with the relation data in `data-rel` /
`data-id` attributes. Start from that rather than from scratch.

**When it is built**, it must clear the same gates as everything else on the site: no decorative
text in the DOM (the `→` marker is CSS `content` on an `aria-hidden` span, or `verify()` breaks —
see `.claude/rules/legal-site.md`), plain `:hover` rules only, and every colour measured at 4.5:1
in both themes.
