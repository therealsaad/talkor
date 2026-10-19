import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l05",
  "grade": 0,
  "level": 5,
  "gradeLabel": "Kindergarten",
  "title": "Food and Fruits",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Food and Fruits — a distinct storybook castle adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to food and fruits."
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
    "themeId": "kg-05-food-and-fruits",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fccfc2",
      "backgroundDeep": "#e6b791",
      "primary": "#8f3c25",
      "secondary": "#63b853",
      "accent": "#def536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "glow",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
