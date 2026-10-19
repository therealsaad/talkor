import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l06",
  "grade": 7,
  "level": 6,
  "gradeLabel": "Class 7",
  "title": "Role-play Dialogues",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Role-play Dialogues — a distinct rainbow valley adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about role-play dialogues."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading",
      "writing",
      "critical-thinking"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-07-06-role-play-dialogues",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "card-carousel",
    "palette": {
      "background": "#c8c2fc",
      "backgroundDeep": "#ad91e6",
      "primary": "#2f258f",
      "secondary": "#b85370",
      "accent": "#f336f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "rainbow",
    "animationMood": "float",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
