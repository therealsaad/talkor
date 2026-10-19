import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l08",
  "grade": 9,
  "level": 8,
  "gradeLabel": "Class 9",
  "title": "Interview Practice",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Interview Practice — a distinct music meadow adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about interview practice."
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
    "themeId": "class-09-08-interview-practice",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "split-story",
    "palette": {
      "background": "#fcc2ec",
      "backgroundDeep": "#e691b8",
      "primary": "#8f2570",
      "secondary": "#b8af53",
      "accent": "#f55a36",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
    "animationMood": "glow",
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
