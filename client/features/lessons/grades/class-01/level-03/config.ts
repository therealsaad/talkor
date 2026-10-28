import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l03",
  "grade": 1,
  "level": 3,
  "gradeLabel": "Class 1",
  "title": "People and Family",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Original voice-first Balbharati activities for chapters 1.7–1.10, with English practice and optional Hindi/Marathi support. Educator sign-off pending.",
  "syllabus": {
    "objectives": [
      "Name familiar people and say one short daily-routine sentence.",
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
    "sourcePages": [10, 11, 14, 16],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-03-people-and-family",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fce8c2",
      "backgroundDeep": "#e6dd91",
      "primary": "#8f6a25",
      "secondary": "#53b86e",
      "accent": "#8bf536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "bounce",
    "musicMood": "ambient-bells",
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
