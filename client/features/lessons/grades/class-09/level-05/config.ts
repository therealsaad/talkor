import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l05",
  "grade": 9,
  "level": 5,
  "gradeLabel": "Class 9",
  "title": "Grammar in Context",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Grammar in Context — a distinct storybook castle adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about grammar in context."
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
    "themeId": "class-09-05-grammar-in-context",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcc2f5",
      "backgroundDeep": "#e691c6",
      "primary": "#8f2581",
      "secondary": "#b89e53",
      "accent": "#f53b36",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "float",
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
