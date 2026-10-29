/**
 * Class 1 Level 1: supervised Balbharati 1.1 "My First Day" replacement.
 * No textbook poem/art is copied. This is an ORIGINAL spoken companion.
 *
 * PREVIEW: pnpm exec tsx -r dotenv/config src/scripts/prepare-class1-first-day-only.ts
 * APPLY:   TALKORA_FIRST_DAY_ONLY_APPLY=YES pnpm exec tsx -r dotenv/config src/scripts/prepare-class1-first-day-only.ts --apply
 *
 * Apply is blocked when *any* student has attempted an existing activity,
 * or stored lesson progress. It only updates the owned DEVELOPMENT draft.
 * A new reviewed 90-second First Day intro must be supplied separately.
 */
import { connectDatabase, disconnectDatabase } from '../config/db'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { Progress } from '../models/Progress'
import { Conversation } from '../models/Conversation'
import { CLASS1_DEMO_VERSION } from '../services/class1-demo-access'
import { S3Service } from '../services/S3Service'
import firstDayVoices from './class1-first-day-voice-v3.json'

export const FIRST_DAY_SCENES = [
  { key: 'hello-school', title: 'School gate: Hello, Grade One!', focus: 'SCHOOL',
    prompt: 'My First Day at school! I am Miss Julie. Wave hello! Tell me: are you happy, excited, or shy about school?',
    sentence: 'I am happy at school.', vocabulary: ['school', 'hello', 'happy'] },
  { key: 'skip-bunny', title: 'Skip like a bunny', focus: 'SKIP',
    prompt: 'My First Day action game! Pretend to skip like a bunny. Can you tell me in English what you can do?',
    sentence: 'I can skip.', vocabulary: ['skip', 'bunny', 'school'] },
  { key: 'run-race', title: 'Run in the playground', focus: 'RUN',
    prompt: 'My First Day: make your fingers run on the table! Is Miss Julie a speedy turtle or a rocket? Say what you can do.',
    sentence: 'I can run.', vocabulary: ['run', 'school', 'playground'] },
  { key: 'walk-school', title: 'Walk to school', focus: 'WALK',
    prompt: 'My First Day: Miss Julie is walking to school. Make two walking fingers! How do you go to school? Let us use walk.',
    sentence: 'I walk to school.', vocabulary: ['walk', 'school'] },
  { key: 'big-grin', title: 'Give Miss Julie a grin', focus: 'SMILE',
    prompt: 'My First Day: show me a huge grin! Even a sleepy elephant can smile. What does grin mean? Can you make a smiling sentence?',
    sentence: 'I can smile.', vocabulary: ['grin', 'smile', 'school'] },
  { key: 'school-bell', title: 'Ding dong! The school bell', focus: 'BELL',
    prompt: 'My First Day: ding dong! The school bell rings. What do we hear at school? Ask me about the bell if you like.',
    sentence: 'I hear a bell.', vocabulary: ['bell', 'rings', 'school', 'hear'] },
  { key: 'jump-frog', title: 'Jump like a frog', focus: 'JUMP',
    prompt: 'My First Day: Miss Julie is a jumping frog! Show jumping fingers and tell me a little English sentence.',
    sentence: 'I can jump.', vocabulary: ['jump', 'frog', 'school'] },
  { key: 'play-friends', title: 'Let us play at school', focus: 'PLAY',
    prompt: 'My First Day: what can we play at school? Pretend to bounce a ball. Tell me or ask a school-play question.',
    sentence: 'I can play.', vocabulary: ['play', 'school', 'ball'] },
  { key: 'enter-class', title: 'Time to go into class', focus: 'GO IN',
    prompt: 'My First Day: the school bell rings and we go into our classroom. Where do we go when the bell rings?',
    sentence: 'I go into my classroom.', vocabulary: ['school', 'bell', 'classroom', 'go'] },
  { key: 'grade-one', title: 'Hooray, we are in Grade One!', focus: 'GRADE ONE',
    prompt: 'My First Day celebration! We walked, skipped, smiled, jumped and played. Tell Miss Julie one fun thing you do at school.',
    sentence: 'I am in Grade One!', vocabulary: ['school', 'grade', 'one', 'run', 'skip', 'walk', 'play'] },
] as const

