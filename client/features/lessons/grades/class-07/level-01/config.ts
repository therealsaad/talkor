import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l01",
  "grade": 7,
  "level": 1,
  "gradeLabel": "Class 7",
  "title": "Narrative Storytelling",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Narrative Storytelling — a distinct petal garden adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about narrative storytelling."
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
    "themeId": "class-07-01-narrative-storytelling",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2cdfc",
      "backgroundDeep": "#9691e6",
      "primary": "#25388f",
      "secondary": "#b8538b",
      "accent": "#bf36f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
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
