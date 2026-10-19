import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l09",
  "grade": 8,
  "level": 9,
  "gradeLabel": "Class 8",
  "title": "Informal Presentation",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Informal Presentation — a distinct forest village adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about informal presentation."
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
    "themeId": "class-08-09-informal-presentation",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "split-story",
    "palette": {
      "background": "#f1c2fc",
      "backgroundDeep": "#e691e2",
      "primary": "#7a258f",
      "secondary": "#b87d53",
      "accent": "#f5366f",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
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
