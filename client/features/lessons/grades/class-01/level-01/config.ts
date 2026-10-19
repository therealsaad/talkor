import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l01",
  "grade": 1,
  "level": 1,
  "gradeLabel": "Class 1",
  "title": "Letters and Sounds",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Letters and Sounds — a distinct petal garden adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to letters and sounds."
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
    "themeId": "class-01-01-letters-and-sounds",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "split-story",
    "palette": {
      "background": "#fce2c2",
      "backgroundDeep": "#e6d391",
      "primary": "#8f5f25",
      "secondary": "#53b863",
      "accent": "#a0f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "orbit",
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
