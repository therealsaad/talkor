import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g08-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g08-l07",
  "grade": 8,
  "level": 7,
  "gradeLabel": "Class 8",
  "title": "Group Discussion",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Group Discussion — a distinct little market adventure for Class 8 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about group discussion."
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
    "themeId": "class-08-07-group-discussion",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#ebc2fc",
      "backgroundDeep": "#e091e6",
      "primary": "#6e258f",
      "secondary": "#b87253",
      "accent": "#f53684",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
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
