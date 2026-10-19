import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g09-l04. Authoring is NOT publishing. */
export const config = {
  "id": "g09-l04",
  "grade": 9,
  "level": 4,
  "gradeLabel": "Class 9",
  "title": "Presentation Planning",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Presentation Planning — a distinct star observatory adventure for Class 9 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about presentation planning."
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
    "themeId": "class-09-04-presentation-planning",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "card-carousel",
    "palette": {
      "background": "#fcc2f8",
      "backgroundDeep": "#e691cb",
      "primary": "#8f2587",
      "secondary": "#b89953",
      "accent": "#f5363b",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "bounce",
    "musicMood": "quiet-acoustic",
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
