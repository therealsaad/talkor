import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l07",
  "grade": 4,
  "level": 7,
  "gradeLabel": "Class 4",
  "title": "Past and Present",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Past and Present — a distinct little market adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about past and present."
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
    "themeId": "class-04-07-past-and-present",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "big-board",
    "palette": {
      "background": "#c2fce0",
      "backgroundDeep": "#91e6d0",
      "primary": "#258f5b",
      "secondary": "#6053b8",
      "accent": "#36a7f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
    "animationMood": "orbit",
    "musicMood": "soft-piano",
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
