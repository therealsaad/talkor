import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l03",
  "grade": 1,
  "level": 3,
  "gradeLabel": "Class 1",
  "title": "People and Family",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "People and Family — a distinct coral lagoon adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to people and family."
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
    "themeId": "class-01-03-people-and-family",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fce8c2",
      "backgroundDeep": "#e6dd91",
      "primary": "#8f6a25",
      "secondary": "#53b86e",
      "accent": "#8bf536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
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
