import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l09",
  "grade": 2,
  "level": 9,
  "gradeLabel": "Class 2",
  "title": "Simple Conversations",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Simple Conversations — a distinct forest village adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to simple conversations."
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
    "themeId": "class-02-09-simple-conversations",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "big-board",
    "palette": {
      "background": "#defcc2",
      "backgroundDeep": "#a4e691",
      "primary": "#578f25",
      "secondary": "#53a9b8",
      "accent": "#36f587",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
