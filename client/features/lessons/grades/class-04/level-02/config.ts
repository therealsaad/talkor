import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l02",
  "grade": 4,
  "level": 2,
  "gradeLabel": "Class 4",
  "title": "Listening and Speaking",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Listening and Speaking — a distinct treasure cove adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about listening and speaking."
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
    "themeId": "class-04-02-listening-and-speaking",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "big-board",
    "palette": {
      "background": "#c2fcd0",
      "backgroundDeep": "#91e6b9",
      "primary": "#258f3e",
      "secondary": "#5361b8",
      "accent": "#36dbf5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "orbit",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
