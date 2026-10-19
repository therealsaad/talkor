import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l05. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l05",
  "grade": 5,
  "level": 5,
  "gradeLabel": "Class 5",
  "title": "Opinions and Reasons",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Opinions and Reasons — a distinct storybook castle adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about opinions and reasons."
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
    "themeId": "class-05-05-opinions-and-reasons",
    "world": "Storybook Castle",
    "sceneDescription": "soft towers, story scrolls and flags",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c2fcf9",
      "backgroundDeep": "#91d6e6",
      "primary": "#258f89",
      "secondary": "#8c53b8",
      "accent": "#3653f5",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
