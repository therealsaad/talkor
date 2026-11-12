# Class 1 First Day: sound-on automatic intro start (2026-11-11)

## Reproduced issue
The Class 1 Level 1 `Class1LessonIntro` originally initialized `needsTap=true` and only called `video.play()` inside the **Play story** click handler. Even on a browser that permitted unmuted autoplay after a student had just submitted their PIN, the video stayed paused until someone clicked the button. This was visible on the authenticated `/student/lesson/:id` route, including on resumed visits.

## Fix
- Keep the existing approved 87–93 second video validation and the server-scoped first-day introduction ticket.
- Once **both** validation and ticket readiness pass, attempt `HTMLVideoElement.play()` automatically **with `muted=false`, volume 1**. Native `autoPlay` is intentionally not set, as it could run before the ticket or validation.
- While the browser permits the unmuted play, there is **no Play story button** and no extra child click.
- If a browser rejects the sound-on play (autoplay restrictions are built into Chrome/Edge/Brave/Safari), show a minimal **Start with sound** button. Its real click retains the existing best-effort fullscreen and audio-unlock behavior. Never silently play muted or skip the 90-second intro.
- On a server-intro failure, invalid film, missing source, hidden tab or explicit retry, retain existing permission/error/retry gates. A fresh retry may attempt autoplay only after the new media validation and new ticket.
- The existing sequential-playback check, visible/unmuted time accumulation, (85 s) watch minimum, completion POST, progress gate, and signed voice-audio ACK are unchanged.

## Test and verification
- The production Next + Chromium Class 1 intro browser suite now tests automatic unmuted playback after both initial login **and** saved-progress resume, without clicking play.
- A deterministic synthetic NotAllowedError on the first video play verifies that a browser requiring user activation shows **Start with sound** and that the following genuine click resumes real media. No fabricated movie-complete event is used.
- A failed ticket verifies **zero autoplay attempts**, visible retry and no microphone/teaching requests before a successful new intro ticket.
- The existing static intro contract suite enforces ticket gating, no native autoplay bypass, sound on, and the visible one-tap fallback.
- Run the pinned full frontend/CI checks and manually validate on Brave/Chrome in both a fresh student PIN visit and resume.

## Browser and school-device limitation
The web platform does not allow a website to guarantee **audible autoplay** or F11-style fullscreen on every browser. A restrictive or new profile may still need one genuine user interaction. The supported deployment route for guaranteed click-free class sessions is a managed school browser/kiosk profile **configured by the administrator** to allow sound autoplay for the trusted Talkora origin. Do not bypass browser user-activation policies or remove the mandatory sound check.

No publication, DB migration, media replacement, backend/Python change or production deployment occurs in this patch. Reverting the small frontend component and its tests restores the original behavior.
