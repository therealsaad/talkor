/** Additive poem lesson installer. Never modifies existing v2/v3 or learner progress.
 * Preview: pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-poem.ts
 * Apply ONLY after intro media review and demo validation:
 * $env:TALKORA_CLASS1_POEM_STAGE='YES'
 * pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-poem.ts --apply
 */
import 'dotenv/config'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { Progress } from '../models/Progress'
import { CLASS1_DEMO_VERSION, CLASS1_DEMO_LESSON_FILTER,
  CLASS1_FIRST_DAY_POEM_REVISION } from '../services/class1-demo-access'
import { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_FULL, FIRST_DAY_POEM_STEPS,
  FIRST_DAY_POEM_WORD_BANK } from '../curriculum/class1-first-day-poem'
import { CLASS1_BUNDLED_FIRST_DAY_INTRO, chooseClass1IntroSource,
  isAllowedClass1IntroSource } from './class1-first-day-intro-url'

const APPLY = process.argv.includes('--apply')
const INSTALLING = 'class1-first-day-poem-v4-installing'

/** Before a local lab's read-only/draft install, inspect the existing file
 * physically, without fetching anything or changing published media.
 * The browser still strictly requires 87-93 s of unmuted viewing.
 */
function inspectBundledIntro() {
  const cwd = process.cwd()
  const root = existsSync(resolve(cwd, 'client', 'public')) ? cwd : resolve(cwd, '..')
  const videoFile = resolve(root, 'client', 'public', CLASS1_BUNDLED_FIRST_DAY_INTRO.slice(1))
  if (!existsSync(videoFile) || statSync(videoFile).size < 1_000_000) {
    throw new Error('BUNDLED_CLASS1_INTRO_MISSING: expected the real MP4 in client/public/lessons/class-01/level-01/')
  }
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration:stream=codec_type',
    '-of', 'json', videoFile,
  ], { encoding: 'utf8', timeout: 20_000 })
  if (result.error) {
    if ((result.error as NodeJS.ErrnoException).code !== 'ENOENT')
      throw new Error('Unable to inspect bundled First Day intro: ' + result.error.message)
    console.log('CHECK: ffprobe not installed; manually verify 87-93 s and sound. The browser will also reject invalid duration.')
  } else {
    if (result.status !== 0) throw new Error('Bundled First Day MP4 could not be decoded by ffprobe')
    const info = JSON.parse(result.stdout) as {
      format?: { duration?: string }
      streams?: Array<{ codec_type?: string }>
    }
    const duration = Number(info.format?.duration)
    if (!Number.isFinite(duration) || duration < 87 || duration > 93 ||
      !info.streams?.some(stream => stream.codec_type === 'audio') ||
      !info.streams?.some(stream => stream.codec_type === 'video')) {
      throw new Error('BUNDLED_CLASS1_INTRO_INVALID: needs 87-93 seconds, video and audio')
    }
    console.log('PASS: bundled intro has video/audio streams and ' + duration.toFixed(1) + ' s runtime')
  }
  return videoFile
}

