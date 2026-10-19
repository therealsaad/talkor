import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l10",
  "grade": 5,
  "level": 10,
  "gradeLabel": "Class 5",
  "title": "Personal Presentation",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Personal Presentation — a distinct festival square adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about personal presentation."
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
    "themeId": "class-05-10-personal-presentation",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c2f0fc",
      "backgroundDeep": "#91bfe6",
      "primary": "#25788f",
      "secondary": "#a753b8",
      "accent": "#4c36f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "glow",
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
