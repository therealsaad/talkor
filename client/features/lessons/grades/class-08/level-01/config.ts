import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l01",
  "grade": 8,
  "level": 1,
  "gradeLabel": "Class 8",
  "title": "Polite Real-Life Conversations",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Polite Real-Life Conversations — a distinct petal garden adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about polite real-life conversations."
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
    "themeId": "class-08-01-polite-real-life-conversations",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "explorer-trail",
    "palette": {
      "background": "#d8c2fc",
      "backgroundDeep": "#c491e6",
      "primary": "#4c258f",
      "secondary": "#b85354",
      "accent": "#f536c2",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "glow",
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
