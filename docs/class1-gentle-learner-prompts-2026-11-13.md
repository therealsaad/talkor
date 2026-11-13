# Class 1 learner-facing gentle poem wording (stacked draft)

**Dependency:** Open PR #144 (assisted five-section finale) is the base for this review PR. Do not merge before the supported server flow has passed review, because the UI must not promise acceptance that the backend has not enabled.

## Classroom issue
The Class 1 app has historically said **“Full recital”**, **“Your turn to recite”**, and **“Recite”** even when it can recognize short action words. This encourages a six-year-old to believe they must pronounce two whole sentences perfectly.

## Copy-only fix
The existing poem page now tells a learner that **one current word is a good start**, while also offering the original full-line option. Each of the five finale sections displays its own one-word example from the authored illustration/highlight list. The microphone says **Speak** instead of **Recite**. On retry the Hindi/Marathi finale help invites one word from each section or both current lines; the full independent practice path remains visible.

The on-screen example is a visual teaching aid, **not a scored client answer**. No client-side XP/progress, no new grading, navigation, provider request, recording duration, animation asset, music, API, or authentication state is changed. The existing class-1 DOM and CSS structure are retained.

## Safety and acceptance
- Depends on PR #144, which makes completed-with-support available for the finale. Do not publish these prompts ahead of backend approval.
- The server continues using authorized poem lines, the 5-section recap, signed Azure audio receipt, and distinct `MASTERED` vs `COMPLETED_WITH_SUPPORT` outcomes.
- Automated source checks in `client/tests/ui/class1-first-day-adventure.test.mjs` confirm the word choice, Hindi/Marathi help, same microphone controls and absence of fake local completion.
- Real-device pilot still needed on a school computer: children should see the word hint, hear Miss Julie, speak one current poem word, and reach the next section without guessing which button to use. If the original server teacher voice says “recite the whole poem,” it must be revised separately in the reviewed curriculum/teacher prompt pack; this PR intentionally does not silently edit published database content or media.
- The visible word list is pedagogical scaffolding, not proof of phonetic accuracy or comprehension. Teacher reports should not describe supported completion as independent mastery.

Rollback: revert this UI-only branch; no migration or backend release dependency.
