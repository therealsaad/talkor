# Talkora Class 1 — Landscape Immersion Acceptance

This is a UI-only enhancement on top of the existing `g01-l01` authenticated activity engine. It does not create levels, mark progress, change the published/draft gate, or add Sarvam/Azure/LLM calls.

## Teaching model on screen

- **Miss Julie (left):** existing approved character poses and animation continue to follow speech, listening and thinking states.
- **Learning board (center):** the authored activity remains the source of the task, controls and server-validated answer.
- **Status in Miss Julie's bubble:** during authored foundations it says “Miss Julie’s guided lesson”; during an activity with `aiEnabled` and an actual conversation type it says “AI-guided conversation.” This distinction matters: Qwen does *not* grade or generate every choice activity.
- **Microphone:** the existing voice engine controls microphone start/stop, Sarvam STT, Qwen coaching, retries and progress. UI labels reflect the existing state; they do not issue separate requests.

## Fullscreen and orientation

1. In a landscape viewport, the **Full screen** button requests browser fullscreen for the entire Class 1 lesson.
2. On the first visit, pressing the existing **Play story** button requests fullscreen on the parent lesson container, so completion of the mandatory 90-second video does **not** automatically exit fullscreen.
3. On supported mobile browsers, Talkora requests `screen.orientation.lock('landscape')` after entering fullscreen. A browser may refuse this request; this is not a failure of lesson progress.
4. In portrait orientation, the lesson shows a rotate-device instruction and a one-tap attempt to enter landscape fullscreen. Students can continue after rotating the device; the app never pretends CSS rotation physically changes a device.
5. Browser and OS controls may exit fullscreen. For genuinely locked-down school PCs/tablets, deploy the browser in OS-managed kiosk mode; a normal website cannot force F11 or prevent Escape.

## Supervised checks (no new speech credits needed for UI layout)

1. Start the existing Node/Python/frontend services. Use the authorized Class 1 *demo/fixture* student; do **not** change `TALKORA_CLASS1_DEMO_ALL_STUDENTS` to true.
2. Open `/student/continue` and enter the Class 1 lesson. In desktop landscape, check the left teacher, center task board and Full screen button. Click the button and confirm the browser enters fullscreen.
3. On a phone/tablet or DevTools device emulation, portrait should show the rotate guidance. Rotate to landscape; verify the real choices and mic control remain visible/reachable with a small scroll area on the board if necessary.
4. On an uncompleted first visit, press **Play story**. Check that fullscreen stays active after the video ends. Do not use the test fixture to bypass the mandatory video for an ordinary new student.
5. At the guided conversation activity, inspect the “AI-guided conversation” badge. The already-existing Qwen reply should appear in Miss Julie's bubble with speaking/thinking/listening states. Earlier authored quiz activities must remain labeled “guided lesson.”
6. Only after the layout is approved, perform **one** supervised mic/audio round-trip and inspect the provider usage/cost. Avoid rerunning paid smoke scripts for visual checks.

**Release gate:** Teacher review of the syllabus adaptation, tested microphone and audio playback on actual lab devices, tested resume/progress, and the existing curriculum publication workflow are still required. This UI PR does not turn the Class 1 pilot into a production-approved lesson.
