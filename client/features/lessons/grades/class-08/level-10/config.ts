import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l10",
  "grade": 8,
  "level": 10,
  "gradeLabel": "Class 8",
  "title": "Communication Review",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Communication Review — a distinct festival square adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about communication review."
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
    "themeId": "class-08-10-communication-review",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "card-carousel",
    "palette": {
      "background": "#f4c2fc",
      "backgroundDeep": "#e691dd",
      "primary": "#7f258f",
      "secondary": "#b88353",
      "accent": "#f53665",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "orbit",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
