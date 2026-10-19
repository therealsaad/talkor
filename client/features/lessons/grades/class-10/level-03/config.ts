import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l03",
  "grade": 10,
  "level": 3,
  "gradeLabel": "Class 10",
  "title": "Explaining Evidence",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Explaining Evidence — a distinct coral lagoon adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about explaining evidence."
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
    "themeId": "class-10-03-explaining-evidence",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcc2dc",
      "backgroundDeep": "#e691a1",
      "primary": "#8f2553",
      "secondary": "#a5b853",
      "accent": "#f58e36",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
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
