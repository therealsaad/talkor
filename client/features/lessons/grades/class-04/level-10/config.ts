import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l10",
  "grade": 4,
  "level": 10,
  "gradeLabel": "Class 4",
  "title": "End-of-Term Reflection",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "End-of-Term Reflection — a distinct festival square adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about end-of-term reflection."
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
    "themeId": "class-04-10-end-of-term-reflection",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c2fce9",
      "backgroundDeep": "#91e6de",
      "primary": "#258f6c",
      "secondary": "#7053b8",
      "accent": "#3687f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "float",
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
