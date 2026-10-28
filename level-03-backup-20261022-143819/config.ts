import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l03",
  "grade": 0,
  "level": 3,
  "gradeLabel": "Kindergarten",
  "title": "My Body and Actions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "My Body and Actions — a distinct coral lagoon adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to my body and actions."
    ],
    "skills": [
      "listening",
      "speaking",
      "picture-recognition"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-03-my-body-and-actions",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcc9c2",
      "backgroundDeep": "#e6ae91",
      "primary": "#8f3125",
      "secondary": "#6eb853",
      "accent": "#f3f536",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
