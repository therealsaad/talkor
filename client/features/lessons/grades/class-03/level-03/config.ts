import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l03",
  "grade": 3,
  "level": 3,
  "gradeLabel": "Class 3",
  "title": "People and Places",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "People and Places — a distinct coral lagoon adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about people and places."
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
    "themeId": "class-03-03-people-and-places",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "big-board",
    "palette": {
      "background": "#d1fcc2",
      "backgroundDeep": "#92e691",
      "primary": "#408f25",
      "secondary": "#5393b8",
      "accent": "#36f5b1",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "float",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
