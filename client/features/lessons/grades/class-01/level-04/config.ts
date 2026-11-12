import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l04",
  "grade": 1,
  "level": 4,
  "gradeLabel": "Class 1",
  "title": "Colours and Counting",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Original voice-first Balbharati activities for chapters 2.1–2.4, with English practice and optional Hindi/Marathi support. Educator sign-off pending.",
  "syllabus": {
    "objectives": [
      "Use place words and polite action sentences in familiar spaces.",
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
    "sourcePages": [18, 19, 21, 23],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-04-colours-and-counting",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcecc2",
      "backgroundDeep": "#e6e191",
      "primary": "#8f7025",
      "secondary": "#53b874",
      "accent": "#80f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
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
