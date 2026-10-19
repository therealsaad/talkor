import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g01-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l06",
  "grade": 1,
  "level": 6,
  "gradeLabel": "Class 1",
  "title": "Animals Around Us",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Animals Around Us — a distinct rainbow valley adventure for Class 1 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to animals around us."
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
    "themeId": "class-01-06-animals-around-us",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "split-story",
    "palette": {
      "background": "#fcf2c2",
      "backgroundDeep": "#e1e691",
      "primary": "#8f7c25",
      "secondary": "#53b87f",
      "accent": "#6cf536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "rainbow",
    "animationMood": "orbit",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