const APPLY = process.argv.includes('--apply')
const PREFIX = 'class1-l01-v3-'
async function main() {
  if (APPLY && (process.env.NODE_ENV !== 'development' || process.env.TALKORA_FIRST_DAY_ONLY_APPLY !== 'YES')) {
    throw new Error('WRITE_BLOCKED: development and TALKORA_FIRST_DAY_ONLY_APPLY=YES required')
  }
  if (APPLY && (process.env.TALKORA_FIRST_DAY_INTRO_REVIEWED !== 'YES' ||
      !/^https:\/\//.test(process.env.TALKORA_FIRST_DAY_INTRO_URL || ''))) {
    throw new Error('INTRO_NOT_READY: a reviewed First Day-only 90-second video URL and explicit approval are required before replacing the old foundation lesson')
  }
  await connectDatabase()
  try {
    const klass = await CurriculumClass.findOne({ grade: 1, status: 'draft' }).lean()
    const level = klass && await Level.findOne({ classId: klass._id, number: 1, curriculumVersion: CLASS1_DEMO_VERSION, status: 'draft' }).lean()
    const lesson = level && await Lesson.findOne({ levelId: level._id, status: 'draft', 'settings.talkoraDemoDraft': true })
    if (!klass || !level || !lesson) throw new Error('Cannot find owned Class 1 Level 1 development draft')
    const current = await Activity.find({ lessonId: lesson._id, status: 'draft', curriculumVersion: CLASS1_DEMO_VERSION }).sort('order').lean()
    const v2 = current.filter(a => a.activityKey?.startsWith('class1-l01-v2-'))
    const v3 = current.filter(a => a.activityKey?.startsWith(PREFIX))
    const unexpected = current.filter(a => !/^class1-l01-(?:v2-|v3-|legacy-)/.test(a.activityKey || ''))
    if (unexpected.length || (v2.length !== 10 && v3.length !== 10)) throw new Error('Unexpected lesson manifest; no changes made')
    const [attempts, progress, conversations] = await Promise.all([
      ActivityAttempt.countDocuments({ activityId: { $in: current.map(a => a._id) } }),
      Progress.find({ classId: klass._id }).select('levels').lean(),
      Conversation.countDocuments({ lessonId: lesson._id }),
    ])
    const hasProgress = progress.some(row => row.levels.some(lvl =>
      String(lvl.levelId) === String(level._id) && lvl.lessons.some(l =>
        String(l.lessonId) === String(lesson._id) &&
        (l.completed || (l.completedActivityIds || []).length > 0))))
    const safe = attempts === 0 && !hasProgress && conversations === 0
    const ready = v3.length === 10 && v3.every(a => a.required && a.core)
    console.log(JSON.stringify({
      status: APPLY ? 'APPLY_REQUEST' : 'PREVIEW_ONLY', database: (await import('mongoose')).default.connection.db?.databaseName,
      grade: 1, levelId: 'g01-l01', scenes: FIRST_DAY_SCENES.map(s => s.title),
      existingV2: v2.length, existingV3: v3.length, attempts, hasProgress, conversations,
      safeToReplace: safe, alreadyPrepared: ready,
      warning: 'Before any student rollout, teacher-review the scenes and replace the OLD 90-second tiny-word intro video with a First Day-only video.',
    }, null, 2))
    if (!APPLY || ready) return
    if (!safe) throw new Error('STUDENT_HISTORY_EXISTS: no migration attempted; create an isolated fresh staging fixture instead')
    if (v2.length !== 10 || v3.length) throw new Error('PARTIAL_MIGRATION: manual review required')
    if (process.env.TALKORA_FIRST_DAY_AUDIO_REVIEWED !== 'YES') {
      throw new Error('AUDIO_NOT_REVIEWED: approve and upload the full English voice pack before replacing the lesson')
    }
    // Ensure all immutable English clips exist before any MongoDB write.
    const reviewed = FIRST_DAY_SCENES.map(scene => {
      const line = firstDayVoices.lines.find(x => x.scene === scene.key && x.language === 'en-IN')
      if (!line) throw new Error('Missing approved narration: ' + scene.key)
      return line
    })
    for (const line of reviewed) {
      const verified = await S3Service.headAudio(line.s3Key)
      if (!verified || !verified.contentLength || verified.contentLength < 256) {
        throw new Error('Missing reviewed private S3 narration: ' + line.id)
      }
    }
    // Move old activities to a non-playable historical range without deleting
    // their Mongo IDs. 11..20 are already owned by the optional legacy set.
    for (const a of v2) {
      await Activity.updateOne({ _id: a._id, lessonId: lesson._id, status: 'draft' },
        { $set: { order: a.order + 20, core: false, required: false } })
    }
    // All new activities go through the existing authenticated speech/session path.
    for (const [index, scene] of FIRST_DAY_SCENES.entries()) {
      const line = reviewed[index]
      await Activity.create({
        lessonId: lesson._id, curriculumVersion: CLASS1_DEMO_VERSION,
        activityKey: PREFIX + scene.key, grade: 1, term: 1, unitNumber: 1,
        order: index + 1, title: scene.title, prompt: line.text, teacherPrompt: line.text,
        target: scene.focus.toLowerCase(), modelSentence: scene.sentence, instruction: scene.prompt,
        type: 'CONVERSATION', stage: 'INTERACT', expectedPatterns: [], keywords: [...scene.vocabulary],
        choices: [], difficulty: 'easy', xp: 0, estimatedSeconds: 90, voiceEnabled: true,
        aiEnabled: true, allowMic: true, allowOptions: false, repeatRequired: false,
        maxConversationTurns: 4,
        conversationGoal: { requiredConcepts: ['first_day_english_attempt'], minTurns: 2, maxTurns: 4 },
        metadata: { conversationMode: 'OPEN', digitalType: 'FIRST_DAY_VOICE_SCENE',
          sceneKey: scene.key, masteryEvidence: ['first_day_english_attempt'], allowedVocabulary: [...scene.vocabulary],
          teacherReviewRequired: true, languageSupport: ['English', 'Hindi', 'Marathi'] },
        source: { sourceType: 'SYLLABUS', pdf: 'https://ebooks.ebalbharati.in/pdfs/103050001.pdf',
          pageStart: 1, pageEnd: 1, label: 'Original interactive companion to English Balbharati Grade One, Unit 1.1 My First Day' },
        content: { audioKey: line.s3Key, teacherReviewRequired: true, noTextbookArtwork: true, noTouchChoices: true },
        core: true, required: true, status: 'draft',
      })
    }
    await Lesson.updateOne({ _id: lesson._id, status: 'draft', 'settings.talkoraDemoDraft': true }, {
      $set: { title: 'My First Day — School Adventure', subtitle: 'A playful, voice-only Balbharati 1.1 school adventure',
        teacherIntroduction: 'Miss Julie teaches skipping, running, walking, grinning, the bell, jumping, playing and Grade One through speech.',
        'settings.lessonPlanRevision': 'class1-first-day-only-v3',
        'settings.homework': 'Tell someone at home: I can walk, I can play, and I am in Grade One.',
        'settings.introVideoReviewStatus': 'APPROVED_EXTERNAL_FIRST_DAY_VIDEO',
        'settings.syllabusVerified': false,
      },
    })
    console.log(JSON.stringify({ status: 'FIRST_DAY_V3_DRAFT_CREATED', scenes: 10, publicationState: 'draft-only',
      warning: 'Replace and review the 90-second intro before admitting any student. Never run the old v2 finalizer on v3.' }))
  } finally {
    await disconnectDatabase()
  }
}
main().catch(error => { console.error(String(error instanceof Error ? error.message : error)); process.exitCode = 1 })
