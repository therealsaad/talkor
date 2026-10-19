import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l01. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l01",
  "grade": 3,
  "level": 1,
  "gradeLabel": "Class 3",
  "title": "Greetings with Details",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Greetings with Details — a distinct petal garden adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about greetings with details."
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
    "themeId": "class-03-01-greetings-with-details",
    "world": "Petal Garden",
    "sceneDescription": "flowers and gently floating butterflies",
    "layout": "explorer-trail",
    "palette": {
      "background": "#d8fcc2",
      "backgroundDeep": "#9be691",
      "primary": "#4c8f25",
      "secondary": "#539eb8",
      "accent": "#36f59c",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "flower",
    "animationMood": "glow",
    "musicMood": "gentle-marimba",
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
