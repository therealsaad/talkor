import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l01",
  "grade": 10,
  "level": 1,
  "gradeLabel": "Class 10",
  "title": "Introductions and Interviews",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Introductions and Interviews — a distinct petal garden adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about introductions and interviews."
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
    "themeId": "class-10-01-introductions-and-interviews",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "big-board",
    "palette": {
      "background": "#fcc2e2",
      "backgroundDeep": "#e691ab",
      "primary": "#8f255f",
      "secondary": "#b0b853",
      "accent": "#f57a36",
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
