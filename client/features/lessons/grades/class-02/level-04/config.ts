import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l04",
  "grade": 2,
  "level": 4,
  "gradeLabel": "Class 2",
  "title": "Describing People",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Describing People — a distinct star observatory adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to describing people."
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
    "themeId": "class-02-04-describing-people",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "big-board",
    "palette": {
      "background": "#eefcc2",
      "backgroundDeep": "#bce691",
      "primary": "#748f25",
      "secondary": "#53b8ab",
      "accent": "#36f553",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "glow",
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
