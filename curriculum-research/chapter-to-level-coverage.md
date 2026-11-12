# Talkora Class 1 — Ordered Chapter-to-Level Coverage Proposal

**Status: PROPOSED_MAPPING_PENDING_PM_APPROVAL (every row).** Replaces the checkpoint-1 mapping, which the PM did not approve.
**Constraints honored (PM checkpoint 1):**
- The ten canonical levels `g01-l01 … g01-l10` and their roadmap titles are **unchanged**; both textbooks map onto the same ten levels.
- No chapter ID is reused across textbooks (`bal-g01-…` vs `meb-g01-…` namespaces them).
- The two books do **not** need identical level counts or a one-chapter-one-level mapping; the existing 10-level experience is preserved.
- No existing progress is broken: the only *implemented* content (bal 1.1 → `g01-l01`) keeps exactly that mapping.
- No objective is taught **only** at a late level: each objective is **introduced** early (oral/TPR) and **consolidated** later — the schema's `role: INTRODUCES / CONSOLIDATES / REVISITS` field makes this machine-checkable.

**Memory milestones (PM correction):** every chapter entry now carries `recallDesign` with three milestones — IMMEDIATE_REPETITION, INDEPENDENT_ANSWERING, DELAYED_RECALL — and mastery indicators are satisfiable only at the last two. Repetition alone never counts.

---

## 1. Ordered coverage matrix — English Balbharati (English-medium track)

| Level | Roadmap title | Unit One feeder (role) | Later-unit feeders (whole-book proposal, pending) |
|---|---|---|---|
| g01-l01 | Little Words & My First Day | 1.1 My First Day (INTRODUCES) — **implemented, unchanged** | — |
| g01-l02 | My School | 1.3 I know my alphabet (INTRODUCES) · 1.5 Fun with Special Letters (INTRODUCES) · **1.2 Clap your hands. (INTRODUCES — action instructions arrive in week 1, not level 7)** · 1.4 Let us read. (CONSOLIDATES) | 2.3 In the Classroom |
| g01-l03 | People and Family | 1.7 Meet my family. (INTRODUCES) · 1.8 Let us know each other. (INTRODUCES) · 1.9 Everybody has a name. (CONSOLIDATES) | 3.2 Suyog makes friends. |
| g01-l04 | Colours and Counting | 1.6 The Rainbow (INTRODUCES) | 2.11 My Flower · 2.12 Festivals |
| g01-l05 | Things I Like | — (Unit One has no natural feeder; nothing is skipped: l05 is fed by its later-unit chapters below) | 4.3 Singing is Fun! |
| g01-l06 | Animals Around Us | — (fed later) | 2.10 Himani and the Ladybug · 3.7 The Squirrel · 3.11 My Kitty Cat · 4.2 Harry, the Hippo |
| g01-l07 | Action Words | 1.2 Clap your hands. (CONSOLIDATES — the rhyme *introduces* the words at l02 in week 1, *consolidates* here) | 2.1 It's Time to Play · 2.7 Things I Do |
| g01-l08 | Simple Questions | 1.8 Let us know each other. (INTRODUCES) | 3.8 Alia falls sick. · 4.6 Off to Mars! |
| g01-l09 | My Day | 1.10 My Daily Routine (INTRODUCES) | 2.5 Weather · 3.6 Raghu goes to the market · 4.4 Chit Chat |
| g01-l10 | Story Time | — (fed later) | 3.3 The Fox and the Crow · 3.9 The Ant and the Grasshopper · 3.10 Minku, the Monkey · 4.7 Honest Abhi |

**Checkpoint-1 complaints addressed:** 1.2 was mapped *only* to l07 (much later) — now it introduces at l02 and consolidates at l07; 1.3/1.4/1.5 all mapping to l02 was flagged — they remain l02 because that is where "My School" content lives, but with explicit roles (introduce/introduce/consolidate) and a note that l05/l06/l10 are deliberately fed by later units rather than force-fitted to Unit One chapters.

## 2. Ordered coverage matrix — My English Book (non-English-medium track)

