import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l04",
  "grade": 10,
  "level": 4,
  "gradeLabel": "Class 10",
  "title": "Formal Presentations",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Formal Presentations — a distinct star observatory adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about formal presentations."
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
    "themeId": "class-10-04-formal-presentations",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcc2d9",
      "backgroundDeep": "#e6919d",
      "primary": "#8f254d",
      "secondary": "#a0b853",
      "accent": "#f59936",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
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
