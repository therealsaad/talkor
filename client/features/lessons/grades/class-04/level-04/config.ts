import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l04",
  "grade": 4,
  "level": 4,
  "gradeLabel": "Class 4",
  "title": "Daily Conversations",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Daily Conversations — a distinct star observatory adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about daily conversations."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-04-04-daily-conversations",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2fcd6",
      "backgroundDeep": "#91e6c2",
      "primary": "#258f4a",
      "secondary": "#5356b8",
      "accent": "#36c6f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "bounce",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
