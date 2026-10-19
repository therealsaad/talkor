import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l02",
  "grade": 10,
  "level": 2,
  "gradeLabel": "Class 10",
  "title": "Expressing an Opinion",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Expressing an Opinion — a distinct treasure cove adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about expressing an opinion."
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
    "themeId": "class-10-02-expressing-an-opinion",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "split-story",
    "palette": {
      "background": "#fcc2df",
      "backgroundDeep": "#e691a6",
      "primary": "#8f2559",
      "secondary": "#abb853",
      "accent": "#f58436",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "float",
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
