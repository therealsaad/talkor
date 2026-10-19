import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l10",
  "grade": 3,
  "level": 10,
  "gradeLabel": "Class 3",
  "title": "Mini Presentation",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Mini Presentation — a distinct festival square adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about mini presentation."
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
    "themeId": "class-03-10-mini-presentation",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2fcca",
      "backgroundDeep": "#91e6b0",
      "primary": "#258f33",
      "secondary": "#536cb8",
      "accent": "#36f0f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "orbit",
    "musicMood": "light-chimes",
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
