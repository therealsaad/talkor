import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l01",
  "grade": 1,
  "level": 1,
  "gradeLabel": "Class 1",
  "title": "My First Day — School Adventure",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Watch the reviewed First Day introduction, then practise ten original school-action conversations with Miss Julie: school, skip, run, walk, grin, bell, jump, play, entering class and Grade One. Historic two-letter-word work stays preserved in student history.",
  "syllabus": {
    "objectives": [
      "Hear and use the school and action words in an original companion to Balbharati 1.1 My First Day.",
      "Practice school, skip, run, walk, smile/grin, bell, jump, play, and entering Grade One using ten short speaking turns.",
      "Ask and answer one short school question with gentle Hindi/Marathi support; an English attempt is required for mastery.",
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
    "sceneDescription": "a sunny, calm first-day school adventure with original illustrations, action words and Miss Julie responding to the learner",
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
