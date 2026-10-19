import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l01",
  "grade": 6,
  "level": 1,
  "gradeLabel": "Class 6",
  "title": "Express Opinions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Express Opinions — a distinct petal garden adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about express opinions."
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
    "themeId": "class-06-01-express-opinions",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "split-story",
    "palette": {
      "background": "#c2edfc",
      "backgroundDeep": "#91bae6",
      "primary": "#25728f",
      "secondary": "#ad53b8",
      "accent": "#5736f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "orbit",
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
