import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l07",
  "grade": 0,
  "level": 7,
  "gradeLabel": "Kindergarten",
  "title": "My Classroom",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "My Classroom — a distinct little market adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to my classroom."
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
    "themeId": "kg-07-my-classroom",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "split-story",
    "palette": {
      "background": "#fcd5c2",
      "backgroundDeep": "#e6c191",
      "primary": "#8f4825",
      "secondary": "#58b853",
      "accent": "#c9f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
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
