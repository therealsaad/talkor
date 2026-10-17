import type { KGCurriculumUnit, KGLessonPlan } from '../types'
import { lessons } from './lessons'

export interface KGLessonVideoScript {
  status: 'NOT_CREATED'
  lessonKey: string
  title: string
  unitNumber: number
  plannedDurationSeconds: 20
  approvedCharacter: 'MISS_JULIE_NEUTRAL'
  characterReference: 'talkora-client/public/miss-julie/miss-julie-character-sheet.png'
  characterIdentity: string
  story: string
  azureTtsNarration: string
  scenes: Array<{
    startSecond: number
    endSecond: number
    beat: string
    narration: string
    runwayImageToVideoPrompt: string
  }>
  sound: { effects: string[]; backgroundMusic: string }
  transition: string
  playback: {
    webmPath: string
    mp4Path: string
    availability: 'NOT_CREATED'
    playOnFirstEntry: true
    skipAllowed: true
    replayAllowed: true
    skipWhenResuming: true
  }
}

const CHARACTER_IDENTITY = 'Miss Julie must match the approved reference: long wavy brown hair, warm brown eyes, light blue blazer, white blouse, beige trousers, and pearl earrings. Keep the same face, age, outfit, proportions, and gentle teacher manner in every shot.'

function wordsFor(lesson: KGLessonPlan): string[] {
  const words = [...lesson.newWords, ...lesson.reviewWords]
    .map((word) => word.trim())
    .filter(Boolean)
  return Array.from(new Set(words)).slice(0, 4)
}

export function kgLessonVideoScript(unit: KGCurriculumUnit, lesson: KGLessonPlan): KGLessonVideoScript {
  const words = wordsFor(lesson)
  const first = words[0] || 'hello'
  const second = words[1] || first
  const wordList = words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : first
  const childLine = lesson.modelSentence.replace(/[.!?]+$/, '')
  const story = `Miss Julie finds ${wordList} on a little ${unit.world.toLowerCase()} adventure. She listens, points, and says each word slowly. The child can join with one word or try: “${childLine}.”`
  const scenes = [
    {
      startSecond: 0,
      endSecond: 5,
      beat: 'Welcome',
      narration: `Hello, little learner! Miss Julie is happy you are here.`,
      runwayImageToVideoPrompt: `${CHARACTER_IDENTITY} Use the approved character reference image. Bright, calm 2D cartoon classroom, warm daylight, Miss Julie gives one small welcoming wave to camera. Gentle camera push-in, stable face and outfit, no scene cut, no on-screen text.`,
    },
    {
      startSecond: 5,
      endSecond: 10,
      beat: `Meet ${first} and ${second}`,
      narration: `Look! We will find ${wordList}. Listen to each word.`,
      runwayImageToVideoPrompt: `${CHARACTER_IDENTITY} Show two large, simple, clearly recognizable child-friendly cartoon illustrations of ${first.toLowerCase()} and ${second.toLowerCase()} on a clean pastel background beside Miss Julie. Slow gentle pan from the first object to the second, no extra objects, no text, no flicker.`,
    },
    {
      startSecond: 10,
      endSecond: 15,
      beat: 'Listen and say',
      narration: `Miss Julie says, “${childLine}.” You can listen, then try.`,
      runwayImageToVideoPrompt: `${CHARACTER_IDENTITY} Miss Julie points softly toward the ${first.toLowerCase()} picture card, models a short sentence with a friendly speaking expression, then pauses with an encouraging listening expression. Keep the picture bold, clear, centered, and still. No captions or mouth distortion.`,
    },
    {
      startSecond: 15,
      endSecond: 20,
      beat: 'Move into the lesson',
      narration: `Your turn! Let’s learn together with Miss Julie.`,
      runwayImageToVideoPrompt: `${CHARACTER_IDENTITY} Miss Julie smiles and gestures toward a large rounded lesson doorway with the same ${unit.world.toLowerCase()} colors. The vocabulary cards slide gently to the side as the camera eases toward the doorway. End on a clean bright frame for a seamless cut into the interactive lesson. No text.`,
    },
  ]
  const azureTtsNarration = scenes.map((scene) => scene.narration).join(' ')
  return {
    status: 'NOT_CREATED',
    lessonKey: lesson.lessonKey,
    title: lesson.title,
    unitNumber: unit.unitNumber,
    plannedDurationSeconds: 20,
    approvedCharacter: 'MISS_JULIE_NEUTRAL',
    characterReference: 'talkora-client/public/miss-julie/miss-julie-character-sheet.png',
    characterIdentity: CHARACTER_IDENTITY,
    story,
    azureTtsNarration,
    scenes,
    sound: {
      effects: ['soft page turn at object reveal', 'quiet sparkle at the welcome', 'gentle chime at the lesson transition'],
      backgroundMusic: 'Very soft, cheerful marimba and warm acoustic plucks; instrumental, no vocals; fade out before the lesson microphone can start.',
    },
    transition: 'Fade to the interactive lesson after the final line; stop video and all video audio before Miss Julie begins lesson speech or microphone capture.',
    playback: {
      webmPath: `/kg/lesson-intros/${lesson.lessonKey}.webm`,
      mp4Path: `/kg/lesson-intros/${lesson.lessonKey}.mp4`,
      availability: 'NOT_CREATED',
      playOnFirstEntry: true,
      skipAllowed: true,
      replayAllowed: true,
      skipWhenResuming: true,
    },
  }
}

export const kgLessonVideoScripts = lessons.flatMap((unit) => unit.lessons.map((lesson) => kgLessonVideoScript(unit, lesson)))

export function validateKGLessonVideoScripts(scripts: readonly KGLessonVideoScript[] = kgLessonVideoScripts): string[] {
  const errors: string[] = []
  if (scripts.length !== 24) errors.push(`Expected 24 KG lesson scripts; received ${scripts.length}.`)
  const keys = new Set<string>()
  for (const script of scripts) {
    if (keys.has(script.lessonKey)) errors.push(`Duplicate video script for ${script.lessonKey}.`)
    keys.add(script.lessonKey)
    if (script.status !== 'NOT_CREATED' || script.playback.availability !== 'NOT_CREATED') errors.push(`${script.lessonKey} incorrectly claims a video exists.`)
    if (script.plannedDurationSeconds < 15 || script.plannedDurationSeconds > 25) errors.push(`${script.lessonKey} is outside the 15–25 second target.`)
    if (script.scenes.length < 3 || script.scenes[0]?.startSecond !== 0 || script.scenes.at(-1)?.endSecond !== script.plannedDurationSeconds) errors.push(`${script.lessonKey} has an incomplete storyboard.`)
    if (!script.azureTtsNarration.trim() || !script.story.trim() || script.scenes.some((scene) => !scene.runwayImageToVideoPrompt.includes(CHARACTER_IDENTITY))) errors.push(`${script.lessonKey} is missing required story, narration, or character guidance.`)
    if (/https?:\/\//i.test(JSON.stringify(script))) errors.push(`${script.lessonKey} contains a URL instead of a stable local asset path.`)
  }
  return errors
}
