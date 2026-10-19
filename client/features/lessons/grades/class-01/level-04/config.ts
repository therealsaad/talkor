import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l04",
  "grade": 1,
  "level": 4,
  "gradeLabel": "Class 1",
  "title": "Colours and Counting",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Colours and Counting — a distinct star observatory adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to colours and counting."
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
    "themeId": "class-01-04-colours-and-counting",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcecc2",
      "backgroundDeep": "#e6e191",
      "primary": "#8f7025",
      "secondary": "#53b874",
      "accent": "#80f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "float",
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
