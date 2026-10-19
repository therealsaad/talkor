import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l10",
  "grade": 1,
  "level": 10,
  "gradeLabel": "Class 1",
  "title": "Story Time",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Story Time — a distinct festival square adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to story time."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading"
    ],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-10-story-time",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "big-board",
    "palette": {
      "background": "#fafcc2",
      "backgroundDeep": "#cee691",
      "primary": "#8b8f25",
      "secondary": "#53b895",
      "accent": "#42f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "sway",
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
