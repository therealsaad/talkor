import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l05",
  "grade": 10,
  "level": 5,
  "gradeLabel": "Class 10",
  "title": "Comprehension and Summary",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Comprehension and Summary — a distinct storybook castle adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about comprehension and summary."
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
    "themeId": "class-10-05-comprehension-and-summary",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcc2d5",
      "backgroundDeep": "#e69198",
      "primary": "#8f2548",
      "secondary": "#9ab853",
      "accent": "#f5a336",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "glow",
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
