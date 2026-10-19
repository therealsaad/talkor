import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l03",
  "grade": 7,
  "level": 3,
  "gradeLabel": "Class 7",
  "title": "Giving Clear Instructions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Giving Clear Instructions — a distinct coral lagoon adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about giving clear instructions."
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
    "themeId": "class-07-03-giving-clear-instructions",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c2c7fc",
      "backgroundDeep": "#9f91e6",
      "primary": "#252d8f",
      "secondary": "#b85380",
      "accent": "#d436f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "orbit",
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
