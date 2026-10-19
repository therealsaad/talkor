import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l01",
  "grade": 2,
  "level": 1,
  "gradeLabel": "Class 2",
  "title": "Introduce Myself",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Introduce Myself — a distinct petal garden adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to introduce myself."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-02-01-introduce-myself",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "card-carousel",
    "palette": {
      "background": "#f7fcc2",
      "backgroundDeep": "#c9e691",
      "primary": "#858f25",
      "secondary": "#53b89a",
      "accent": "#38f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "float",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
