import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l04",
  "grade": 6,
  "level": 4,
  "gradeLabel": "Class 6",
  "title": "Descriptive Speech",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Descriptive Speech — a distinct star observatory adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about descriptive speech."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-06-04-descriptive-speech",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c2e3fc",
      "backgroundDeep": "#91ace6",
      "primary": "#25618f",
      "secondary": "#b853b2",
      "accent": "#7636f5",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
