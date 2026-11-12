
import type { LevelDesignConfig } from '../../../types'

/**
 * Level 4 — draft based on the pictures visible in the supplied video.
 * Exact spoken content and syllabus mapping still require verification.
 * This configuration does not publish the lesson to students.
 */
export const config = {
  "id": "g00-l04",
  "grade": 0,
  "level": 4,
  "gradeLabel": "Kindergarten",
  "title": "Picture Words: Q–V",
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": "A picture-based vocabulary lesson using the images visible in the supplied introductory video.",
  "syllabus": {
    "objectives": [
      "Recognize and name the picture words presented in the lesson video.",
      "Listen to Miss Julie and practise saying the vocabulary aloud.",
      "Match spoken words to their corresponding pictures."
    ],
    "skills": ["listening", "speaking", "picture-recognition"],
    "boardReviewRequired": true,
    "sourceBook": null,
    "sourcePages": [],
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "kg-04-picture-words",
    "world": "Star Observatory",
    "sceneDescription": "orbiting stars, planets and glowing trails",
    "layout": "explorer-trail",
    "palette": {
      "background": "#fcccc2",
      "backgroundDeep": "#e6b391",
      "primary": "#8f3625",
      "secondary": "#68b853",
      "accent": "#e9f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "star",
    "animationMood": "orbit",
    "musicMood": "quiet-acoustic",
    "useReducedMotionFallback": true,
    "minTouchTargetPx": 48
  },
  "learningPolicy": {
    "voiceFirst": true,
    "invisibleAdaptive": true,
    "autoResume": true,
    "introRequired": true,
    "introMustComplete": true,
    "speechLanguage": "en-IN",
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
