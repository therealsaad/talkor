import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l04",
  "grade": 3,
  "level": 4,
  "gradeLabel": "Class 3",
  "title": "Questions and Answers",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Questions and Answers — a distinct star observatory adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about questions and answers."
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
    "themeId": "class-03-04-questions-and-answers",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "split-story",
    "palette": {
      "background": "#cefcc2",
      "backgroundDeep": "#91e694",
      "primary": "#3a8f25",
      "secondary": "#538db8",
      "accent": "#36f5bc",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "sway",
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
