import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l05",
  "grade": 7,
  "level": 5,
  "gradeLabel": "Class 7",
  "title": "People and Culture",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "People and Culture — a distinct storybook castle adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about people and culture."
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
    "themeId": "class-07-05-people-and-culture",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "split-story",
    "palette": {
      "background": "#c4c2fc",
      "backgroundDeep": "#a891e6",
      "primary": "#29258f",
      "secondary": "#b85375",
      "accent": "#e936f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "bounce",
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
