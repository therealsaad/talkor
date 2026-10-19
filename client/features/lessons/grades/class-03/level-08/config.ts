import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l08",
  "grade": 3,
  "level": 8,
  "gradeLabel": "Class 3",
  "title": "Listening for Details",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Listening for Details — a distinct music meadow adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about listening for details."
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
    "themeId": "class-03-08-listening-for-details",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "big-board",
    "palette": {
      "background": "#c2fcc3",
      "backgroundDeep": "#91e6a7",
      "primary": "#258f27",
      "secondary": "#5377b8",
      "accent": "#36f5e5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
    "animationMood": "float",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
