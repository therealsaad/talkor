import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l06",
  "grade": 9,
  "level": 6,
  "gradeLabel": "Class 9",
  "title": "Formal and Informal Speech",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Formal and Informal Speech — a distinct rainbow valley adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about formal and informal speech."
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
    "themeId": "class-09-06-formal-and-informal-speech",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fcc2f2",
      "backgroundDeep": "#e691c2",
      "primary": "#8f257c",
      "secondary": "#b8a453",
      "accent": "#f54536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "rainbow",
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
