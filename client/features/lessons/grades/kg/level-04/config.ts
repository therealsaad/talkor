import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l04",
  "grade": 0,
  "level": 4,
  "gradeLabel": "Kindergarten",
  "title": "Animal Sounds",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Animal Sounds — a distinct star observatory adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to animal sounds."
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
    "themeId": "kg-04-animal-sounds",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcccc2",
      "backgroundDeep": "#e6b391",
      "primary": "#8f3625",
      "secondary": "#68b853",
      "accent": "#e9f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "orbit",
    "musicMood": "quiet-acoustic",
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
