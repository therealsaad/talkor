import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l05",
  "grade": 3,
  "level": 5,
  "gradeLabel": "Class 3",
  "title": "Descriptions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Descriptions — a distinct storybook castle adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about descriptions."
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
    "themeId": "class-03-05-descriptions",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "card-carousel",
    "palette": {
      "background": "#cbfcc2",
      "backgroundDeep": "#91e699",
      "primary": "#348f25",
      "secondary": "#5388b8",
      "accent": "#36f5c6",
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
