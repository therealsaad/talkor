import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l06",
  "grade": 10,
  "level": 6,
  "gradeLabel": "Class 10",
  "title": "Persuasive Speaking",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Persuasive Speaking — a distinct rainbow valley adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about persuasive speaking."
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
    "themeId": "class-10-06-persuasive-speaking",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "big-board",
    "palette": {
      "background": "#fcc2d2",
      "backgroundDeep": "#e69193",
      "primary": "#8f2542",
      "secondary": "#95b853",
      "accent": "#f5ae36",
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
