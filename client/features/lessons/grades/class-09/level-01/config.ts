import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l01",
  "grade": 9,
  "level": 1,
  "gradeLabel": "Class 9",
  "title": "Discussion and Evidence",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Discussion and Evidence — a distinct petal garden adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about discussion and evidence."
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
    "themeId": "class-09-01-discussion-and-evidence",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#f7c2fc",
      "backgroundDeep": "#e691d9",
      "primary": "#85258f",
      "secondary": "#b88853",
      "accent": "#f5365a",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "sway",
    "musicMood": "gentle-marimba",
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
