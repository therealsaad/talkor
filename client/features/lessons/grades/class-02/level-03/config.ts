import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l03",
  "grade": 2,
  "level": 3,
  "gradeLabel": "Class 2",
  "title": "Places Around Me",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Places Around Me — a distinct coral lagoon adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to places around me."
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
    "themeId": "class-02-03-places-around-me",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#f1fcc2",
      "backgroundDeep": "#c0e691",
      "primary": "#7a8f25",
      "secondary": "#53b8a5",
      "accent": "#36f549",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "orbit",
    "musicMood": "ambient-bells",
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
