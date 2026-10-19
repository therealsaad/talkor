import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l09",
  "grade": 9,
  "level": 9,
  "gradeLabel": "Class 9",
  "title": "Structured Speaking",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Structured Speaking — a distinct forest village adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about structured speaking."
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
    "themeId": "class-09-09-structured-speaking",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcc2e8",
      "backgroundDeep": "#e691b4",
      "primary": "#8f256a",
      "secondary": "#b8b453",
      "accent": "#f56536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
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
