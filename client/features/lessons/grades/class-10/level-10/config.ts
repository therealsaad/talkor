import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l10",
  "grade": 10,
  "level": 10,
  "gradeLabel": "Class 10",
  "title": "Final Speaking Portfolio",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Final Speaking Portfolio — a distinct festival square adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about final speaking portfolio."
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
    "themeId": "class-10-10-final-speaking-portfolio",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcc2c6",
      "backgroundDeep": "#e6a091",
      "primary": "#8f252b",
      "secondary": "#7fb853",
      "accent": "#f5d736",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "glow",
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
