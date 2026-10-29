import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l01",
  "grade": 1,
  "level": 1,
  "gradeLabel": "Class 1",
  "title": "Little Words & My First Day",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Watch Miss Julie's 90-second welcome story, practise tiny English words, then begin Balbharati 1.1 My First Day.",
  "syllabus": {
    "objectives": [
      "Recognize and use the short words am, an, at, in, is, it, on, and up with generous visual support.",
      "Listen to and say simple school and movement words from the My First Day theme.",
      "Answer one very short question about going to school with positive Hindi or Marathi scaffolding."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading"
    ],
    "boardReviewRequired": true,
    "sourceBook": "English Balbharati Grade One, first edition 2025, reprint 2026, Unit One, 1.1 My First Day",
    "sourcePages": [1],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-01-letters-and-sounds",
    "world": "First Day Word Meadow",
    "sceneDescription": "a sunny, calm school-bound meadow; two-letter building blocks become a short path towards a cheerful school",
    "layout": "split-story",
    "palette": {
      "background": "#fce2c2",
      "backgroundDeep": "#e6d391",
      "primary": "#8f5f25",
      "secondary": "#53b863",
      "accent": "#a0f536",
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
    "introRequired": true,
    "introMustComplete": true,
    "speechLanguage": "en-IN",
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "ai4bharat-s3-reviewed-audio",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
