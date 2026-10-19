import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l02",
  "grade": 0,
  "level": 2,
  "gradeLabel": "Kindergarten",
  "title": "Colours and Shapes",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Colours and Shapes — a distinct treasure cove adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to colours and shapes."
    ],
    "skills": [
      "listening",
      "speaking",
      "picture-recognition"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-02-colours-and-shapes",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "split-story",
    "palette": {
      "background": "#fcc6c2",
      "backgroundDeep": "#e6aa91",
      "primary": "#8f2b25",
      "secondary": "#73b853",
      "accent": "#f5ec36",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
