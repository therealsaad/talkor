import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l01",
  "grade": 4,
  "level": 1,
  "gradeLabel": "Class 4",
  "title": "Favourite Things",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Favourite Things — a distinct petal garden adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about favourite things."
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
    "themeId": "class-04-01-favourite-things",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c2fccd",
      "backgroundDeep": "#91e6b4",
      "primary": "#258f38",
      "secondary": "#5367b8",
      "accent": "#36e5f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
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
