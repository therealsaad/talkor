'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, Star, Trophy } from 'lucide-react'
import { kgRewardsService, type KGRewardCollection } from '@/services/kg-rewards-service'
import { KGRewardCelebration } from './KGRewardCelebration'
import './kg-reward-collection.css'

export function KGRewardCollectionShelf() {
  const router = useRouter()
  const [collection, setCollection] = useState<KGRewardCollection | null>(null)
  const [celebrationLevel, setCelebrationLevel] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void kgRewardsService.mine().then((result) => {
      if (active) {
        setCollection(result)
        if (result.newlyAwardedLevels.length) setCelebrationLevel(Math.max(...result.newlyAwardedLevels))
      }
    }).catch(() => {
      if (active) setError('Your stars could not load right now. Please try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <main className="kg-reward-shelf">
      <header className="kg-reward-shelf__header">
        <div><span>MISS JULIE&apos;S REWARD GARDEN</span><h1>My KG Stars</h1><p>Every star celebrates a level you completed.</p></div>
        <div className="kg-reward-shelf__counter" aria-label={collection ? `${collection.totalStars} of 5 stars earned` : 'Your star total'}>
          <Star size={27} fill="currentColor" /><strong>{collection?.totalStars ?? 0}<small>/5</small></strong>
        </div>
      </header>

      {loading ? <p className="kg-reward-shelf__message" role="status">Opening your reward garden…</p> : null}
      {error ? <p className="kg-reward-shelf__error" role="alert">{error}</p> : null}
      {collection ? <>
        <div className="kg-reward-shelf__progress" aria-label={`${collection.totalStars} of 5 level rewards earned`}>
          <span style={{ width: `${collection.totalStars * 20}%` }} />
        </div>
        <section className="kg-reward-shelf__levels" aria-label="KG level rewards">
          {collection.levels.map((item) => <article className={`kg-reward-shelf__level ${item.starEarned ? 'is-earned' : 'is-locked'}`} key={item.level}>
            <div className="kg-reward-shelf__icon" aria-hidden="true">{item.starEarned ? <Star size={29} fill="currentColor" /> : <LockKeyhole size={25} />}</div>
            <div><span>KG LEVEL {item.level}</span><h2>{item.title}</h2><p>{item.starEarned ? 'Star earned!' : item.completed ? 'Level complete · star syncing' : 'Complete this level to earn a star'}</p>
              {item.awardedAt ? <time dateTime={item.awardedAt}>Earned {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(item.awardedAt))}</time> : null}
            </div>
          </article>)}
        </section>
        <section className={`kg-reward-shelf__champion ${collection.championUnlocked ? 'is-unlocked' : 'is-locked'}`} aria-label="KG Champion trophy">
          <div className="kg-reward-shelf__trophy"><Trophy size={42} fill={collection.championUnlocked ? 'currentColor' : 'none'} /></div>
          <div><span>THE BIG ADVENTURE REWARD</span><h2>KG Champion</h2><p>{collection.championUnlocked ? 'You completed all five KG levels. Your golden trophy is yours!' : 'Earn all five level stars to unlock your trophy.'}</p></div>
          {!collection.championUnlocked ? <LockKeyhole className="kg-reward-shelf__trophy-lock" size={23} /> : null}
        </section>
        <aside className="kg-reward-shelf__julie">
          <Image src={collection.championUnlocked ? '/miss-julie/celebrating.webp' : '/miss-julie/welcome.webp'} alt="Miss Julie cheering for your learning" width={94} height={118} />
          <p>{collection.championUnlocked ? 'You did it! I am so proud of your KG adventure!' : 'Keep learning one level at a time. I am cheering for you!'}</p>
        </aside>
      </> : null}
      {collection && celebrationLevel !== null ? <KGRewardCelebration
        level={celebrationLevel}
        reward={collection}
        onContinue={() => { setCelebrationLevel(null); router.push('/student/kg/map') }}
        onDismiss={() => setCelebrationLevel(null)}
      /> : null}
    </main>
  )
}
