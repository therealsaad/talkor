import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l04",
  "grade": 5,
  "level": 4,
  "gradeLabel": "Class 5",
  "title": "Giving Directions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Giving Directions — a distinct star observatory adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about giving directions."
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
    "themeId": "class-05-04-giving-directions",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c2fcf6",
      "backgroundDeep": "#91dae6",
      "primary": "#258f83",
      "secondary": "#8653b8",
      "accent": "#365ef5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
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
