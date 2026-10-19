import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l09",
  "grade": 10,
  "level": 9,
  "gradeLabel": "Class 10",
  "title": "Communication for Careers",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Communication for Careers — a distinct forest village adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about communication for careers."
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
    "themeId": "class-10-09-communication-for-careers",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcc2c9",
      "backgroundDeep": "#e69c91",
      "primary": "#8f2531",
      "secondary": "#84b853",
      "accent": "#f5cd36",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
