import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g04-l08. Authoring is NOT publishing. */
export const config = {
  "id": "g04-l08",
  "grade": 4,
  "level": 8,
  "gradeLabel": "Class 4",
  "title": "Story Conversation",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Story Conversation — a distinct music meadow adventure for Class 4 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about story conversation."
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
    "themeId": "class-04-08-story-conversation",
    "world": "Music Meadow",
    "sceneDescription": "xylophone flowers and musical notes",
    "layout": "split-story",
    "palette": {
      "background": "#c2fce3",
      "backgroundDeep": "#91e6d5",
      "primary": "#258f61",
      "secondary": "#6553b8",
      "accent": "#369cf5",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "note",
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
