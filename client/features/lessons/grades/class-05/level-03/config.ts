import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l03",
  "grade": 5,
  "level": 3,
  "gradeLabel": "Class 5",
  "title": "Past Experiences",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Past Experiences — a distinct coral lagoon adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about past experiences."
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
    "themeId": "class-05-03-past-experiences",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2fcf3",
      "backgroundDeep": "#91dfe6",
      "primary": "#258f7e",
      "secondary": "#8153b8",
      "accent": "#3668f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "sway",
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
