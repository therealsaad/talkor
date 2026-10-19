import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l07",
  "grade": 9,
  "level": 7,
  "gradeLabel": "Class 9",
  "title": "Comprehension and Inference",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Comprehension and Inference — a distinct little market adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about comprehension and inference."
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
    "themeId": "class-09-07-comprehension-and-inference",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "big-board",
    "palette": {
      "background": "#fcc2ef",
      "backgroundDeep": "#e691bd",
      "primary": "#8f2576",
      "secondary": "#b8a953",
      "accent": "#f55036",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
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
