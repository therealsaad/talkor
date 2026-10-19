import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g06-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g06-l06",
  "grade": 6,
  "level": 6,
  "gradeLabel": "Class 6",
  "title": "Storytelling",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Storytelling — a distinct rainbow valley adventure for Class 6 learners.",
  "syllabus": {
    "objectives": [
      "Understand, practise, and communicate confidently about storytelling."
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
    "themeId": "class-06-06-storytelling",
    "world": "Rainbow Valley",
    "sceneDescription": "sky bridges, color ribbons and clouds",
    "layout": "split-story",
    "palette": {
      "background": "#c2ddfc",
      "backgroundDeep": "#91a3e6",
      "primary": "#25558f",
      "secondary": "#b853a7",
      "accent": "#8b36f5",
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
    "beginnerHindiSupport": false,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