async function main() {
  if (process.argv.slice(2).some(arg=>arg!=='--apply')) throw new Error('Unknown argument')
  if (process.env.NODE_ENV !== 'development') throw new Error('Local development demo only')
  if (APPLY && process.env.TALKORA_CLASS1_POEM_STAGE !== 'YES')
    throw new Error('Explicit TALKORA_CLASS1_POEM_STAGE=YES required to install')
  const introUrl = chooseClass1IntroSource(
    process.env.TALKORA_FIRST_DAY_INTRO_URL,
    process.env.TALKORA_FIRST_DAY_USE_BUNDLED_INTRO === 'YES',
  )
  if (APPLY) {
    if (!isAllowedClass1IntroSource(introUrl) ||
      process.env.TALKORA_FIRST_DAY_INTRO_REVIEWED !== 'YES') {
      throw new Error('Review the ACTUAL complete First Day video with sound, and set the real HTTPS URL or TALKORA_FIRST_DAY_USE_BUNDLED_INTRO=YES')
    }
    if (introUrl === CLASS1_BUNDLED_FIRST_DAY_INTRO) inspectBundledIntro()
  }
  await mongoose.connect(env.mongodbUri, { autoIndex:false, serverSelectionTimeoutMS:10000 })
  try {
    if (mongoose.connection.db?.databaseName !== 'test') throw new Error('Only local test database allowed')
    const klass = await CurriculumClass.findOne({ grade:1, status:{$in:['draft','active']} }).lean()
    const level = klass && await Level.findOne({
      classId:klass._id, number:1, curriculumVersion:CLASS1_DEMO_VERSION,
      status:'draft', availability:'UPCOMING',
    }).lean()
    if (!level) throw new Error('Canonical Class 1 Level 1 unavailable; no writes')
    const historical = await Lesson.find({ levelId:level._id, ...CLASS1_DEMO_LESSON_FILTER }).lean()
    if (!historical.length) throw new Error('No prior protected draft exists; no writes')
    const readyLessons = historical.filter(x=>x.settings?.lessonPlanRevision===CLASS1_FIRST_DAY_POEM_REVISION)
    const partial = historical.filter(x=>x.settings?.lessonPlanRevision===INSTALLING)
    if (readyLessons.length>1 || partial.length>1) throw new Error('Duplicate poem revision; inspect data')
    const readyActivities = readyLessons[0] ? await Activity.find({
      lessonId:readyLessons[0]._id, activityKey:/^class1-l01-v4-poem-/,
    }).sort('order').lean() : []
    const ready = readyActivities.length===FIRST_DAY_POEM_STEPS.length &&
      readyActivities.every((x,i)=>x.activityKey==='class1-l01-v4-'+FIRST_DAY_POEM_STEPS[i].key &&
      x.aiEnabled && x.allowMic && x.type==='CONVERSATION')
    const [oldAttempts,oldProgress] = await Promise.all([
      ActivityAttempt.countDocuments({ studentId:{$exists:true} }),
      Progress.countDocuments({ classId:level.classId }),
    ])
    console.log(JSON.stringify({
      status:ready?'ALREADY_STAGED':APPLY?'STAGE_REQUEST':'PREVIEW_ONLY',
      version:CLASS1_FIRST_DAY_POEM_REVISION, database:'test',
      textbook:'Grade One English Balbharati 1.1 My First Day (printed page 1)',
      stanzaCount:3, poemLines:FIRST_DAY_POEM_LINES.length,
      twoLinePracticeSteps:5, finalFullRecitation:1, oldLessons:historical.length,
      existingAttempts:oldAttempts, existingProgressDocs:oldProgress,
      existingPoemActivities:readyActivities.length, partialInstall:partial.length>0,
      introUrlValid:isAllowedClass1IntroSource(introUrl),
      introSource:introUrl === CLASS1_BUNDLED_FIRST_DAY_INTRO ? 'bundled-MP4' : introUrl ? 'HTTPS' : 'missing',
      existingStudentRecordsWillBeUpdated:false,
      voice:'Azure dynamic spoken recitation and Qwen per attempt; original music is client-side',
    },null,2))
    if (!APPLY || ready) return
    if (readyLessons.length || partial.length) throw new Error('Partial poem installation: inspect manually, do not clear learner data')
    const lesson = await Lesson.create({
      levelId:level._id,title:'My First Day — Listen, Sing and Recite',
      subtitle:'English Balbharati 1.1 · Three stanzas · Two-line practice · Full poem',
      teacherIntroduction:'Miss Julie performs the full poem, teaches two lines at a time, supports Hindi/Marathi and listens to a final recitation.',
      order:0,estimatedMinutes:22,xpReward:0,status:'draft',
      settings:{ talkoraDemoDraft:true,experienceId:'g01-l01',
        lessonPlanRevision:INSTALLING,introVideoUrl:introUrl,
        poemLines:FIRST_DAY_POEM_LINES.length,
        homework:'Recite My First Day with actions for someone at home.',
        curriculumMapped:true },
    })
    await Activity.insertMany(FIRST_DAY_POEM_STEPS.map((step,i)=>{
      const lines=FIRST_DAY_POEM_LINES.slice(step.start,step.end)
      const first = i===0
      const full=i===FIRST_DAY_POEM_STEPS.length-1
      const teaching = first
        ? 'Listen to our complete My First Day poem with rhythm.\n'+FIRST_DAY_POEM_FULL+
          '\nNow we will practise just two lines. Listen: '+lines.join('. ')+
          '\nIt is your turn. Say both lines to me!'
        : full
          ? 'You learnt the poem two lines at a time. Here is the complete poem once more.\n'+
            FIRST_DAY_POEM_FULL+'\nYour turn! Recite the whole poem slowly with actions.'
          : 'Well done practising! Listen to the next two poem lines: '+lines.join('. ')+
            '\nNow say BOTH lines. I will listen and help.'
      return {
        lessonId:lesson._id,curriculumVersion:CLASS1_DEMO_VERSION,
        activityKey:'class1-l01-v4-'+step.key,grade:1,term:1,unitNumber:1,
        order:i+1,title:step.title,prompt:teaching,teacherPrompt:teaching,
        target:step.target,modelSentence:lines.join(' '),
        instruction:'Listen, recite two lines, try again with Miss Julie if needed.',
        type:'CONVERSATION' as const,stage:'INTERACT' as const,
        expectedPatterns:[],keywords:[...FIRST_DAY_POEM_WORD_BANK],
        choices:[],difficulty:'easy' as const,xp:0,estimatedSeconds:150,
        voiceEnabled:true,aiEnabled:true,allowMic:true,allowOptions:false,
        repeatRequired:false,maxConversationTurns:8,
        conversationGoal:{requiredConcepts:['first_day_english_attempt'],minTurns:1,maxTurns:8},
        metadata:{conversationMode:'OPEN',digitalType:'FIRST_DAY_VOICE_SCENE',
          sceneKey:step.key,poemPairIndex:i,poemLineStart:step.start,poemLineEnd:step.end,
          languageSupport:['English','Hindi','Marathi'],allowedVocabulary:[...FIRST_DAY_POEM_WORD_BANK]},
        source:{sourceType:'SYLLABUS' as const,
          pdf:'https://ebooks.ebalbharati.in/pdfs/103050001.pdf',pageStart:1,pageEnd:1,
          label:'English Balbharati (2025), Unit 1, 1.1 My First Day'},
        content:{poemLines:[...lines],poemFull:full,noTouchChoices:true,
          originalTeachingArtwork:true,voiceMode:'AZURE_DYNAMIC'},
        core:true,required:true,status:'draft' as const,
      }
    }),{ordered:true})
    const stored=await Activity.countDocuments({lessonId:lesson._id,activityKey:/^class1-l01-v4-poem-/})
    if(stored!==6) throw new Error('PARTIAL_POEM_INSTALL: no activation; inspect staging record')
    await Lesson.updateOne(
      {_id:lesson._id,'settings.lessonPlanRevision':INSTALLING},
      {$set:{'settings.lessonPlanRevision':CLASS1_FIRST_DAY_POEM_REVISION}},
    )
    console.log(JSON.stringify({status:'POEM_V4_STAGED',lessonId:String(lesson._id),activityCount:6,
      oldStudentRecordsChanged:false},null,2))
  } finally {await mongoose.disconnect()}
}
main().catch(e=>{console.error('CLASS1_POEM_STAGE_FAILED:',e instanceof Error?e.message:'Unknown error');process.exitCode=1})
