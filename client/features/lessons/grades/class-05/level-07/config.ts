import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l07",
  "grade": 5,
  "level": 7,
  "gradeLabel": "Class 5",
  "title": "Role-play",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Role-play — a distinct little market adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about role-play."
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
    "themeId": "class-05-07-role-play",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "split-story",
    "palette": {
      "background": "#c2f9fc",
      "backgroundDeep": "#91cce6",
      "primary": "#25898f",
      "secondary": "#9753b8",
      "accent": "#363ff5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
    "animationMood": "float",
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
