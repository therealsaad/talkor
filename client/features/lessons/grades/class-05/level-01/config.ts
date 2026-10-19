import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l01",
  "grade": 5,
  "level": 1,
  "gradeLabel": "Class 5",
  "title": "Daily Life and Routines",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Daily Life and Routines — a distinct petal garden adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about daily life and routines."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-05-01-daily-life-and-routines",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "big-board",
    "palette": {
      "background": "#c2fced",
      "backgroundDeep": "#91e6e3",
      "primary": "#258f72",
      "secondary": "#7653b8",
      "accent": "#367df5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "bounce",
    "musicMood": "gentle-marimba",
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