| Level | Roadmap title | Unit One feeder (role) | Later-unit feeders (whole-book proposal, pending) |
|---|---|---|---|
| g01-l01 | Little Words & My First Day | 1.1 Body Body Pop Pop (INTRODUCES — oral TPR opener) | 4.2 Greetings |
| g01-l02 | My School | 1.8 My Classroom (INTRODUCES) · 1.6 Fun with Sounds b-c-p-t-a (INTRODUCES) · 1.9 Fun with Sounds d-f-m-n-e (CONSOLIDATES) · 1.4 Clap your hands. (INTRODUCES — classroom instructions) | 3.5 Alphabet Song · 3.6 Capital Letters-Small Letters |
| g01-l03 | People and Family | 1.2 What is your name? (INTRODUCES) | 3.2 Vehicles (people transport context) — weak; primary feeder is 1.2 |
| g01-l04 | Colours and Counting | — (Unit One has no colour/count chapter) | 3.9 Numbers |
| g01-l05 | Things I Like | 1.3 My Home (INTRODUCES — naming things in one's world) | 2.1 Vegetables · 2.7 Birthday Party |
| g01-l06 | Animals Around Us | — (fed later) | 2.4 Animals I Know · 2.6 Birds can fly · 3.10 The Ant and the Pigeon |
| g01-l07 | Action Words | 1.4 Clap your hands. (INTRODUCES) · 1.7 What can you do? (CONSOLIDATES + Queen Says game) | 2.2 Fingers |
| g01-l08 | Simple Questions | 1.2 What is your name? (INTRODUCES) · 1.5 Chit Chat (INTRODUCES — 'When do you…?') · 1.7 What can you do? (INTRODUCES — 'Can you…?') | 2.10 Who ate the butter? |
| g01-l09 | My Day | 1.5 Chit Chat (INTRODUCES — time-of-day routine chart, pp.5-7) | 3.7 Days of the Week · 3.3 Lunch Time · 4.1 Months of the Year |
| g01-l10 | Story Time | 1.10 Tip-Tap, Tip-Tap (INTRODUCES — rhythm/rhyme) · 1.11 We want rain. (INTRODUCES — first picture story) | 2.9 Water Bell · 2.10 Who ate the butter? · 3.10 The Ant and the Pigeon · 4.8 The Magic Fish |

**Whole-book MEB index verified** from the official PDF Contents (printed p. contents page): Unit Two 2.1–2.10, Unit Three 3.1–3.10, Unit Four 4.1–4.9 (42 chapters total, 87 PDF pages). Every level l04/l06 gap above is fed by a named later-unit chapter — nothing is skipped across the year.

## 3. Ordering rules the validator can enforce

1. Every chapter's mapping rows carry `role`; a chapter feeding a level whose ordinal is *later than its own book position* must be `INTRODUCES` somewhere earlier or `CONSOLIDATES` (never an orphan late-only mapping). ✔ encoded in `lesson.talkoraLevelMapping[].role`.
2. Across each book's full map, all ten levels must receive ≥1 feeder chapter (`INTRODUCES` or `CONSOLIDATES`). For Unit-One-only extracts, levels without a Unit-One feeder must be listed with their later-unit feeders (tables above) — flagged, not hidden.
3. `status` is `PROPOSED_MAPPING_PENDING_PM_APPROVAL` on **every** row; nothing becomes `APPROVED_BY_PM` until the PM signs the matrix.
4. Canonical level IDs and titles are echoed from `backend/src/curriculum/roadmap.ts` and drift-checked by the validator.

## 4. Deliberate design choices (for PM scrutiny)

- **No one-chapter-one-level pretence.** Unit One of either book cannot fill all ten levels honestly; pretending otherwise is what produced the rejected checkpoint-1 mapping. Levels l04 (bal), l04/l06 (MEB) are fed by later units, in order.
- **TPR-first content lands early.** Both books open with body/action rhymes; these now feed l01/l02 as oral warm-ups regardless of which book the school configures, so the first week's experience is equivalent across tracks.
- **Phonics strand (MEB 1.6/1.9 + later Fun-with-Sounds chapters) sits under l02** with `INTRODUCES`/`CONSOLIDATES` roles, mirroring where the English-medium book's alphabet/special-letters chapters feed (bal 1.3–1.5 → l02).
- **Existing progress untouched:** bal 1.1 → g01-l01 mapping, roadmap titles, and the implemented lesson are byte-for-byte the same addresses as before this proposal.
