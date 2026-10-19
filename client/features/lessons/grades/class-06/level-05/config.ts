import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l05",
  "grade": 6,
  "level": 5,
  "gradeLabel": "Class 6",
  "title": "Grammar in Conversation",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Grammar in Conversation — a distinct storybook castle adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about grammar in conversation."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-06-05-grammar-in-conversation",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "big-board",
    "palette": {
      "background": "#c2e0fc",
      "backgroundDeep": "#91a7e6",
      "primary": "#255b8f",
      "secondary": "#b853ac",
      "accent": "#8036f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "sway",
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
