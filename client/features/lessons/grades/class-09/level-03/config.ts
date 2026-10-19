import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l03",
  "grade": 9,
  "level": 3,
  "gradeLabel": "Class 9",
  "title": "Comparing Arguments",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Comparing Arguments — a distinct coral lagoon adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about comparing arguments."
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
    "themeId": "class-09-03-comparing-arguments",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "split-story",
    "palette": {
      "background": "#fcc2fb",
      "backgroundDeep": "#e691d0",
      "primary": "#8f258d",
      "secondary": "#b89353",
      "accent": "#f53645",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "glow",
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
