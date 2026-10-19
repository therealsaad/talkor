import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l07",
  "grade": 7,
  "level": 7,
  "gradeLabel": "Class 7",
  "title": "Persuasive Reasons",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Persuasive Reasons — a distinct little market adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about persuasive reasons."
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
    "themeId": "class-07-07-persuasive-reasons",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "explorer-trail",
    "palette": {
      "background": "#cbc2fc",
      "backgroundDeep": "#b191e6",
      "primary": "#34258f",
      "secondary": "#b8536a",
      "accent": "#f536ec",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
    "animationMood": "sway",
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
