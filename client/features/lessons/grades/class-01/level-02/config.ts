import type { LevelDesignConfig } from '../../../types'
import { CLASS1_BALBHARATI_DRAFTS, CLASS1_BALBHARATI_SOURCE } from '../balbharati-curriculum'

const chapterPlan = CLASS1_BALBHARATI_DRAFTS[1]

/** Distinct, editable theme and pedagogy for g01-l02. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l02",
  "grade": 1,
  "level": 2,
  "gradeLabel": "Class 1",
  "title": chapterPlan.title,
  "editorialStatus": "draft",
  "studentPlayable": false,
  "description": `Original voice-first speaking activities for ${chapterPlan.title}, aligned to English Balbharati chapters ${chapterPlan.exercises.map((exercise) => exercise.chapter).join(', ')}. Educator sign-off pending.`,
  "syllabus": {
    "objectives": [
      chapterPlan.goal,
      "Explain one step in Hindi or Marathi when requested; always return to short English speaking.",
      "Use modeled feedback for repeated difficulty and extend only when the student is ready."
    ],
    "skills": [
      "listening",
      "speaking",
      "reading"
    ],
    "boardReviewRequired": true,
    "sourceBook": CLASS1_BALBHARATI_SOURCE,
    "sourcePages": chapterPlan.exercises.map((exercise) => exercise.page),
    "syllabusVerified": false
  },
  "experience": {
    "themeId": "class-01-02-my-school",
    "world": "Treasure Cove",
    "sceneDescription": "floating islands and treasure lanterns",
    "layout": "card-carousel",
    "palette": {
      "background": "#fce5c2",
      "backgroundDeep": "#e6d891",
      "primary": "#8f6525",
      "secondary": "#53b869",
      "accent": "#95f536",
      "ink": "#183246",
      "surface": "#ffffff"
    },
    "motif": "compass",
    "animationMood": "glow",
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
    "beginnerHindiSupport": true,
    "spontaneousFeedbackTTS": "azure-uncached",
    "staticAudioStrategy": "s3-first-with-azure-fallback",
    "sendMicrophoneAudioToBackend": true,
    "homeworkRequired": true
  },
  "staffOnlyPreview": true
} as const satisfies LevelDesignConfig
