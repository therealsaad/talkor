/**
 * Safe curriculum address mapper. Creates EMPTY DRAFT placeholders ONLY.
 * - Does not modify an existing CurriculumClass, Level or Lesson (especially Class 4).
 * - Does not publish or create activities/grades/student accounts.
 * - Defaults to read-only dry run. --apply is required to write.
 */
import { connectDatabase, disconnectDatabase } from '../config/db'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { GRADE_ROADMAP } from '../curriculum/roadmap'
import { assertRoadmapCoverage, gradeName } from '../curriculum/level-map-contract'

async function main() {
  const apply = process.argv.includes('--apply')
  assertRoadmapCoverage()
  await connectDatabase()
  const metrics = { existingClasses: 0, newClasses: 0, existingLevels: 0, newLevels: 0, newDraftLessons: 0 }
  try {
    for (let grade = 0; grade <= 10; grade++) {
      let klass = await CurriculumClass.findOne({ grade })
      if (klass) metrics.existingClasses++
      else {
        metrics.newClasses++
        if (apply) {
          // $setOnInsert preserves custom class names and legacy syllabuses.
          klass = await CurriculumClass.findOneAndUpdate({ grade }, { $setOnInsert: {
            grade, name: gradeName(grade), order: grade, status: 'active',
            description: 'Talkora syllabus mapping; blank lessons are unavailable until reviewed and published.',
          } }, { upsert: true, new: true, setDefaultsOnInsert: true })
        }
      }
      const known = klass ? await Level.find({ classId: klass._id, number: { $gte: 1, $lte: 10 } }).select('number') : []
      const occupied = new Set(known.map((item) => item.number))
      for (const outline of GRADE_ROADMAP.filter((entry) => entry.grade === grade)) {
        if (occupied.has(outline.level)) {
          metrics.existingLevels++
          continue // Never rename/rewrite existing KG pilot or Class 4 work.
        }
        metrics.newLevels++
        metrics.newDraftLessons++
        if (!apply) continue
        if (!klass) throw new Error(`Missing class for grade ${grade}`)
        const actual = await Level.findOneAndUpdate({ classId: klass._id, number: outline.level }, {
          $setOnInsert: {
            classId: klass._id, number: outline.level, order: outline.level,
            term: outline.level <= 5 ? 1 : 2,
            unitNumber: outline.level, // Supports level 9/10 without colliding with legacy 1–8 units.
            unitType: 'CONVERSATION', visualTheme: 'Talkora Classroom',
            title: outline.title, description: `Unpublished syllabus placeholder: ${outline.objective}`,
            place: 'Talkora Classroom', learningObjectives: [outline.objective],
            speakingGoals: outline.skills, sourcePages: [], curriculumVersion: 'talkora-curriculum-map-v1',
            availability: 'UPCOMING', status: 'draft',
          },
        }, { upsert: true, new: true, setDefaultsOnInsert: true })
        if (!actual) throw new Error(`Level ${outline.id} could not be mapped`)
        // A single empty draft Lesson provides an explicit model mapping, not false content.
        await Lesson.updateOne({ levelId: actual._id, order: 1 }, { $setOnInsert: {
          levelId: actual._id, order: 1, title: `${outline.title} — authoring placeholder`,
          subtitle: 'Coming soon. No activities have been authored.', estimatedMinutes: 0,
          xpReward: 0, status: 'draft', settings: {
            mappedPlaceholder: true, authoringStatus: 'EMPTY',
            syllabusVerified: false, teacherApproved: false, published: false,
          },
        } }, { upsert: true, setDefaultsOnInsert: true })
      }
    }
    if (Object.values(metrics).some((value) => !Number.isFinite(value))) throw new Error('Invalid mapping results')
    console.log(JSON.stringify({ mode: apply ? 'APPLIED' : 'DRY_RUN', ...metrics, totalGradeLevelAddresses: 110 }, null, 2))
    if (!apply) console.log('No database writes were made. To create draft placeholders, rerun with --apply.')
  } finally { await disconnectDatabase() }
}
main().catch((err) => { console.error(err); process.exitCode = 1 })
