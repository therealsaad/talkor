import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l05",
  "grade": 4,
  "level": 5,
  "gradeLabel": "Class 4",
  "title": "Questions and Answers",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Questions and Answers — a distinct storybook castle adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about questions and answers."
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
    "themeId": "class-04-05-questions-and-answers",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c2fcda",
      "backgroundDeep": "#91e6c7",
      "primary": "#258f4f",
      "secondary": "#5553b8",
      "accent": "#36bcf5",
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
