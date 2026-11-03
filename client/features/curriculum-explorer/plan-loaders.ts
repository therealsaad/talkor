import type {
  LevelActivity,
  LevelDesignConfig,
  SuggestedActivity,
} from '../lessons/types'

export interface WorkspacePlan {
  config: LevelDesignConfig
  activities: LevelActivity[]
  suggestedActivities: SuggestedActivity[]
}
function plan(
  config: () => Promise<{ config: LevelDesignConfig }>,
  activities: () => Promise<{
    activities: LevelActivity[]
    suggestedActivities: SuggestedActivity[]
  }>
): () => Promise<WorkspacePlan> {
  return async () => {
    const [definition, content] = await Promise.all([config(), activities()])
    return {
      config: definition.config,
      activities: content.activities,
      suggestedActivities: content.suggestedActivities,
    }
  }
}
/** Metadata only: importing a plan never imports or mounts a student lesson engine. */
export const PLAN_LOADERS: Readonly<
  Record<string, () => Promise<WorkspacePlan>>
> = {
  'g00-l01': plan(
    () => import('../lessons/grades/kg/level-01/config'),
    () => import('../lessons/grades/kg/level-01/activities')
  ),
  'g00-l02': plan(
    () => import('../lessons/grades/kg/level-02/config'),
    () => import('../lessons/grades/kg/level-02/activities')
  ),
  'g00-l03': plan(
    () => import('../lessons/grades/kg/level-03/config'),
    () => import('../lessons/grades/kg/level-03/activities')
  ),
  'g00-l04': plan(
    () => import('../lessons/grades/kg/level-04/config'),
    () => import('../lessons/grades/kg/level-04/activities')
  ),
  'g00-l05': plan(
    () => import('../lessons/grades/kg/level-05/config'),
    () => import('../lessons/grades/kg/level-05/activities')
  ),
  'g00-l06': plan(
    () => import('../lessons/grades/kg/level-06/config'),
    () => import('../lessons/grades/kg/level-06/activities')
  ),
  'g00-l07': plan(
    () => import('../lessons/grades/kg/level-07/config'),
    () => import('../lessons/grades/kg/level-07/activities')
  ),
  'g00-l08': plan(
    () => import('../lessons/grades/kg/level-08/config'),
    () => import('../lessons/grades/kg/level-08/activities')
  ),
  'g00-l09': plan(
    () => import('../lessons/grades/kg/level-09/config'),
    () => import('../lessons/grades/kg/level-09/activities')
  ),
  'g00-l10': plan(
    () => import('../lessons/grades/kg/level-10/config'),
    () => import('../lessons/grades/kg/level-10/activities')
  ),
  'g01-l01': plan(
    () => import('../lessons/grades/class-01/level-01/config'),
    () => import('../lessons/grades/class-01/level-01/activities')
  ),
  'g01-l02': plan(
    () => import('../lessons/grades/class-01/level-02/config'),
    () => import('../lessons/grades/class-01/level-02/activities')
  ),
  'g01-l03': plan(
    () => import('../lessons/grades/class-01/level-03/config'),
    () => import('../lessons/grades/class-01/level-03/activities')
  ),
  'g01-l04': plan(
    () => import('../lessons/grades/class-01/level-04/config'),
    () => import('../lessons/grades/class-01/level-04/activities')
  ),
  'g01-l05': plan(
    () => import('../lessons/grades/class-01/level-05/config'),
    () => import('../lessons/grades/class-01/level-05/activities')
  ),
  'g01-l06': plan(
    () => import('../lessons/grades/class-01/level-06/config'),
    () => import('../lessons/grades/class-01/level-06/activities')
  ),
  'g01-l07': plan(
    () => import('../lessons/grades/class-01/level-07/config'),
    () => import('../lessons/grades/class-01/level-07/activities')
  ),
  'g01-l08': plan(
    () => import('../lessons/grades/class-01/level-08/config'),
    () => import('../lessons/grades/class-01/level-08/activities')
  ),
  'g01-l09': plan(
    () => import('../lessons/grades/class-01/level-09/config'),
    () => import('../lessons/grades/class-01/level-09/activities')
  ),
  'g01-l10': plan(
    () => import('../lessons/grades/class-01/level-10/config'),
    () => import('../lessons/grades/class-01/level-10/activities')
  ),
  'g02-l01': plan(
    () => import('../lessons/grades/class-02/level-01/config'),
    () => import('../lessons/grades/class-02/level-01/activities')
  ),
  'g02-l02': plan(
    () => import('../lessons/grades/class-02/level-02/config'),
    () => import('../lessons/grades/class-02/level-02/activities')
  ),
  'g02-l03': plan(
    () => import('../lessons/grades/class-02/level-03/config'),
    () => import('../lessons/grades/class-02/level-03/activities')
  ),
  'g02-l04': plan(
    () => import('../lessons/grades/class-02/level-04/config'),
    () => import('../lessons/grades/class-02/level-04/activities')
  ),
  'g02-l05': plan(
    () => import('../lessons/grades/class-02/level-05/config'),
    () => import('../lessons/grades/class-02/level-05/activities')
  ),
  'g02-l06': plan(
    () => import('../lessons/grades/class-02/level-06/config'),
    () => import('../lessons/grades/class-02/level-06/activities')
  ),
  'g02-l07': plan(
    () => import('../lessons/grades/class-02/level-07/config'),
    () => import('../lessons/grades/class-02/level-07/activities')
  ),
  'g02-l08': plan(
    () => import('../lessons/grades/class-02/level-08/config'),
    () => import('../lessons/grades/class-02/level-08/activities')
  ),
  'g02-l09': plan(
    () => import('../lessons/grades/class-02/level-09/config'),
    () => import('../lessons/grades/class-02/level-09/activities')
  ),
  'g02-l10': plan(
    () => import('../lessons/grades/class-02/level-10/config'),
    () => import('../lessons/grades/class-02/level-10/activities')
  ),
  'g03-l01': plan(
    () => import('../lessons/grades/class-03/level-01/config'),
    () => import('../lessons/grades/class-03/level-01/activities')
  ),
  'g03-l02': plan(
    () => import('../lessons/grades/class-03/level-02/config'),
    () => import('../lessons/grades/class-03/level-02/activities')
  ),
  'g03-l03': plan(
    () => import('../lessons/grades/class-03/level-03/config'),
    () => import('../lessons/grades/class-03/level-03/activities')
  ),
  'g03-l04': plan(
    () => import('../lessons/grades/class-03/level-04/config'),
    () => import('../lessons/grades/class-03/level-04/activities')
  ),
  'g03-l05': plan(
    () => import('../lessons/grades/class-03/level-05/config'),
    () => import('../lessons/grades/class-03/level-05/activities')
  ),
  'g03-l06': plan(
    () => import('../lessons/grades/class-03/level-06/config'),
    () => import('../lessons/grades/class-03/level-06/activities')
  ),
  'g03-l07': plan(
    () => import('../lessons/grades/class-03/level-07/config'),
    () => import('../lessons/grades/class-03/level-07/activities')
  ),
  'g03-l08': plan(
    () => import('../lessons/grades/class-03/level-08/config'),
    () => import('../lessons/grades/class-03/level-08/activities')
  ),
  'g03-l09': plan(
    () => import('../lessons/grades/class-03/level-09/config'),
    () => import('../lessons/grades/class-03/level-09/activities')
  ),
  'g03-l10': plan(
    () => import('../lessons/grades/class-03/level-10/config'),
    () => import('../lessons/grades/class-03/level-10/activities')
  ),
  'g04-l01': plan(
    () => import('../lessons/grades/class-04/level-01/config'),
    () => import('../lessons/grades/class-04/level-01/activities')
  ),
  'g04-l02': plan(
    () => import('../lessons/grades/class-04/level-02/config'),
    () => import('../lessons/grades/class-04/level-02/activities')
  ),
  'g04-l03': plan(
    () => import('../lessons/grades/class-04/level-03/config'),
    () => import('../lessons/grades/class-04/level-03/activities')
  ),
  'g04-l04': plan(
    () => import('../lessons/grades/class-04/level-04/config'),
    () => import('../lessons/grades/class-04/level-04/activities')
  ),
  'g04-l05': plan(
    () => import('../lessons/grades/class-04/level-05/config'),
    () => import('../lessons/grades/class-04/level-05/activities')
  ),
  'g04-l06': plan(
    () => import('../lessons/grades/class-04/level-06/config'),
    () => import('../lessons/grades/class-04/level-06/activities')
  ),
  'g04-l07': plan(
    () => import('../lessons/grades/class-04/level-07/config'),
    () => import('../lessons/grades/class-04/level-07/activities')
  ),
  'g04-l08': plan(
    () => import('../lessons/grades/class-04/level-08/config'),
    () => import('../lessons/grades/class-04/level-08/activities')
  ),
  'g04-l09': plan(
    () => import('../lessons/grades/class-04/level-09/config'),
    () => import('../lessons/grades/class-04/level-09/activities')
  ),
  'g04-l10': plan(
    () => import('../lessons/grades/class-04/level-10/config'),
    () => import('../lessons/grades/class-04/level-10/activities')
  ),
  'g05-l01': plan(
    () => import('../lessons/grades/class-05/level-01/config'),
    () => import('../lessons/grades/class-05/level-01/activities')
  ),
  'g05-l02': plan(
    () => import('../lessons/grades/class-05/level-02/config'),
    () => import('../lessons/grades/class-05/level-02/activities')
  ),
  'g05-l03': plan(
    () => import('../lessons/grades/class-05/level-03/config'),
    () => import('../lessons/grades/class-05/level-03/activities')
  ),
  'g05-l04': plan(
    () => import('../lessons/grades/class-05/level-04/config'),
    () => import('../lessons/grades/class-05/level-04/activities')
  ),
  'g05-l05': plan(
    () => import('../lessons/grades/class-05/level-05/config'),
    () => import('../lessons/grades/class-05/level-05/activities')
  ),
  'g05-l06': plan(
    () => import('../lessons/grades/class-05/level-06/config'),
    () => import('../lessons/grades/class-05/level-06/activities')
  ),
  'g05-l07': plan(
    () => import('../lessons/grades/class-05/level-07/config'),
    () => import('../lessons/grades/class-05/level-07/activities')
  ),
  'g05-l08': plan(
    () => import('../lessons/grades/class-05/level-08/config'),
    () => import('../lessons/grades/class-05/level-08/activities')
  ),
  'g05-l09': plan(
    () => import('../lessons/grades/class-05/level-09/config'),
    () => import('../lessons/grades/class-05/level-09/activities')
  ),
  'g05-l10': plan(
    () => import('../lessons/grades/class-05/level-10/config'),
    () => import('../lessons/grades/class-05/level-10/activities')
  ),
  'g06-l01': plan(
    () => import('../lessons/grades/class-06/level-01/config'),
    () => import('../lessons/grades/class-06/level-01/activities')
  ),
  'g06-l02': plan(
    () => import('../lessons/grades/class-06/level-02/config'),
    () => import('../lessons/grades/class-06/level-02/activities')
  ),
  'g06-l03': plan(
    () => import('../lessons/grades/class-06/level-03/config'),
    () => import('../lessons/grades/class-06/level-03/activities')
  ),
  'g06-l04': plan(
    () => import('../lessons/grades/class-06/level-04/config'),
    () => import('../lessons/grades/class-06/level-04/activities')
  ),
  'g06-l05': plan(
    () => import('../lessons/grades/class-06/level-05/config'),
    () => import('../lessons/grades/class-06/level-05/activities')
  ),
  'g06-l06': plan(
    () => import('../lessons/grades/class-06/level-06/config'),
    () => import('../lessons/grades/class-06/level-06/activities')
  ),
  'g06-l07': plan(
    () => import('../lessons/grades/class-06/level-07/config'),
    () => import('../lessons/grades/class-06/level-07/activities')
  ),
  'g06-l08': plan(
    () => import('../lessons/grades/class-06/level-08/config'),
    () => import('../lessons/grades/class-06/level-08/activities')
  ),
  'g06-l09': plan(
    () => import('../lessons/grades/class-06/level-09/config'),
    () => import('../lessons/grades/class-06/level-09/activities')
  ),
  'g06-l10': plan(
    () => import('../lessons/grades/class-06/level-10/config'),
    () => import('../lessons/grades/class-06/level-10/activities')
  ),
  'g07-l01': plan(
    () => import('../lessons/grades/class-07/level-01/config'),
    () => import('../lessons/grades/class-07/level-01/activities')
  ),
  'g07-l02': plan(
    () => import('../lessons/grades/class-07/level-02/config'),
    () => import('../lessons/grades/class-07/level-02/activities')
  ),
  'g07-l03': plan(
    () => import('../lessons/grades/class-07/level-03/config'),
    () => import('../lessons/grades/class-07/level-03/activities')
  ),
  'g07-l04': plan(
    () => import('../lessons/grades/class-07/level-04/config'),
    () => import('../lessons/grades/class-07/level-04/activities')
  ),
  'g07-l05': plan(
    () => import('../lessons/grades/class-07/level-05/config'),
    () => import('../lessons/grades/class-07/level-05/activities')
  ),
  'g07-l06': plan(
    () => import('../lessons/grades/class-07/level-06/config'),
    () => import('../lessons/grades/class-07/level-06/activities')
  ),
  'g07-l07': plan(
    () => import('../lessons/grades/class-07/level-07/config'),
    () => import('../lessons/grades/class-07/level-07/activities')
  ),
  'g07-l08': plan(
    () => import('../lessons/grades/class-07/level-08/config'),
    () => import('../lessons/grades/class-07/level-08/activities')
  ),
  'g07-l09': plan(
    () => import('../lessons/grades/class-07/level-09/config'),
    () => import('../lessons/grades/class-07/level-09/activities')
  ),
  'g07-l10': plan(
    () => import('../lessons/grades/class-07/level-10/config'),
    () => import('../lessons/grades/class-07/level-10/activities')
  ),
  'g08-l01': plan(
    () => import('../lessons/grades/class-08/level-01/config'),
    () => import('../lessons/grades/class-08/level-01/activities')
  ),
  'g08-l02': plan(
    () => import('../lessons/grades/class-08/level-02/config'),
    () => import('../lessons/grades/class-08/level-02/activities')
  ),
  'g08-l03': plan(
    () => import('../lessons/grades/class-08/level-03/config'),
    () => import('../lessons/grades/class-08/level-03/activities')
  ),
  'g08-l04': plan(
    () => import('../lessons/grades/class-08/level-04/config'),
    () => import('../lessons/grades/class-08/level-04/activities')
  ),
  'g08-l05': plan(
    () => import('../lessons/grades/class-08/level-05/config'),
    () => import('../lessons/grades/class-08/level-05/activities')
  ),
  'g08-l06': plan(
    () => import('../lessons/grades/class-08/level-06/config'),
    () => import('../lessons/grades/class-08/level-06/activities')
  ),
  'g08-l07': plan(
    () => import('../lessons/grades/class-08/level-07/config'),
    () => import('../lessons/grades/class-08/level-07/activities')
  ),
  'g08-l08': plan(
    () => import('../lessons/grades/class-08/level-08/config'),
    () => import('../lessons/grades/class-08/level-08/activities')
  ),
  'g08-l09': plan(
    () => import('../lessons/grades/class-08/level-09/config'),
    () => import('../lessons/grades/class-08/level-09/activities')
  ),
  'g08-l10': plan(
    () => import('../lessons/grades/class-08/level-10/config'),
    () => import('../lessons/grades/class-08/level-10/activities')
  ),
  'g09-l01': plan(
    () => import('../lessons/grades/class-09/level-01/config'),
    () => import('../lessons/grades/class-09/level-01/activities')
  ),
  'g09-l02': plan(
    () => import('../lessons/grades/class-09/level-02/config'),
    () => import('../lessons/grades/class-09/level-02/activities')
  ),
  'g09-l03': plan(
    () => import('../lessons/grades/class-09/level-03/config'),
    () => import('../lessons/grades/class-09/level-03/activities')
  ),
  'g09-l04': plan(
    () => import('../lessons/grades/class-09/level-04/config'),
    () => import('../lessons/grades/class-09/level-04/activities')
  ),
  'g09-l05': plan(
    () => import('../lessons/grades/class-09/level-05/config'),
    () => import('../lessons/grades/class-09/level-05/activities')
  ),
  'g09-l06': plan(
    () => import('../lessons/grades/class-09/level-06/config'),
    () => import('../lessons/grades/class-09/level-06/activities')
  ),
  'g09-l07': plan(
    () => import('../lessons/grades/class-09/level-07/config'),
    () => import('../lessons/grades/class-09/level-07/activities')
  ),
  'g09-l08': plan(
    () => import('../lessons/grades/class-09/level-08/config'),
    () => import('../lessons/grades/class-09/level-08/activities')
  ),
  'g09-l09': plan(
    () => import('../lessons/grades/class-09/level-09/config'),
    () => import('../lessons/grades/class-09/level-09/activities')
  ),
  'g09-l10': plan(
    () => import('../lessons/grades/class-09/level-10/config'),
    () => import('../lessons/grades/class-09/level-10/activities')
  ),
  'g10-l01': plan(
    () => import('../lessons/grades/class-10/level-01/config'),
    () => import('../lessons/grades/class-10/level-01/activities')
  ),
  'g10-l02': plan(
    () => import('../lessons/grades/class-10/level-02/config'),
    () => import('../lessons/grades/class-10/level-02/activities')
  ),
  'g10-l03': plan(
    () => import('../lessons/grades/class-10/level-03/config'),
    () => import('../lessons/grades/class-10/level-03/activities')
  ),
  'g10-l04': plan(
    () => import('../lessons/grades/class-10/level-04/config'),
    () => import('../lessons/grades/class-10/level-04/activities')
  ),
  'g10-l05': plan(
    () => import('../lessons/grades/class-10/level-05/config'),
    () => import('../lessons/grades/class-10/level-05/activities')
  ),
  'g10-l06': plan(
    () => import('../lessons/grades/class-10/level-06/config'),
    () => import('../lessons/grades/class-10/level-06/activities')
  ),
  'g10-l07': plan(
    () => import('../lessons/grades/class-10/level-07/config'),
    () => import('../lessons/grades/class-10/level-07/activities')
  ),
  'g10-l08': plan(
    () => import('../lessons/grades/class-10/level-08/config'),
    () => import('../lessons/grades/class-10/level-08/activities')
  ),
  'g10-l09': plan(
    () => import('../lessons/grades/class-10/level-09/config'),
    () => import('../lessons/grades/class-10/level-09/activities')
  ),
  'g10-l10': plan(
    () => import('../lessons/grades/class-10/level-10/config'),
    () => import('../lessons/grades/class-10/level-10/activities')
  ),
}

export async function loadGradePlans(grade: number): Promise<WorkspacePlan[]> {
  if (!Number.isInteger(grade) || grade < 0 || grade > 10)
    throw new Error('Invalid curriculum class')
  return Promise.all(
    Array.from({ length: 10 }, (_, index) => {
      const id = `g${String(grade).padStart(2, '0')}-l${String(index + 1).padStart(2, '0')}`
      return PLAN_LOADERS[id]()
    })
  )
}
