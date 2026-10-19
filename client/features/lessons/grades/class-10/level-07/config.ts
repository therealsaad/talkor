import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g10-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g10-l07",
  "grade": 10,
  "level": 7,
  "gradeLabel": "Class 10",
  "title": "Collaborative Discussions",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Collaborative Discussions — a distinct little market adventure for Class 10 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about collaborative discussions."
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
    "themeId": "class-10-07-collaborative-discussions",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "split-story",
    "palette": {
      "background": "#fcc2cf",
      "backgroundDeep": "#e69291",
      "primary": "#8f253c",
      "secondary": "#8fb853",
      "accent": "#f5b836",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "shop",
    "animationMood": "float",
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
