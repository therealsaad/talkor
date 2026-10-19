import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l04",
  "grade": 8,
  "level": 4,
  "gradeLabel": "Class 8",
  "title": "Reading Comprehension",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Reading Comprehension — a distinct star observatory adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about reading comprehension."
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
    "themeId": "class-08-04-reading-comprehension",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "split-story",
    "palette": {
      "background": "#e1c2fc",
      "backgroundDeep": "#d291e6",
      "primary": "#5d258f",
      "secondary": "#b86153",
      "accent": "#f536a3",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "sway",
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
