import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l05",
  "grade": 1,
  "level": 5,
  "gradeLabel": "Class 1",
  "title": "Things I Like",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Things I Like — a distinct storybook castle adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to things i like."
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
    "themeId": "class-01-05-things-i-like",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "big-board",
    "palette": {
      "background": "#fcefc2",
      "backgroundDeep": "#e5e691",
      "primary": "#8f7625",
      "secondary": "#53b879",
      "accent": "#76f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "sway",
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
