import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l08",
  "grade": 10,
  "level": 8,
  "gradeLabel": "Class 10",
  "title": "Debate and Rebuttal",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Debate and Rebuttal — a distinct music meadow adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about debate and rebuttal."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing",
      "critical-thinking"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-10-08-debate-and-rebuttal",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcc2cc",
      "backgroundDeep": "#e69791",
      "primary": "#8f2536",
      "secondary": "#8ab853",
      "accent": "#f5c236",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
    "animationMood": "sway",
    "musicMood": "ambient-bells",
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
