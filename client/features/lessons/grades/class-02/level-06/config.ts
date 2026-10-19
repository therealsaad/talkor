import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l06",
  "grade": 2,
  "level": 6,
  "gradeLabel": "Class 2",
  "title": "Asking for Help",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Asking for Help — a distinct rainbow valley adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to asking for help."
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
    "themeId": "class-02-06-asking-for-help",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "card-carousel",
    "palette": {
      "background": "#e7fcc2",
      "backgroundDeep": "#b2e691",
      "primary": "#688f25",
      "secondary": "#53b8b6",
      "accent": "#36f568",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "rainbow",
    "animationMood": "float",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
