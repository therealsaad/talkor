import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l02",
  "grade": 6,
  "level": 2,
  "gradeLabel": "Class 6",
  "title": "Explain a Process",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Explain a Process — a distinct treasure cove adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about explain a process."
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
    "themeId": "class-06-02-explain-a-process",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2e9fc",
      "backgroundDeep": "#91b5e6",
      "primary": "#256c8f",
      "secondary": "#b253b8",
      "accent": "#6136f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "glow",
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
