import { validGrade, validLevel, type ExplorerView } from './model'
import type { ExplorerProps } from './CurriculumExplorer'

export function explorerRouteOptions(
  query: Record<string, string | string[] | undefined>
): ExplorerProps {
  const text = (key: string) =>
    typeof query[key] === 'string' ? (query[key] as string) : undefined
  const grade = text('grade')
  const view = text('view')
  return {
    initialGrade: grade === 'all' ? 'all' : validGrade(grade),
    initialLevel: validLevel(text('level')),
    initialView: (view === 'coverage' || view === 'teaching'
      ? view
      : 'map') as ExplorerView,
    initialUnit: ['1', '2', '3', '4'].includes(text('unit') ?? '')
      ? text('unit')
      : 'all',
    initialSearch: (text('q') ?? '').slice(0, 120),
    initialSample: /^[\w.-]{1,100}$/.test(text('sample') ?? '')
      ? text('sample')
      : undefined,
    initialAddress: /^g(?:0\d|10)-l(?:0[1-9]|10)$/.test(text('address') ?? '')
      ? text('address')
      : undefined,
  }
}
