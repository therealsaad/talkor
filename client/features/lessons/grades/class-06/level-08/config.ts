import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l08",
  "grade": 6,
  "level": 8,
  "gradeLabel": "Class 6",
  "title": "Comparing Choices",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Comparing Choices — a distinct music meadow adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about comparing choices."
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
    "themeId": "class-06-08-comparing-choices",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c2d6fc",
      "backgroundDeep": "#919ae6",
      "primary": "#254a8f",
      "secondary": "#b8539c",
      "accent": "#a036f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
    "animationMood": "bounce",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
