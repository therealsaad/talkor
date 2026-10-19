import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g07-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g07-l10",
  "grade": 7,
  "level": 10,
  "gradeLabel": "Class 7",
  "title": "Story Reflection",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Story Reflection — a distinct festival square adventure for Class 7 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about story reflection."
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
    "themeId": "class-07-10-story-reflection",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "split-story",
    "palette": {
      "background": "#d4c2fc",
      "backgroundDeep": "#bf91e6",
      "primary": "#46258f",
      "secondary": "#b8535a",
      "accent": "#f536cd",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "bounce",
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
