# Class 1 — short, non-repetitive finale retry (13 November 2026)

**Scope:** Read-only authored poem model, teacher feedback wording and tests. No DB publication, migration, provider switch or scoring change.

The earlier Class 1 fallback could repeat the **entire 10-line Balbharati “My First Day” poem** every time a beginner's final recording was unclear. This is overwhelming, expensive in Azure synthesis duration, and incompatible with patient, small-step teaching.

When the `poem-full` evidence is incomplete, `guardFirstDayPoemTurn` now gives **only the first two approved lines** plus an invitation to say *skip* or *run* or try both lines. English, Hindi and Marathi opening instructions remain available. A first-two-line recovery model is deliberate because the current browser restarts the five-part final clip sequence after an incomplete final submission.

No validated, mastered full recital is truncated. The existing independent evidence checker still sees the entire transcript and full curriculum; this PR does not change the poem source, question-to-evidence normalization, mastery labels, audio acknowledgment, auth or student progress. The entire poem remains available through the existing replay and lesson page.

The full-retry practice scaffold has its own later escalation policy. It can still offer the approved current line after multiple failed turns and may expose a full context model in the UI; that requires a separate reviewed child-experience change. Likewise, already persisted MongoDB teacher instructions may retain older wording until an approved curriculum data update. We do **not** claim this patch completely removes every long-script path.

Acceptance: after a 5-part finale miss, the spoken Azure teacher text contains only the first two authored lines. The screen offers a current-part word/line choice. No synthetic completion occurs; two matching words in a pair or five aligned finale clips still need existing server evidence and signed playback receipt. Verify in the lab with Hindi and Marathi help, interruption, no speech, and `?latency=1` timing; CI is synthetic.

Rollback: revert this PR. No content migration or deployment is performed.
