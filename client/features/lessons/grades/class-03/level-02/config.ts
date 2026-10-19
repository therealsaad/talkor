import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l02",
  "grade": 3,
  "level": 2,
  "gradeLabel": "Class 3",
  "title": "My Daily Routine",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "My Daily Routine — a distinct treasure cove adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about my daily routine."
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
    "themeId": "class-03-02-my-daily-routine",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#d4fcc2",
      "backgroundDeep": "#96e691",
      "primary": "#468f25",
      "secondary": "#5398b8",
      "accent": "#36f5a7",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "bounce",
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
