import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l02",
  "grade": 1,
  "level": 2,
  "gradeLabel": "Class 1",
  "title": "My School",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "My School — a distinct treasure cove adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to my school."
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
    "themeId": "class-01-02-my-school",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "card-carousel",
    "palette": {
      "background": "#fce5c2",
      "backgroundDeep": "#e6d891",
      "primary": "#8f6525",
      "secondary": "#53b869",
      "accent": "#95f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "glow",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
