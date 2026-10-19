import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l07. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l07",
  "grade": 3,
  "level": 7,
  "gradeLabel": "Class 3",
  "title": "Likes and Reasons",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Likes and Reasons — a distinct little market adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about likes and reasons."
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
    "themeId": "class-03-07-likes-and-reasons",
    "world": "Little Market",
    "sceneDescription": "market stalls and talking objects",
    "layout": "dialogue-stage",
    "palette": {
      "background": "#c4fcc2",
      "backgroundDeep": "#91e6a2",
      "primary": "#298f25",
      "secondary": "#537db8",
      "accent": "#36f5db",
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
