import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l04",
  "grade": 7,
  "level": 4,
  "gradeLabel": "Class 7",
  "title": "Summarising Text",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Summarising Text — a distinct star observatory adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about summarising text."
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
    "themeId": "class-07-04-summarising-text",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "big-board",
    "palette": {
      "background": "#c2c3fc",
      "backgroundDeep": "#a391e6",
      "primary": "#25278f",
      "secondary": "#b8537b",
      "accent": "#de36f5",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
