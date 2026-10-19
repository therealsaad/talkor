import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l10",
  "grade": 0,
  "level": 10,
  "gradeLabel": "Kindergarten",
  "title": "Mini Story and Revision",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Mini Story and Revision — a distinct festival square adventure for KG learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to mini story and revision."
    ],
    "skills": [
      "listening",
      "speaking",
      "picture-recognition"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-10-mini-story-and-revision",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcdfc2",
      "backgroundDeep": "#e6cf91",
      "primary": "#8f5925",
      "secondary": "#53b85e",
      "accent": "#aaf536",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
