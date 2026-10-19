import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l02",
  "grade": 9,
  "level": 2,
  "gradeLabel": "Class 9",
  "title": "Narrative Development",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Narrative Development — a distinct treasure cove adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about narrative development."
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
    "themeId": "class-09-02-narrative-development",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "big-board",
    "palette": {
      "background": "#fac2fc",
      "backgroundDeep": "#e691d4",
      "primary": "#8b258f",
      "secondary": "#b88e53",
      "accent": "#f53650",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "orbit",
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
