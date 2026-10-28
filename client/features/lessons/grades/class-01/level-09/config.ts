import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l09",
  "grade": 1,
  "level": 9,
  "gradeLabel": "Class 1",
  "title": "My Day",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Original voice-first Balbharati activities for chapters 4.1–4.6, with English practice and optional Hindi/Marathi support. Educator sign-off pending.",
  "syllabus": {
    "objectives": [
      "Speak about movement, animals, music and an imaginary journey.",
      "Explain one step in Hindi or Marathi when requested; always return to short English speaking.",
      "Use modeled feedback for repeated difficulty and extend only when the student is ready."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading"
    ],
    "boardReviewRequired": true,
    "sourceBook": "English Balbharati Standard One (2025; 2026 reprint)",
    "sourcePages": [61, 63, 65, 66, 67, 69],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-09-my-day",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcfbc2",
      "backgroundDeep": "#d3e691",
      "primary": "#8f8d25",
      "secondary": "#53b88f",
      "accent": "#4cf536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
    "animationMood": "float",
    "musicMood": "quiet-acoustic",
    "useReducedMotionFallback": true,
    "minTouchTargetPx": 48
  },
  "learningPolicy": {
    "voiceFirst": true,
    "invisibleAdaptive": true,
    "autoResume": true,
    "introRequired": false,
    "introMustComplete": false,
    "speechLanguage": "en-IN",
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
