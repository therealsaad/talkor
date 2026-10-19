import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g03-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g03-l06",
  "grade": 3,
  "level": 6,
  "gradeLabel": "Class 3",
  "title": "Short Narratives",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Short Narratives — a distinct rainbow valley adventure for Class 3 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about short narratives."
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
    "themeId": "class-03-06-short-narratives",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "explorer-trail",
    "palette": {
      "background": "#c8fcc2",
      "backgroundDeep": "#91e69d",
      "primary": "#2f8f25",
      "secondary": "#5382b8",
      "accent": "#36f5d0",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "rainbow",
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
