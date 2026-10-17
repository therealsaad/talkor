# Talkora core repair — 21 Sep 2026

## Core flow restored

1. Authenticated student data, progress, conversation history and StudentMemory come from MongoDB.
2. Open lesson conversation is Qwen-first. Node sends the **same live teacher question** shown to the learner as Qwen's `currentQuestion`.
3. Qwen reacts to the learner and returns one structured teacher turn. The frontend uses that exact combined turn for both the bubble and Miss Julie speech.
4. Groq remains the production STT path and the dynamic `CONVERSATION` TTS path.
5. Fixed/page/lesson speech stays on the cached Python Priya lesson voice path.
6. Verified student facts, skill evidence, mistakes and progress are written back to MongoDB for future sessions.

## Fixed bugs

- Open conversations were inheriting `expectedPhrase` / `activity.target` from controlled pronunciation activities. That stale target could override the visible teacher question and make Qwen teach a different thing.
- `FOLLOW_UP_CONVERSATION`, `OPEN_CONVERSATION` and `FINAL_CONVERSATION` were not all treated consistently by the backend conversation detector.
- Typed/option answers were accepted by the UI but `inputMode` was dropped from the transcript API body, so memory/evidence saw them as microphone answers.
- Backend `.env` was routing `AI_PROVIDER=groq`, bypassing the Qwen-first architecture. Repaired backend uses `AI_PROVIDER=qwen`.
- Backend `.env` had 25 duplicated keys; the later empty `GROQ_API_KEY=` could override the configured key. The repaired full backend `.env` is deduplicated while preserving the configured Groq key, and the patch includes `apply_core_env_fix.ps1` for existing projects.
- The Python service has no dependency lock and the reported virtualenv contains a mixed Uvicorn install. Repair scripts pin a consistent Uvicorn runtime and run with the asyncio loop explicitly.
- Stale Python `__pycache__` / `.pyc` files were removed from the repaired AI-service package.

## Start the AI service on Windows

```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
.\repair_uvicorn.ps1
.\run_ai_service.ps1
```

Then check:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Expected architecture indicators: Qwen/Ollama reachable, cached lesson TTS available; local STT may be reported as fallback because production STT is Groq in Node.

## Important TTS note

The uploaded AI service has `INDICF5_MODEL` and a reference-audio path configured, but `INDICF5_REF_TEXT` is empty and the active lesson generator is currently Indic-Parler/Priya cache. This repair does **not** force-switch that working lesson engine to IndicF5 because IndicF5 voice cloning requires the exact transcript of the reference clip; switching with an empty transcript would make Level 1 voice less reliable. The conversation/Qwen mismatch is fixed independently.
