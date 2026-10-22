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
    const guided = lesson.activities.find((activity) => activity.activityKey === 'class1-l01-repeat-at')
    if (!guided || guided.type !== 'CONVERSATION' || guided.metadata?.conversationMode !== 'OPEN') {
      throw new Error('The guided Qwen activity is not correctly configured.')
    }

    console.log(JSON.stringify({
      status: 'PASS',
      authorizedDemoStudent: true,
      grade: lesson.grade,
      experienceId: lesson.experienceId,
      nextLessonResolved: true,
      activities: lesson.activities.length,
      completedActivities: lesson.completedActivityIds.length,
      guidedActivity: {
        key: guided.activityKey,
        type: guided.type,
        stage: guided.stage,
        aiEnabled: guided.aiEnabled,
        conversationMode: guided.metadata?.conversationMode,
      },
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
