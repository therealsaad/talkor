import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l07",
  "grade": 2,
  "level": 7,
  "gradeLabel": "Class 2",
  "title": "Present Tense",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Present Tense — a distinct little market adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to present tense."
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
    "themeId": "class-02-07-present-tense",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "explorer-trail",
    "palette": {
      "background": "#e4fcc2",
      "backgroundDeep": "#aee691",
      "primary": "#638f25",
      "secondary": "#53b4b8",
      "accent": "#36f573",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
    "animationMood": "sway",
    "musicMood": "soft-piano",
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
