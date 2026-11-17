# Class 1 first-day introduction eligibility

The modern First Day v3/v4 player previously enforced the complete film only in
React. An authenticated direct voice, AI or attempt request could enter practice
without that film. The existing publication, grade, school and activity checks
now also require a completed, server-timed introduction visit for these lessons.
Curriculum and next-lesson reads still work so the authorized story can load.

The student-only `/voice/first-day/intro/start` endpoint authorizes the actual
lesson/level and issues an unpredictable playback ticket. Its hash, school,
student, lesson, signed session version, reviewed media/revision hash and start
time are stored in a separate expiring collection. Completion requires the same
ticket, full server elapsed time and the client's real unmuted `ended` path.
The packaged film is 90 seconds; another reviewed 87–93 second film must pin its
complete duration in the authorized lesson settings. No shortened server grace
period replaces the complete video. Eligibility expires after two hours; the
TTL index removes old visit records. No transcript, PIN, JWT or recording is
stored in this collection.

A successful Class 1 PIN login atomically increments the existing auth version
before issuing its JWT. Older JWTs and their intro visits therefore cannot
authorize a new login, including two logins within the same second. The intro
controller pins the signed version again to avoid adopting a concurrent newer
login after authentication. Saved attempts, progress and checkpoints are not
changed. Other grades retain their existing login/intro contracts.

The client shares only simultaneous starts for the same token/lesson, rejects
late responses from another login, waits for the server before continuing, and
offers retry when starting or saving fails. It preserves fullscreen requests,
pause-when-hidden, no skipping, reviewed source validation and the full film.
The route supplies the intro for resumed modern lessons too; previously any
completed activity suppressed the film and would leave the new gate unavailable.
There is no cached completed permission in the browser. Opening the film again
starts a fresh viewing. These delivery checks do not prove physical hearing or
attention; school-device acceptance is still required.

## Verification and release

Disposable MongoDB/HTTP tests reject direct voice, AI (activity and lesson-only)
and progress before the film; reject early/forged/expired/missing-ended tickets;
accept a complete timed visit; invalidate changed reviewed media; reject staff
and anonymous callers; and prove a new PIN visit revokes old JWTs without
changing progress. A controller race regression rejects a token revoked after
authentication. Client tests execute real start/complete and video-finish logic,
including delayed responses, retries, duplicate ended events and late metadata.
Chromium tests use the real production PIN form, route and packaged movie for
fresh and saved-progress visits; neither speech nor progress starts beforehand.
They also exercise a visible retry after a failed start. No movie is skipped or
accelerated by these browser tests.
Test clocks advance only records created in the disposable fixture; there is no
runtime bypass or test-only production endpoint.

Release the client and backend together after review. Older clients lack this
protocol and fail closed. The new expiring collection requires its declared
unique and TTL indexes to exist in the deployed database; verify index creation
through the approved deployment process. No production migration or index
operation was performed here. No curriculum is published or unlocked.

Rollback client/server together while keeping the affected lesson unavailable
to real students until intro enforcement is restored. A rollback must not
silently reopen the former direct API bypass. Existing progress needs no data
rollback. The signed final teacher-audio protocol is a separate, complementary
change; both are needed before a Class 1 school pilot.
