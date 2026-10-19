import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l07",
  "grade": 6,
  "level": 7,
  "gradeLabel": "Class 6",
  "title": "Making Requests",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Making Requests — a distinct little market adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about making requests."
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
    "themeId": "class-06-07-making-requests",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2dafc",
      "backgroundDeep": "#919ee6",
      "primary": "#254f8f",
      "secondary": "#b853a1",
      "accent": "#9536f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
    "animationMood": "glow",
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
