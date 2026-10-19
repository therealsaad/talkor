import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l09",
  "grade": 0,
  "level": 9,
  "gradeLabel": "Kindergarten",
  "title": "Opposites and Directions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Opposites and Directions — a distinct forest village adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to opposites and directions."
    ],
    "skills": [
      "listening",
      "speaking",
      "picture-recognition"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-09-opposites-and-directions",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcdcc2",
      "backgroundDeep": "#e6ca91",
      "primary": "#8f5325",
      "secondary": "#53b858",
      "accent": "#b5f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
    "animationMood": "orbit",
    "musicMood": "quiet-acoustic",
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
