/**
 * Authenticated-context smoke check for the configured demo student.
 * Prints no student identity, credentials, answers, or private content.
 */
import { connectDatabase, disconnectDatabase } from '../config/db'
import { CurriculumAccessService } from '../services/curriculum-access.service'
import { StudentLessonFastService } from '../services/student-lesson-fast.service'

async function main() {
  const studentId = process.env.TALKORA_CLASS1_DEMO_STUDENT_ID?.trim() || ''
  if (!/^[a-f0-9]{24}$/i.test(studentId)) throw new Error('TALKORA_CLASS1_DEMO_STUDENT_ID is missing or invalid.')

  await connectDatabase()
  try {
    const context = await CurriculumAccessService.context(studentId)
    if (!context.isClass1Demo) throw new Error('The configured student was not authorized for the Class 1 demo.')

    const next = await StudentLessonFastService.next(studentId)
    if (!next.lessonId) throw new Error('No resumable Class 1 lesson was returned.')
    const lesson = await StudentLessonFastService.lesson(studentId, next.lessonId)
    // A successful v2 little-word draft is NOT evidence that Balbharati 1.1
    // is installed. Check the actual ten student-visible v3 scenes.
    const scenes = lesson.activities.filter((activity) => activity.activityKey?.startsWith('class1-l01-v3-'))
    if (lesson.experienceId !== 'g01-l01' || lesson.activities.length !== 10 || scenes.length !== 10) {
      throw new Error('The student is not receiving exactly ten First Day v3 scenes. Do not launch the old AM lesson.')
    }
    const expected = ['hello-school', 'skip-bunny', 'run-race', 'walk-school', 'big-grin',
      'school-bell', 'jump-frog', 'play-friends', 'enter-class', 'grade-one']
    for (const [index, scene] of scenes.entries()) {
      if (scene.activityKey !== 'class1-l01-v3-' + expected[index] ||
          scene.type !== 'CONVERSATION' || scene.metadata?.conversationMode !== 'OPEN' ||
          !scene.aiEnabled || !scene.allowMic ||
          !(typeof scene.content?.audioKey === 'string' && scene.content.audioKey.startsWith('class-01/level-01/v3/'))) {
        throw new Error('First Day v3 activity manifest mismatch at scene ' + (index + 1))
      }
    }

    console.log(JSON.stringify({
      status: 'PASS',
      authorizedDemoStudent: true,
      grade: lesson.grade,
      experienceId: lesson.experienceId,
      nextLessonResolved: true,
      activities: lesson.activities.length,
      completedActivities: lesson.completedActivityIds.length,
      curriculum: 'English Balbharati Grade One 1.1 My First Day',
      firstScene: scenes[0].activityKey,
      lastScene: scenes[9].activityKey,
      teachingMode: 'Priya/S3 prompts → Sarvam → local Qwen 8002 → Azure dynamic TTS',
      note: 'This read-only database check does not test live speech, approved intro media, Azure playback or student comprehension.',
      published: false,
    }, null, 2))
  } finally {
    await disconnectDatabase()
  }
}

main().catch((error: unknown) => {
  console.error('Class 1 configured-student smoke check failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
