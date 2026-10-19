import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l03",
  "grade": 8,
  "level": 3,
  "gradeLabel": "Class 8",
  "title": "Explaining Ideas",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Explaining Ideas — a distinct coral lagoon adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about explaining ideas."
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
    "themeId": "class-08-03-explaining-ideas",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "big-board",
    "palette": {
      "background": "#dec2fc",
      "backgroundDeep": "#cd91e6",
      "primary": "#57258f",
      "secondary": "#b85c53",
      "accent": "#f536ae",
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
