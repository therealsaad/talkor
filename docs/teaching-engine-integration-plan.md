# Teaching Engine Frontend Integration Plan

Status: proposed; no shared contract is approved.

## Contract boundary

Frontend integration should remain additive behind a versioned `teaching` response field until the project manager approves Codex's shared schema. Legacy fields such as `message`, `emotion`, audio, evidence, and progress behavior must continue to render unchanged.

Production integration code must not be written from this provisional shape:

- `lessonId`
- `activityId`
- `teachingState`
- `teacherUtterance`
- `language`
- `visualAction`
- `expectedStudentAction`
- `feedbackType`
- `masteryEvidence`
- `nextAllowedActions`
- `progressUpdate`

The plan below defines tests, not the final implementation contract.

## Contract test strategy

1. Validate schema versions separately from lesson content.
2. Accept only known teaching states and reject unknown states in a single typed adapter.
3. Missing optional presentation fields must use safe legacy defaults.
4. Required identity fields (`lessonId`, `activityId`) must match authorized frontend state.
5. Visual actions map through allowlisted components; unknown actions do not mutate progress.
6. Language values map to supported UI/audio locales.
7. Invalid state transitions show a recoverable integration error.
8. Malformed model output never advances the lesson or reports mastery.
9. Progress only changes after the backend returns independently verified mastery evidence.
10. Repeated responses reuse an idempotency key and cannot create duplicate attempts.
11. Stale responses for a previous lesson/conversation are discarded.
12. Network timeout, abort, and retry paths preserve the student's original response.
13. Backend timeout errors do not remain permanently stuck in listening or speaking state.

## Fixture files

Place isolated fixtures under a dedicated frontend test-fixtures directory after the contract is approved. Initial fixture groups:

- valid presentation only
- complete mastery evidence
- missing optional fields
- unknown teaching state
- invalid transition
- malformed model output
- timeout
- duplicate response
- stale lesson response
- unsupported language
- unsupported visual action

## Test layers

- **Unit adapter tests:** normalization, validation, state guards, and allowlisted mappings.
- **Source contracts:** legacy route and field preservation; production integration remains disabled.
- **Service tests:** timeout, cancellation, duplicate submissions, and retry behavior.
- **Browser integration:** rendered teaching feedback and microphone recovery with mocked responses.
- **Hardware validation:** real microphone, speech recognition, and audio output documented separately.

## Integration risks

- Node and Python inference deadlines must share one request budget.
- Frontend lesson identity must not substitute for backend authorization.
- AI output can be presentation-correct while mastery evidence is incomplete.
- Language selection can affect pronunciation and visual feedback and must not be inferred from UI text alone.
- Rapid responses can arrive out of order; conversation/lesson/activity IDs and sequence numbers must be validated.
- Tests with mock AI responses cannot prove real model correctness or measurable student mastery.
