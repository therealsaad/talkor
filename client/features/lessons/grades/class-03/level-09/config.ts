import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l09",
  "grade": 3,
  "level": 9,
  "gradeLabel": "Class 3",
  "title": "Retell a Story",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Retell a Story — a distinct forest village adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about retell a story."
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
    "themeId": "class-03-09-retell-a-story",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "split-story",
    "palette": {
      "background": "#c2fcc7",
      "backgroundDeep": "#91e6ab",
      "primary": "#258f2d",
      "secondary": "#5372b8",
      "accent": "#36f5f0",
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
