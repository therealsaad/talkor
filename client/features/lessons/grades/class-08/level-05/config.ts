import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l05",
  "grade": 8,
  "level": 5,
  "gradeLabel": "Class 8",
  "title": "Listening and Inference",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Listening and Inference — a distinct storybook castle adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about listening and inference."
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
    "themeId": "class-08-05-listening-and-inference",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "card-carousel",
    "palette": {
      "background": "#e4c2fc",
      "backgroundDeep": "#d691e6",
      "primary": "#63258f",
      "secondary": "#b86753",
      "accent": "#f53699",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "orbit",
    "musicMood": "light-chimes",
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
