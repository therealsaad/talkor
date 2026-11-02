'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { KGCompletedLevelReview, type KGReviewLevel } from '@/features/lessons/grades/kg/review/CompletedLevelReview'

/** Server endpoints authorize the student AND verify a saved completion.
 * A user-modified URL can never open future or unfinished KG levels.
 */
export default function CompletedKGLevelReviewPage() {
  const params = useParams<{ level: string }>()
  const value = params.level
  if (!/^[2-5]$/.test(value)) {
    return <main role="alert" style={{ padding: 32 }}>
      <h1>This revision level is not available.</h1>
      <Link href="/student/kg/map">Back to my learning garden</Link>
    </main>
  }
  return <KGCompletedLevelReview level={Number(value) as KGReviewLevel} />
}
