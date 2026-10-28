import type { LevelDesignConfig } from '../../../types'
import { CLASS1_BALBHARATI_DRAFTS, CLASS1_BALBHARATI_SOURCE } from '../balbharati-curriculum'

const chapterPlan = CLASS1_BALBHARATI_DRAFTS[5]

/** Distinct, editable theme and pedagogy for g01-l06. Authoring is NOT publishing. */
export const config = {
  "id": "g01-l06",
  "grade": 1,
  "level": 6,
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
