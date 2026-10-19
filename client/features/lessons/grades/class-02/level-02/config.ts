import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l02",
  "grade": 2,
  "level": 2,
  "gradeLabel": "Class 2",
  "title": "My Favourite Things",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "My Favourite Things — a distinct treasure cove adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to my favourite things."
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
    "themeId": "class-02-02-my-favourite-things",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "explorer-trail",
    "palette": {
      "background": "#f4fcc2",
      "backgroundDeep": "#c5e691",
      "primary": "#7f8f25",
      "secondary": "#53b8a0",
      "accent": "#36f53f",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "sway",
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
