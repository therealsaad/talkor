import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l02",
  "grade": 5,
  "level": 2,
  "gradeLabel": "Class 5",
  "title": "Descriptive Vocabulary",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Descriptive Vocabulary — a distinct treasure cove adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about descriptive vocabulary."
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
    "themeId": "class-05-02-descriptive-vocabulary",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "split-story",
    "palette": {
      "background": "#c2fcf0",
      "backgroundDeep": "#91e4e6",
      "primary": "#258f78",
      "secondary": "#7b53b8",
      "accent": "#3673f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "float",
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
