---
kind: record
status: frozen
---

# The summary corpus: 12 messages, four rounds, his ratings

*Recorded 2026-09-22 21:29 EDT. Harkirat rated my rewrites of 12 real end-of-run messages from 1 (terrible) to 5 (near great), in four rounds, on the artifact `VWhr3tjRbuBHLsJu4y4CGZ` (database collections `ratings` to `ratings4`). Every score and note below is copied from that database by script, not retyped. The Silent contract in `.claude/rules/silent-mode.md` was rebuilt from this record; the round-4 rewrites he rated are in [`2026-09-22-summary-corpus-round4.txt`](2026-09-22-summary-corpus-round4.txt) (plain text, so the prose reflow cannot join the code blocks inside it), and the working files are in `local/summary-corpus/`.*

## Scores

| # | Kind | R1 | R2 | R3 | R4 |
|:-:|---|:-:|:-:|:-:|:-:|
| 1 | A yes/no answer with evidence | 4 | 4 | 4 | 4 |
| 2 | An options menu | 2 | 4 | 4 | 5 |
| 3 | A root cause, found | 4 | 4 | 3 | 5 |
| 4 | A small triage note | 4 | 4 | 3 | 3 |
| 5 | A count | 4 | 4 | 4 | 4 |
| 6 | An investigation’s result | 4 | 4 | 4 | 4 |
| 7 | An intake log | 4 | 3 | 4 | 4 |
| 8 | A publish, with measurements | 3 | 3 | 4 | 4 |
| 9 | A checkpoint partway through a plan | 4 | 4 | 5 | 5 |
| 10 | An answer to “do I need to…?” | 3 | 3 | 3 | 4 |
| 11 | Owning up to a round | 4 | 3 | 4 | – |
| 12 | A compact prep | 4 | 4 | 4 | 5 |
| | **Average** | 3.67 (12 rated) | 3.67 (12 rated) | 3.83 (12 rated) | 4.27 (11 rated) |

## What each round changed

