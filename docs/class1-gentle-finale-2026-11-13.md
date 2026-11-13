# Class 1 Level 1 — Gentle finale participation (stacked review)

**Dependency:** Review PR #143 (gentle word-level poem pairs) before this PR. This is intentionally a separate, small, stacked branch; it is not merged or published.

## The barrier
The current `poem-full` browser already captures five successive short microphone clips of two poem lines each and joins their Sarvam transcripts. The backend's independent 10-line recitation check requires 20+ words and several ordered themes. That remains appropriate for **independent mastery**, but it is too difficult as the only completion path for a Class 1 beginner.

## Reviewed learning decision proposed in this PR
- The **original independent-recitation rule is unchanged**; a full poem with sufficient lines and themes still earns `MASTERED`.
- As an assisted alternative, a child can provide one recognizable English target from each of the poem's **five authored pairs, in order**. Example: `skip / school / grin / jump / hurray`. The server calls this `COMPLETED_WITH_SUPPORT`, meaning a meaningful, guided vocabulary participation task — **not a flawless poem reading**.
- The five targeted groups are derived from the existing reviewed poem-pair word specifications. The student cannot change the criteria or supply grades, cursor positions, source poem, fake audio receipts, or required activities.
- Blank, reversed, missing-section, off-topic, help/question/negated, non-English-script and typed/option submissions do not satisfy this fallback. A complete independent recitation never gets downgraded to supported.
- Recognized supported participation receives one short fixed Miss Julie encouragement without another Qwen request. **Azure TTS stays required**, and the existing server-signed teacher-audio playback receipt must be presented before the ActivityAttempt/progress is saved. No new provider, prompt, DB migration, publication, media or client recorder.
- This remains a text-based STT approximation, not an acoustic pronunciation grade. The server cannot cryptographically prove how five audio snippets were gathered from a single concatenated transcript; the existing UI collects them in sequence, while the backend validates the combined recognized content and signed completion. Do not represent this as anti-cheating evidence, independent mastery or formal fluency certification.

## Automated and real-world acceptance
Existing `tests/unit/firstDayEvidence.test.ts` covers all five ordered keyword groups, language, questions, missing sections, and full vs assisted flags. `tests/integration/firstDayPracticeScaffold.test.ts` covers real HTTP/auth/Mongo assisted and independent paths, forged grades and missing receipt. CI uses synthetic Qwen/Azure; it **does not certify audible playback, school microphone STT, latency, or curriculum approval**.

On a test PIN on a school PC, complete the five previous poem-pair exercises, then the finale. Say one appropriate short word from each two-line clip when prompted; verify a positive ending *after* Azure playback and that the saved status is 'completed with support'. Separately attempt a full fluent recitation; verify that it is reported as independent `MASTERED`. Use `?latency=1` for nonidentifying timestamps, and check resume, Hindi/Marathi help and silent-mic behavior.

## Rollback and limits
Revert this stacked branch only. It adds no Mongo schema or migration. Further improvements to early hints, age-aware pictures, parent/teacher reports, phonetic listening and KG–10 require their own reviewed PRs.
