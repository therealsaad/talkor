# KG 1: separate soft music layer (V4 additive patch)

**Nothing in the backend AI or S3 voice pipeline changes.** This addition only affects the original `client/app/student/kg/page.tsx` lesson player. It uses one original 24-second ambient MP3 and the native browser Audio element (no new npm dependencies). The intro film is untouched and retains its embedded soundtrack.

## Behaviour

- **Mandatory fullscreen intro:** no background music starts. The film owns its soundtrack.
- **Teacher and word explanations:** the music runs very softly (~1.8% element gain) while the voice audio is active. Separate from the TTS clips.
- **Student microphone / evaluation:** the background track is paused and volume set to zero **before microphone permission is requested** and throughout recording and checking.
- **Drawing/pointing picture activities, ready screens, celebrations:** quiet ambient loop (~12% element gain on an already gentle source).
- **Voice feedback, map navigation and spoken homework:** all duck independently of phase via the speech lock, even when the lesson has already finished.
- **Teacher music toggle:** Music on/off in lesson header. Does **not** mute Miss Julie's instructional audio. Preference is in-memory only; no cross-student persistence on school lab computers.
- **Browser autoplay:** music is only unlocked by the child's explicit Start/Continue click. If browser playback fails or the optional music asset is missing, the lesson remains usable with no music.
- **Leaving/tab hidden/logout:** music pauses, and the mixer is disposed on unmount.

## Music file

`client/public/kg/audio/garden-ambience-v1.mp3` — 24-second, 64-kbps mono MP3, original soft celesta/pad tune synthesized with `scripts/make-kg-garden-music.py`. No third-party samples or licensing dependencies. You may replace it with your own properly licensed gentle music **using the same filename**. Keep it seamless, without spoken words, and do not embed it in the S3 TTS MP3s. Put the music volume down even further if your school computers have loud speakers.

For a new music asset, change the filename in `client/lib/kg-ambience.ts` (cache-bust with `v2` etc.) and test Chrome/Edge microphone capture with real speakers. `modeForKGPhase`, `KGAmbienceMixer` and the React hook can be reused for later KG levels; other classes remain unchanged.

## Developer test

From `client/` (Node 22+):

```bash
node --experimental-strip-types --test tests/kg-ambience.test.mjs
node --test tests/ui/kg-pilot-experience.test.mjs
```

To verify a full app build after dependency installation:

```bash
pnpm install --frozen-lockfile
pnpm build
```

**Not verified here:** full Next production build / browser speaker-microphone leakage, S3 voice endpoints. They require your installed npm dependencies and real school devices.
