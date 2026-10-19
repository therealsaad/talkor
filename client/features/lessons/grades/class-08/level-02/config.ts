import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l02",
  "grade": 8,
  "level": 2,
  "gradeLabel": "Class 8",
  "title": "Travel and Directions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Travel and Directions — a distinct treasure cove adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about travel and directions."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing",
      "critical-thinking"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-08-02-travel-and-directions",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#dbc2fc",
      "backgroundDeep": "#c891e6",
      "primary": "#51258f",
      "secondary": "#b85653",
      "accent": "#f536b8",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "bounce",
    "musicMood": "soft-piano",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
