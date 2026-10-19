import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l09",
  "grade": 7,
  "level": 9,
  "gradeLabel": "Class 7",
  "title": "Collaborative Discussion",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Collaborative Discussion — a distinct forest village adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about collaborative discussion."
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
    "themeId": "class-07-09-collaborative-discussion",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "big-board",
    "palette": {
      "background": "#d1c2fc",
      "backgroundDeep": "#bb91e6",
      "primary": "#40258f",
      "secondary": "#b8535f",
      "accent": "#f536d7",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
    "animationMood": "glow",
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
