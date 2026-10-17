/**
 * Talkora Foundation Starter Curriculum – safe, idempotent, additive seed.
 *
 * IMPORTANT: These lessons are original ENRICHMENT starter content, NOT an
 * approved KG–Class 10 school syllabus. Class 4's authored Fluento syllabus
 * is deliberately untouched. Review lessons with educators before publishing.
 *
 * Run: npm run seed:foundation -- --dry-run
 *      npm run seed:foundation
 *
 * This script never deletes student progress, attempts or authored lessons.
 */
import { connectDatabase, disconnectDatabase } from '../config/db'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'

import { starters } from '../curriculum'


const isDryRun = process.argv.includes('--dry-run')
const source = { sourceType: 'ENRICHMENT' as const, label: 'Talkora foundation starter (not textbook syllabus)' }

/** Never overwrite real, published content. A previously seeded unit is updated only
 * when it has our explicit curriculum version, and only before students attempt it. */
async function apply() {
  await connectDatabase()
  try {
    for (const [gradeText, units] of Object.entries(starters)) {
      const grade = Number(gradeText)
      if (!Number.isInteger(grade) || grade < 0 || grade > 10) throw new Error(`Invalid grade: ${gradeText}`)
      if (!units?.length) throw new Error(`No starter lessons are configured for grade ${grade}`)
      const className = grade === 0 ? 'Kindergarten (KG)' : `Class ${grade}`
      const existingClass = await CurriculumClass.findOne({ grade })
      if (isDryRun) {
        console.log(`[DRY RUN] ${className}: ${units.length} original starter unit(s); would keep existing authored content`)
        continue
      }
      const klass = existingClass || await CurriculumClass.create({ grade, name: className, order: grade, status: 'active' })
      // Never insert starter units in front of an active, approved syllabus.
      const authoredPublished = await Level.exists({ classId: klass._id, availability: 'PUBLISHED',
        status: 'active', curriculumVersion: { $not: /^talkora-foundation-/ } })
      if (authoredPublished) {
        console.log(`[SKIP] ${className}: existing authored curriculum takes priority`)
        continue
      }
      for (let idx = 0; idx < units.length; idx++) {
        const unit = units[idx]
        const number = idx + 1
        const version = `talkora-foundation-g${grade}-v1`
        const existing = await Level.findOne({ classId: klass._id, curriculumVersion: version, unitNumber: number })
        // Old development seeds may have reserved unit numbers as UPCOMING.
        // Use a separate level number rather than overwriting school-authored data.
        const occupied = !existing && await Level.exists({ classId: klass._id, number })
        const assignedNumber = existing?.number ?? (occupied ? 100 + number : number)
        const conflict = !existing && await Level.exists({ classId: klass._id, number: assignedNumber })
        if (conflict) {
          console.log(`[SKIP] ${className} starter unit ${number}: no safe unit number`)
          continue
        }
        const level = existing || new Level({ classId: klass._id, number: assignedNumber })
        // Don't change original/Class-4 and other author-owned curricula.
        if (existing && existing.curriculumVersion === version) {
          const attempted = await import('../models/ActivityAttempt.js').then(({ ActivityAttempt }) =>
            ActivityAttempt.exists({ levelId: existing._id }))
          if (attempted) { console.log(`[SKIP] ${className} unit ${number}: student attempts already exist`); continue }
        }
        level.set({
          classId: klass._id, number: assignedNumber, unitNumber: number, order: number,
          term: 1, unitType: 'CONVERSATION', visualTheme: unit.world,
          learningObjectives: [unit.description], speakingGoals: ['Recognise vocabulary', 'Speak with Miss Julie', 'Practise at the end'],
          curriculumVersion: version, availability: 'PUBLISHED', status: 'active',
          title: unit.title, place: unit.world, description: unit.description,
          sourceBook: undefined, sourcePages: [],
        })
        await level.save()
        const lesson = await Lesson.findOneAndUpdate({ levelId: level._id, order: 1 }, {
          $set: { title: unit.title, subtitle: unit.description, estimatedMinutes: grade <= 1 ? 4 : 7,
            xpReward: 70, teacherIntroduction: `Let's learn together in ${unit.world}!`, status: 'active',
            settings: { foundation: true, schoolSyllabusApproved: false, languageSupport: grade <= 3 ? 'hi-en' : 'en' }, },
        }, { upsert: true, new: true, runValidators: true })
        const [word1, word2, word3, word4] = unit.words
        const activities = [
          { type: 'PICTURE_CHOICE', stage: 'WARM_UP', title: `Touch ${word1}`,
            prompt: `Can you touch the ${word1.toLowerCase()}?`, choices: [word2, word1, word3], answer: word1,
            difficulty: 'easy', estimatedSeconds: 25, voiceEnabled: true, aiEnabled: false, allowOptions: true,
            content: { pictureMode: true, languageHint: 'सही तस्वीर को छुओ' }, },
          { type: 'PICTURE_CHOICE', stage: 'PRACTICE_ZONE', title: `Find ${word3}`,
            prompt: `Great! Now touch the ${word3.toLowerCase()}.`, choices: [word4, word2, word3], answer: word3,
            difficulty: 'easy', estimatedSeconds: 25, voiceEnabled: true, aiEnabled: false, allowOptions: true,
            content: { pictureMode: true, languageHint: 'तस्वीर पहचानो' }, },
          { type: 'SPEAK_PROMPT', stage: 'LISTEN_REPEAT', title: 'Listen and say',
            prompt: grade === 0 ? `Look at the picture. Say ${word1.toLowerCase()}.` : `Listen and repeat: ${unit.sentence}`,
            target: grade === 0 ? word1 : unit.sentence, modelSentence: grade === 0 ? word1 : unit.sentence,
            difficulty: 'easy', estimatedSeconds: 40, voiceEnabled: true, aiEnabled: false, allowMic: true,
            content: { pictureMode: grade === 0, pictureWord: word1 }, },
          { type: 'OPEN_CONVERSATION', stage: 'INTERACT', title: 'Talk with Miss Julie',
            prompt: unit.question, target: unit.question, teacherPrompt: `${unit.question} Keep replies short, and offer a model answer if needed.`,
            modelSentence: unit.example, difficulty: grade <= 3 ? 'easy' : 'medium', estimatedSeconds: 70,
            voiceEnabled: true, aiEnabled: true, allowMic: true, allowOptions: grade <= 3,
            choices: grade <= 3 ? [unit.example] : undefined,
            metadata: { conversationMode: 'OPEN', maxTurns: 2, foundation: true },
            conversationGoal: { requiredConcepts: [], minTurns: 1, maxTurns: 2 }, maxConversationTurns: 2,
          },
          { type: 'SPEAK_PROMPT', stage: 'HOME_PRACTICE', title: 'My speaking homework',
            prompt: `Last challenge! Say this for practice: ${unit.homework}`,
            target: unit.homework, modelSentence: unit.homework, difficulty: 'easy', estimatedSeconds: 35,
            voiceEnabled: true, aiEnabled: false, allowMic: true,
            content: { isHomework: true, parentSubmissionRequired: false }, },
        ] as const
        for (let i = 0; i < activities.length; i++) {
          const activity = activities[i]
          const key = `foundation-g${grade}-u${number}-a${i + 1}`
          await Activity.findOneAndUpdate({ lessonId: lesson._id, order: i + 1 }, {
            $set: {
              ...activity, lessonId: lesson._id, order: i + 1, grade, term: 1, unitNumber: number,
              curriculumVersion: version, activityKey: key, status: 'active', core: true, required: true,
              xp: i === 4 ? 20 : 12, keywords: unit.words.map(w => w.toLowerCase()), expectedPatterns: [],
              source,
            },
          }, { upsert: true, new: true, runValidators: true })
        }
        console.log(`[READY] ${className}: ${unit.title} (5 activities)`)
      }
      // Do not reactivate an unconfigured class if its first unit wasn't published.
      const ready = await Level.exists({ classId: klass._id, curriculumVersion: `talkora-foundation-g${grade}-v1`, availability: 'PUBLISHED', status: 'active' })
      if (ready) await CurriculumClass.updateOne({ _id: klass._id }, { $set: { status: 'active', name: className, order: grade } })
    }
    console.log('Done. Class 4 syllabus is unchanged. Review starter content before school deployment.')
  } finally { await disconnectDatabase() }
}
apply().catch(err => { console.error(err); process.exitCode = 1 })
