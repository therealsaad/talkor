import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l07",
  "grade": 1,
  "level": 7,
  "gradeLabel": "Class 1",
  "title": "Action Words",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Action Words — a distinct little market adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to action words."
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
    "themeId": "class-01-07-action-words",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcf5c2",
      "backgroundDeep": "#dce691",
      "primary": "#8f8125",
      "secondary": "#53b884",
      "accent": "#61f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
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