| Round | What I did | What it taught |
|:-:|---|---|
| 1 | Compressed every original | Dropping a qualifier made a false claim (#2 scored 2); order and labels misled |
| 2 | Restored every fact by pasting the original sentences back | Facts back, but sentences in cells and duplicated blocks made it wordier; a question of his was taken as a work order |
| 3 | Round 1's look with round 2's facts as phrases | Rebuilding whole elements lost parts he liked; my audit trail is useless detail to him |
| 4 | Only his round-3 notes applied, nothing else | The biggest jump and four 5s; a sample with no note still needed the lessons |

## Next: the real test

Agreed 2026-09-22 21:46 EDT: the next session adds its own real end-of-run summaries to the corpus page (artifact `VWhr3tjRbuBHLsJu4y4CGZ`) and he rates a few, because every rule so far came from rewriting old messages rather than writing new ones. Compare with this session's baseline from `node scripts/summaryShape.mjs --session latest`: 18 of 57 final messages put a sentence in a table cell.

## Every note, verbatim

### 1 · A yes/no answer with evidence

**Round 1, scored 4:**

> missed some important sprinkles of detail such as the 2 cores of the linux runner, etc.

**Round 2, scored 4:**

> better but you could make some of these lines more concise and to the point. i also don't like the fact that your verdict title "No, GitHub Pro changes nothing while this repo is public." has a whole another sentence slapped onto it. and the fact that the verdict title is smaller than the "If the repo goes private" heading.

**Round 3, scored 4:**

> tables fine, "no" title is fine, line below the title is fine. everything else needs improvement.

**Round 4, scored 4:**

> "Included minutes" didn't need to be a table. it could have been styled differently. And have you noticed that you're not using the full capabilities of the markdown syntax available to you?

### 2 · An options menu

**Round 1, scored 2:**

> Wish you'd kept the "Best pick" or presented it in an even better method/better integrated into the summary. #2 also stated in the original that it was "Not checked yet" and that's a claim which you completely overrode and removed, implying you actually had checked that item — false claims are bad. #1 also lost an important detail "that waits for the other 3." because that portion was the most important in that catch. #4 also used to state WHY the browser tests must stay one at a time, which you removed and that was an important fact. Oh wait, you did state the "best pick" line, you merged it into the title/header — that just dropped you from a 3 to a 2 rating.

**Round 2, scored 4:**

> your "my pick" columns and your "best pick" line are redundant and also different phrases. my pick is not the same as best pick.

**Round 3, scored 4:**

> would have preferred if you kept best pick as `>` quote block.

**Round 4, scored 5:**

> acceptable i guess.

### 3 · A root cause, found

**Round 1, scored 4:**

> Overall very nice styling/aesthetic but the order/layout in which you presented the info feels incorrect and misleading. I read your "One selector in app.css reached further than it was written to:" line and assumed that initial code block entirely was the issue. so i actually had to go read the original fully and thats when i realized that `.exs-t span` -> `.exs-t > span` was the overall solution.

**Round 2, scored 4:**

> your bug line could have been better, it didn't need a full width code block. it also sort of implies the child one is `.exs-t span { font-size: var(--t-sm) }`.

**Round 3, scored 3:**

> dif was nice.

**Round 4, scored 5:**

> fine i guess. I'm not really detail reading everything this round, I'm more or just glancing and judging based on that so idk if the info or details are true and/or included/missing.

### 4 · A small triage note

**Round 1, scored 4:**

> cleaner but so much prose.

**Round 2, scored 4:**

> i don't like your verdict lines being paragraphs.

**Round 3, scored 3:**

> I DON'T WANT TO READ LINES TO FIGURE OUT THE INFO!

**Round 4, scored 3:**

> making a text bold doesn't change the fact i still need to read it's full sentence to understand the line.

### 5 · A count

**Round 1, scored 4:**

> in some ways cleaner, in some ways more confusing and still prose heavy and requiring me to read the full bullet points to understand the info.

**Round 2, scored 4:**

> the Live column is using wayyyy too much width of the table. overall better but also worse in other parts.

**Round 3, scored 4:**

> round 1's graph was better, it needs round 3's source column. "next" line could be better formatted.

**Round 4, scored 4:**

> liked the "next" style of round 2 better.
>
> not a fan of your "Every row but 3-E is a floor: the artifact service shows no version history.
>
> 36 of 3-E's 72 were never written down; they exist only as things you looked at and reacted to
>
> You were the QA pass for all of them. Tonight: 4 publishes, 4 returns, 25 defects, all found by you" aesthetically.
>
> and speaking interms of glancability, round 2's "Every row but 3-E is a floor" and "What the count shows" were better.

### 6 · An investigation’s result

**Round 1, scored 4:**

> ordering on information in each section could be better.

**Round 2, scored 4:**

> decrease prose.

**Round 3, scored 4:**

> acceptable but i don't like that title. it makes the entire summary read as narration than a summary. honestly, that's howd id describe this entire '06' example, especially considering lines like "5 causes of the disagreement: 4 are codebase-memory gaps, 1 was my mistake. I checked each in the graph and rebuilt the worst on a 3-file test repo.".

**Round 4, scored 4:**

> meh.

### 7 · An intake log

**Round 1, scored 4:**

> much cleaner but also missing a few useful bits of info, such as "with screenshots v10-21 to v10-24" missing the # of screenshots which would have been helpful instead of me having to figure out the math. Overall for each section in this, the verdict is: cleaner but dropped specks of useful info.
>
> Also, couldn't you have put the 'open items' checkbox list inside of the table's cell? is that not possible or something??

**Round 2, scored 3:**

> you lost some of the nicer, cleaner styling while attempting to add back info. the 2 are not interchangeable

**Round 3, scored 4:**

> i understand you want to separate the list out of the table, and thats fine. but the actual format/style of the lists could be better.

**Round 4, scored 4:**

> nearly great, needs some bloated/unnecessary prose trimmed

### 8 · A publish, with measurements

**Round 1, scored 3:**

> decreased prose but also lost some nice styling and key information, making things much more confusing.

**Round 2, scored 3:**

> too prose heavy.

**Round 3, scored 4:**

> "the original defect is gone at the class" section could be better.

**Round 4, scored 4:**

> sure, acceptable.

### 9 · A checkpoint partway through a plan

**Round 1, scored 4:**

> much cleaner but could be better, especially the "Everything is committed on feat/portal-pins2-manifests, nothing is pushed, and agent D hasn't reported yet. The dev database now has 130 builds with slot data, one for each tagged image." line.

**Round 2, scored 4:**

> nicer but also worse/prose heavy.

**Round 3, scored 5:**

> acceptable i guess. Would prefer the "agent D still running" to be stated different/elsewhere tho.

**Round 4, scored 5:**

> "Agent D: dispatched, still running" as an open checkbox was not the right call.

### 10 · An answer to “do I need to…?”

**Round 1, scored 3:**

> meh.

**Round 2, scored 3:**

> diagram overly complicated

**Round 3, scored 3:**

> i hate having to read a full sentence to figure out what im reading.

**Round 4, scored 4:**

> usable.

### 11 · Owning up to a round

**Round 1, scored 4:**

> still could be improved, especially the `"Still looks skippable," the third time, so I stopped rewording
>
> Grey, small and trailing something louder is how this board says skip me. Lines that carried no new fact are deleted. "Builds 1–5" carries one, so it's now set as data in the weapon's accent.` line.
>
> and listing the badges and slot colors items within the "Where the round stands: 17 of 24" list is misleading.

**Round 2, scored 3:**

> *(no note)*

**Round 3, scored 4:**

> *(no note)*

**Round 4, scored –:**

> literally nothing changed??

### 12 · A compact prep

**Round 1, scored 4:**

> could still be improved tho, such as the "Surfaces I never opened" lines. or the fact you didn't mention/state the `docs/claude/pins2/handoffs/2026-09-21-board4-fixplan.md` line. and shouldn't the "Waiting on you" be open checkboxes with number 1./2. following the checkbox?

**Round 2, scored 4:**

> waiting on me should be one of the final lines.

**Round 3, scored 4:**

> idc about every single detail that your "The audit" found! useless to me! i also liked your table of "Live, etc" from round 2 better. also, i don't care about every detail of your "corrections". the rest is fine.

**Round 4, scored 5:**

> clean.
