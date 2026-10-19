import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l10",
  "grade": 6,
  "level": 10,
  "gradeLabel": "Class 6",
  "title": "Confident Presentation",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Confident Presentation — a distinct festival square adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about confident presentation."
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
    "themeId": "class-06-10-confident-presentation",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "big-board",
    "palette": {
      "background": "#c2d0fc",
      "backgroundDeep": "#9191e6",
      "primary": "#253e8f",
      "secondary": "#b85391",
      "accent": "#b536f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "sway",
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
