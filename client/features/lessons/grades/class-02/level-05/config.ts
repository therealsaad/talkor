import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l05",
  "grade": 2,
  "level": 5,
  "gradeLabel": "Class 2",
  "title": "Days and Weather",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Days and Weather — a distinct storybook castle adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to days and weather."
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
    "themeId": "class-02-05-days-and-weather",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "split-story",
    "palette": {
      "background": "#ebfcc2",
      "backgroundDeep": "#b7e691",
      "primary": "#6e8f25",
      "secondary": "#53b8b0",
      "accent": "#36f55e",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
