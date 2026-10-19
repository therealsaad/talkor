import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l08",
  "grade": 2,
  "level": 8,
  "gradeLabel": "Class 2",
  "title": "Sentence Building",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Sentence Building — a distinct music meadow adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to sentence building."
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
    "themeId": "class-02-08-sentence-building",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#e1fcc2",
      "backgroundDeep": "#a9e691",
      "primary": "#5d8f25",
      "secondary": "#53aeb8",
      "accent": "#36f57d",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
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
