import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l09",
  "grade": 6,
  "level": 9,
  "gradeLabel": "Class 6",
  "title": "Short Debates",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Short Debates — a distinct forest village adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about short debates."
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
    "themeId": "class-06-09-short-debates",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c2d3fc",
      "backgroundDeep": "#9195e6",
      "primary": "#25448f",
      "secondary": "#b85396",
      "accent": "#aa36f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
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
