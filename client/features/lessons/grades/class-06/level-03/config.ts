import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l03",
  "grade": 6,
  "level": 3,
  "gradeLabel": "Class 6",
  "title": "Listening Comprehension",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Listening Comprehension — a distinct coral lagoon adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about listening comprehension."
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
    "themeId": "class-06-03-listening-comprehension",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c2e6fc",
      "backgroundDeep": "#91b1e6",
      "primary": "#25668f",
      "secondary": "#b853b7",
      "accent": "#6c36f5",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
