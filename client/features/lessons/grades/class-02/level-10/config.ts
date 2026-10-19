import type { LevelDesignConfig } from '../../../types'

/** Distinct, editable theme and pedagogy for g02-l10. Authoring is NOT publishing. */
export const config = {
  "id": "g02-l10",
  "grade": 2,
  "level": 10,
  "gradeLabel": "Class 2",
  "title": "Story Retelling",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "Story Retelling — a distinct festival square adventure for Class 2 learners.",
  "syllabus": {
    "objectives": [
      "Recognize, hear, and speak language connected to story retelling."
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
    "themeId": "class-02-10-story-retelling",
    "world": "Festival Square",
    "sceneDescription": "paper lanterns, stage lights and confetti",
    "layout": "split-story",
    "palette": {
      "background": "#dbfcc2",
      "backgroundDeep": "#a0e691",
      "primary": "#518f25",
      "secondary": "#53a3b8",
      "accent": "#36f592",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "confetti",
    "animationMood": "bounce",
    "musicMood": "light-chimes",
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
