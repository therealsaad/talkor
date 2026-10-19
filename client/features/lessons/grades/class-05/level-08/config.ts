import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g05-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g05-l08",
  "grade": 5,
  "level": 8,
  "gradeLabel": "Class 5",
  "title": "Story Sequencing",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Story Sequencing — a distinct music meadow adventure for Class 5 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about story sequencing."
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
    "themeId": "class-05-08-story-sequencing",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "card-carousel",
    "palette": {
      "background": "#c2f6fc",
      "backgroundDeep": "#91c8e6",
      "primary": "#25838f",
      "secondary": "#9c53b8",
      "accent": "#3836f5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
    "animationMood": "sway",
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
