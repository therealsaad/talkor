import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l08",
  "grade": 7,
  "level": 8,
  "gradeLabel": "Class 7",
  "title": "Question Handling",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Question Handling — a distinct music meadow adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about question handling."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing",
      "critical-thinking"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-07-08-question-handling",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#cec2fc",
      "backgroundDeep": "#b691e6",
      "primary": "#3a258f",
      "secondary": "#b85365",
      "accent": "#f536e2",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
    "animationMood": "orbit",
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
