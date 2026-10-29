import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l05",
  "grade": 0,
  "level": 5,
  "gradeLabel": "Kindergarten",
  "title": "Letters W to Z",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "A premium alphabet adventure for learning letters W, X, Y, and Z with pictures, video, and spoken practice.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak the letters W, X, Y, and Z and their picture words."
    ],
    "skills": [
      "listening",
      "speaking",
      "picture-recognition"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-05-food-and-fruits",
    "world": "Wonders in the Storybook Garden",
    "sceneDescription": "soft coastal shapes, storybook clouds and colourful learning tiles",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#fccfc2",
      "backgroundDeep": "#e6b791",
      "primary": "#8f3c25",
      "secondary": "#63b853",
      "accent": "#def536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "castle",
    "animationMood": "glow",
    "musicMood": "light-chimes",
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
