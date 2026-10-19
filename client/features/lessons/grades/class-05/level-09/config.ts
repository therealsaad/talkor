import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l09. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l09",
  "grade": 5,
  "level": 9,
  "gradeLabel": "Class 5",
  "title": "Listening for Meaning",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Listening for Meaning — a distinct forest village adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about listening for meaning."
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
    "themeId": "class-05-09-listening-for-meaning",
    "world": "Forest Village",
    "sceneDescription": "cottage paths and little signposts",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c2f3fc",
      "backgroundDeep": "#91c3e6",
      "primary": "#257e8f",
      "secondary": "#a253b8",
      "accent": "#4236f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "tree",
    "animationMood": "orbit",
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
