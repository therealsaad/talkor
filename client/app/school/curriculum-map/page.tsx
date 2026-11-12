import { CurriculumExplorerPage } from '@/features/curriculum-explorer/CurriculumExplorer'
import { explorerRouteOptions } from '@/features/curriculum-explorer/route-options'

export default async function SchoolCurriculumMapPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CurriculumExplorerPage {...explorerRouteOptions(await searchParams)} />
}
