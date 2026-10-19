import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l06",
  "grade": 4,
  "level": 6,
  "gradeLabel": "Class 4",
  "title": "Describing Experiences",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Describing Experiences — a distinct rainbow valley adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about describing experiences."
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
    "themeId": "class-04-06-describing-experiences",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c2fcdd",
      "backgroundDeep": "#91e6cc",
      "primary": "#258f55",
      "secondary": "#5a53b8",
      "accent": "#36b1f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "rainbow",
    "animationMood": "sway",
    "musicMood": "gentle-marimba",
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
