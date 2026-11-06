# Class 1 Level 1: My First Day — poem recitation (v4, demo only)

Source: user-supplied **English Balbharati Grade One**, 2025 edition,
PDF **page 11** / printed page **1**, Unit One lesson **1.1**.
The chapter comprises three stanzas of ten lines and a "Look and say" word
bank (see, skip, school, everyone, walk, grin, bell, rings, jump, play,
Grade, hurray). The lesson is a poem, **not ten isolated word scenes**.

## Learning sequence

1. Existing full-screen introductory video plays before student interaction
   (no in-app skip). This video must be reviewed and hosted at a real URL.
2. Miss Julie performs the entire poem rhythmically through **dynamic Azure
   voice**. The original quiet instrumental pulse can be enabled through
   a button on the poem page. This is a *rhythmic recitation*, NOT a
   guaranteed sung, pitched vocal performance; a singer or a proven singing
   synthesis system is needed for a genuine vocal song.
3. Five pairs of **two consecutive poem lines**. On each step Miss Julie
   recites the lines first; the child repeats using the existing Sarvam STT
   -> local Qwen 8002 -> Azure TTS live loop. If one line is missing, Qwen
   coaches it in short, kind English/Hindi/Marathi and stays on the same page.
4. Full three-stanza recitation in **five two-line microphone segments** (each
   less than the existing ten-second limit). Miss Julie prompts each next pair;
   intermediate STT clips cancel their temporary voice session and never score.
   The five transcriptions are combined into one final authenticated Qwen
   evaluation. A one-word answer cannot pass. The child recites every line in
   order with brief pauses, not a seamless uninterrupted karaoke recording.
   Text evidence does not claim to measure accent, pitch or comprehension.
5. Only after complete teacher feedback playback does the existing
   authenticated teacher-audio acknowledgment save an activity attempt.
   Existing lesson resume, spoken homework and student PIN are preserved.

## Install safely after media and service checks

From `backend`, run a preview (read-only):
```powershell
$env:NODE_ENV='development'
pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-poem.ts
```

The v4 poem is a **new** draft lesson: 6 activities. It does not update
old v2/v3 lesson IDs, progress, attempts, conversations or the 30 S3 clips.

Before intentional installation, supply the actual reviewed full-screen
intro video URL in `TALKORA_FIRST_DAY_INTRO_URL` and set
`TALKORA_FIRST_DAY_INTRO_REVIEWED=YES`. The following opt-in is a
developer/database safety check, **not a teacher or school dashboard gate**:
```powershell
$env:TALKORA_CLASS1_POEM_STAGE='YES'
pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-poem.ts --apply
Remove-Item Env:TALKORA_CLASS1_POEM_STAGE
```
Only development MongoDB database exactly named `test` is accepted.

Keep port 8002 running the new *separate* private AI repo commit that supports
`Poem lines 1-2` etc. Before a live demonstration, check the actual generated
Azure singing/recitation sound, Sarvam pronunciation and Qwen coaching from a
school lab microphone. Existing approved audio uploads are not poem songs.

Never claim this adaptation includes a licensed textbook recording, a real
singing model, or verified musical performance. Review the publisher's
copyright/permission terms before wider distribution of the poem text/audio.
