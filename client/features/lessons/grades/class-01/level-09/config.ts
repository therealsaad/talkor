import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l09",
  "grade": 1,
  "level": 9,
  "gradeLabel": "Class 1",
  "title": "My Day",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "My Day — a distinct forest village adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to my day."
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
    "themeId": "class-01-09-my-day",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcfbc2",
      "backgroundDeep": "#d3e691",
      "primary": "#8f8d25",
      "secondary": "#53b88f",
      "accent": "#4cf536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
    "animationMood": "float",
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
