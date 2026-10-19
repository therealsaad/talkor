import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l10",
  "grade": 9,
  "level": 10,
  "gradeLabel": "Class 9",
  "title": "Reflective Conversation",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Reflective Conversation — a distinct festival square adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about reflective conversation."
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
    "themeId": "class-09-10-reflective-conversation",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcc2e5",
      "backgroundDeep": "#e691af",
      "primary": "#8f2565",
      "secondary": "#b6b853",
      "accent": "#f56f36",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "float",
    "musicMood": "light-chimes",
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
