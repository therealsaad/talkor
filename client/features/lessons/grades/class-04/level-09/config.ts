import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l09",
  "grade": 4,
  "level": 9,
  "gradeLabel": "Class 4",
  "title": "Speaking with Confidence",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Speaking with Confidence — a distinct forest village adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about speaking with confidence."
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
    "themeId": "class-04-09-speaking-with-confidence",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2fce6",
      "backgroundDeep": "#91e6d9",
      "primary": "#258f66",
      "secondary": "#6b53b8",
      "accent": "#3692f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
    "animationMood": "bounce",
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
