import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l02",
  "grade": 7,
  "level": 2,
  "gradeLabel": "Class 7",
  "title": "Sequence and Time",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Sequence and Time — a distinct treasure cove adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about sequence and time."
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
    "themeId": "class-07-02-sequence-and-time",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c2cafc",
      "backgroundDeep": "#9a91e6",
      "primary": "#25338f",
      "secondary": "#b85386",
      "accent": "#c936f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "sway",
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
