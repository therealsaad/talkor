import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l06",
  "grade": 5,
  "level": 6,
  "gradeLabel": "Class 5",
  "title": "Asking Follow-up Questions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Asking Follow-up Questions — a distinct rainbow valley adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about asking follow-up questions."
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
    "themeId": "class-05-06-asking-follow-up-questions",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "big-board",
    "palette": {
      "background": "#c2fcfc",
      "backgroundDeep": "#91d1e6",
      "primary": "#258f8f",
      "secondary": "#9153b8",
      "accent": "#3649f5",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
