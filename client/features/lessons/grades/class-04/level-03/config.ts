import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l03. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l03",
  "grade": 4,
  "level": 3,
  "gradeLabel": "Class 4",
  "title": "Family and Friends",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Family and Friends — a distinct coral lagoon adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about family and friends."
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
    "themeId": "class-04-03-family-and-friends",
    "world": "Coral Lagoon",
    "sceneDescription": "colorful coral, bubbles and friendly fish",
    "layout": "split-story",
    "palette": {
      "background": "#c2fcd3",
      "backgroundDeep": "#91e6be",
      "primary": "#258f44",
      "secondary": "#535cb8",
      "accent": "#36d0f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "wave",
    "animationMood": "glow",
    "musicMood": "ambient-bells",
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
