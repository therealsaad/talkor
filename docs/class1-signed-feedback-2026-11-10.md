# Class 1 saved teacher audio and signed acknowledgement

Final First Day v3/v4 progress previously accepted an authenticated session ID
without proving that teacher audio had been generated. A final or recovered turn
now supplies `teacherSessionId` to `/voice/synthesize`. Node authorizes the saved
session/activity and speaks its frozen text and saved language through Azure.
Client text cannot replace that response. The existing ordinary synthesis API
continues to work without this optional field but cannot issue a progress receipt.

Node consumes and validates the complete bounded audio before issuing
`X-Class1-Feedback-Receipt`. Empty, truncated, non-audio or unavailable speech
cannot produce a receipt. The existing HMAC signer is reused with a namespace
that KG submission IDs cannot occupy. The receipt binds school, student, auth
visit hash, voice session, activity and frozen teacher text, and expires after
15 minutes. No tokens, text or audio are persisted in this receipt mechanism.

The browser stores a receipt only after a current, unmuted audio element ends;
errors, cancellation, stale login results and late ended events cannot create
heard evidence. Final speech cannot use the generic lesson audio cache. The ACK
body contains `feedbackReceipt`; Node validates it before the existing idempotent
progress call. A retry or reload replays the saved response and obtains a new
receipt, without another STT/Qwen attempt. Login changes stop playback and clear
generic replay/cache state and receipts so the next child inherits no voice.

This is a delivery checkpoint, not proof of physical hearing, understanding or
pronunciation. Node's existing evidence determines grades/XP; neither this token
nor Qwen chooses publication or mastery. All curriculum/media approvals and
KG6–10/Class 1 locks remain in place. Class 1's separate server intro-eligibility
gap requires its own protocol change; a signed feedback receipt does not fix it.

## Verification and rollout

Behavioral client tests execute the real playback service with controllable media
events. Backend tests cover missing/forged/expired/cross-student/cross-activity/
cross-session/cross-login/altered-text receipts and bad audio. Disposable Mongo
HTTP tests prove no attempt exists before valid generation+ACK, browser text is
ignored, and repeated ACKs create one attempt. These are synthetic tests; no
paid provider or physical microphone/speaker acceptance is claimed.

Deploy backend and client together after review, or backend first during a
coordinated maintenance window: old clients' unsigned ACKs intentionally fail
closed. The new client also fails closed against a server that lacks the receipt
header. Do not enable a compatibility bypass. Pending saved teacher turns remain
recoverable. No schema migration, curriculum publication or existing progress
rewrite is required. If reverting, revert client/server together; returning to
unsigned ACKs requires a security review before real students use the release.
