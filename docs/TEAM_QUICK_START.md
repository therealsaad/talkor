# Where each teammate codes (actual files now included)

| Teammate | Edit folders | Do not modify without lead review |
|---|---|---|
| Lead | `client/features/lessons/{types,registry,LevelDraftPreview.tsx}`, backend curriculum models/routes/AI, CI | Student authentication, published Class 4 lessons |
| Junior | `client/features/lessons/grades/{kg,class-01,class-02,class-03}` and matching public asset folders | `client/app/student/kg/page.tsx` live KG pilot |
| Middle | `client/features/lessons/grades/{class-04,class-05,class-06}` and public folders | Existing Class 4 source unless deliberately assigned |
| Senior + AI | `client/features/lessons/grades/{class-07,class-08,class-09,class-10}` and public folders; backend AI integration with lead | Other teammate folders |

## Example: Class 1 Level 1

```text
client/features/lessons/grades/class-01/level-01/
  LevelExperience.tsx    ← visual preview / design component
  config.ts              ← syllabus, world theme, palette, voice policy
  activities.ts          ← fill real exercises after teacher review
  interactions.ts        ← microphone, voice-first and touch rules
  assets.json            ← record real optimized image/video/S3 URLs
  index.ts               ← exports
  README.md              ← individual assignment checklist
client/public/lessons/class-01/level-01/ ← image and sound assets
```

Once signed in as a school admin, open `/school/curriculum-map`, choose Class 1 and Level 1, then click **Open design workspace** to preview the *existing* files. Each level has its own palette/theme and suggestions, not a cloned stock page. **These are staff previews, not student-playable pages.**

## Git / GitHub

```powershell
git clone https://github.com/therealsaad/talkor.git
cd talkor
git switch -c feature/class-01-level-01
# edit only your assigned workspaces; build and test
node tools/verify-110-levels.cjs
git add client/features/lessons/grades/class-01/level-01 client/public/lessons/class-01/level-01
git commit -m "feat(class-01): design level 01"
git push -u origin feature/class-01-level-01
```

Then open a pull request. Do not force-push shared `main`. Never commit `.env`, `.env.local`, model weights, exported student reports, tokens, or local dependencies.

## Windows install / build

```powershell
cd client
pnpm install --frozen-lockfile
pnpm build
cd ../backend
pnpm install --frozen-lockfile
pnpm build
```

The Python `.venv` is **not required** for Next.js or Node work. A local Python AI voice server may still need it, but Azure/Groq backend credentials belong to the backend environment only.
