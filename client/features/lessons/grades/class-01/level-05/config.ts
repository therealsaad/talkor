import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l05",
  "grade": 1,
  "level": 5,
  "gradeLabel": "Class 1",
  "title": "Things I Like",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Original voice-first Balbharati activities for chapters 2.5–2.8, with English practice and optional Hindi/Marathi support. Educator sign-off pending.",
  "syllabus": {
    "objectives": [
      "Speak politely, name weather and talk about books and everyday actions.",
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
    "sourcePages": [26, 27, 28, 31],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-05-things-i-like",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "big-board",
    "palette": {
      "background": "#fcefc2",
      "backgroundDeep": "#e5e691",
      "primary": "#8f7625",
      "secondary": "#53b879",
      "accent": "#76f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "sway",
    "musicMood": "light-chimes",
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
