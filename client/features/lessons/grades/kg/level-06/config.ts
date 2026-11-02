import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g00-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g00-l06",
  "grade": 0,
  "level": 6,
  "gradeLabel": "Kindergarten",
  "title": "Vowel Sounds",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Learn what vowel sounds are, then listen to and practice A, E, I, O, and U.",
  "syllabus": {
    "objectives": [
      "Recognize the five vowel letters and practice their short sounds."
    ],
    "skills": [
      "listening",
      "speaking",
      "phonemic-awareness"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-06-vowel-sounds",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "big-board",
    "palette": {
      "background": "#fcd2c2",
      "backgroundDeep": "#e6bc91",
      "primary": "#8f4225",
      "secondary": "#5db853",
      "accent": "#d4f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "rainbow",
    "animationMood": "bounce",
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
