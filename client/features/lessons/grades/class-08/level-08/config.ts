import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l08",
  "grade": 8,
  "level": 8,
  "gradeLabel": "Class 8",
  "title": "Argument with Reasons",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Argument with Reasons — a distinct music meadow adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about argument with reasons."
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
    "themeId": "class-08-08-argument-with-reasons",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "big-board",
    "palette": {
      "background": "#eec2fc",
      "backgroundDeep": "#e491e6",
      "primary": "#74258f",
      "secondary": "#b87853",
      "accent": "#f5367a",
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
