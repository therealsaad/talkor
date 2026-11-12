import manifest from './level-design-manifest.json'
import { GRADE_ROADMAP } from './roadmap'

/**
 * Staff editorial designs provide visual metadata only.
 * They NEVER publish, unlock, or advance student levels.
 *
 * The curriculum roadmap is the canonical source
 * for lesson IDs and titles.
 */

const catalog = new Map(
  manifest.map((item) => [item.id, item])
)

const roadmap = new Map(
  GRADE_ROADMAP.map((entry) => [entry.id, entry])
)

export function studioDesignForLevel(
  grade: number,
  level: number
) {
  if (
    !Number.isInteger(grade) ||
    grade < 0 ||
    grade > 10 ||
    !Number.isInteger(level) ||
    level < 1 ||
    level > 10
  ) {
    return null
  }

  const id =
    `g${String(grade).padStart(2, '0')}` +
    `-l${String(level).padStart(2, '0')}`

  const design = catalog.get(id)
  const curriculum = roadmap.get(id)

  if (!design || !curriculum) {
    return null
  }

  return {
    ...design,
    title: curriculum.title,
  }
}