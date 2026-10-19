import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l08",
  "grade": 1,
  "level": 8,
  "gradeLabel": "Class 1",
  "title": "Simple Questions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Simple Questions — a distinct music meadow adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to simple questions."
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
    "themeId": "class-01-08-simple-questions",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcf8c2",
      "backgroundDeep": "#d7e691",
      "primary": "#8f8725",
      "secondary": "#53b88a",
      "accent": "#57f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
    "animationMood": "bounce",
    "musicMood": "ambient-bells",
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
