'use client'

import Link from 'next/link'
import { currentStudent } from '@/services/mock-data'
import { ActivityEngine } from '@/components/lessons/activity-engine'
import { mockActivities, mockLevels } from '@/services/lessons'
import type { ActivityItem } from '@/services/curriculum-service'
import { dailyAdventure, reviewQueue, studentAchievements } from '@/services/student-experience'
import { AnimatedMissJulie, CartoonCompanions } from '@/components/miss-julie/animated-character'

const missJulie = '/miss-julie-portrait.png'

function SceneProps({ type = 'courtyard' }: { type?: 'courtyard' | 'classroom' | 'map' | 'celebration' }) {
  return <div className={`scene-props props-${type}`} aria-hidden="true"><span className="cloud cloud-a" /><span className="cloud cloud-b" /><span className="sun-dot" /><span className="tree tree-left" /><span className="tree tree-right" /><span className="bush bush-a" /><span className="bush bush-b" /><span className="flower flower-a" /><span className="flower flower-b" /><span className="butterfly butterfly-a">+</span><span className="butterfly butterfly-b">+</span><span className="bird bird-a">Tiko</span>{type === 'classroom' && <><span className="chalkboard" /><span className="desk desk-a" /><span className="desk desk-b" /><span className="window" /><span className="book-stack" /></>}{type === 'map' && <><span className="hill hill-a" /><span className="hill hill-b" /><span className="map-road" /></>}{type === 'celebration' && <><span className="banner" /><span className="confetti confetti-a" /><span className="confetti confetti-b" /></>}</div>
}

function WorldShell({ children, type = 'courtyard', title, subtitle, compact = false }: { children: React.ReactNode; type?: 'courtyard' | 'classroom' | 'map' | 'celebration'; title: string; subtitle: string; compact?: boolean }) {
  return <div className={`world-screen world-${type} ${compact ? 'world-compact' : ''}`}><SceneProps type={type} />{!compact && <div className="world-copy"><span className="world-kicker">Talkora world · Class 4</span><h1>{title}</h1><p>{subtitle}</p></div>}{children}<nav className="world-nav"><Link href="/student/home">Home</Link><Link className="learn-active" href="/student/classes">Learn</Link><Link href="/student/progress">Progress</Link><Link href="/student/rewards">Rewards</Link><Link href="/student/profile">Profile</Link></nav></div>
}

export function StudentWorldDashboard() {
  const firstName = currentStudent.fullName.split(' ')[0]
  return <WorldShell title={`Hi ${firstName}!`} subtitle="Your Talkora adventure is ready. Pick a mission, earn stickers, and keep your word streak alive."><AnimatedMissJulie message="You are doing brilliantly! Ready for your next adventure?" /><CartoonCompanions /><div className="speech-bubble" aria-live="polite">You are doing brilliantly!<small>Miss Julie · tap me to hear your coach</small></div><div className="town-landmarks" aria-label="Talkora Town learning places"><Link className="town-landmark landmark-school" href="/student/levels"><span className="landmark-roof" /><strong>Talkora School</strong><small>Learn new words</small></Link><Link className="town-landmark landmark-garden" href="/student/practice"><span className="landmark-tree" /><strong>Word Garden</strong><small>Practice powers</small></Link><Link className="town-landmark landmark-booth" href="/student/practice"><span className="landmark-booth-shape">MIC</span><strong>Speaking Studio</strong><small>Find your voice</small></Link><Link className="town-landmark landmark-shop" href="/student/rewards"><span className="landmark-chest">XP</span><strong>Reward Shop</strong><small>Open your prizes</small></Link></div><main className="home-base student-home-grid"><section className="adventure-board mission-card"><div className="mission-topline"><span className="board-label">Today&apos;s mission</span><b>{dailyAdventure.reward}</b></div><h2>{dailyAdventure.title}</h2><p>{dailyAdventure.subtitle}</p><div className="mission-progress"><span style={{ width: `${dailyAdventure.progress / dailyAdventure.total * 100}%` }} /></div><div className="mission-meta"><span>{dailyAdventure.progress}/{dailyAdventure.total} clues found</span><span>{dailyAdventure.minutes}</span></div><Link className="world-button" href="/student/lesson/1">Continue mission</Link></section><section className="student-stats-card"><div><span>Streak</span><strong>5</strong><small>days in a row</small></div><div><span>Word XP</span><strong>120</strong><small>to next badge</small></div><div><span>Town rank</span><strong>4</strong><small>worlds opened</small></div></section><section className="review-card"><div className="section-head"><div><span className="board-label">Quick review</span><h2>Words asking for another high-five</h2></div><Link href="/student/lesson/1">Practice all</Link></div><div className="review-words">{reviewQueue.map((item) => <button className={`review-word ${item.color}`} key={item.word} onClick={() => undefined}><strong>{item.word}</strong><span>{item.meaning}</span><small>Say: {item.sound}</small></button>)}</div></section><section className="sticker-card"><div className="section-head"><div><span className="board-label">Sticker book</span><h2>Your wins</h2></div><Link href="/student/rewards">See all</Link></div><div className="sticker-row">{studentAchievements.map((achievement) => <div className={`sticker ${achievement.unlocked ? 'unlocked' : 'locked'}`} key={achievement.id}><b>{achievement.title.slice(0, 1)}</b><span>{achievement.title}</span></div>)}</div></section></main></WorldShell>
}

export function ClassWorld() { return <WorldShell type="map" title="Welcome to Talkora Town" subtitle="Pick a mission and help Miss Julie unlock the next part of the story." ><main className="map-board"><div className="map-sign">CLASS 4<br /><strong>MISSION MAP</strong><small>10 worlds · 80 mini-games</small></div><div className="town-banner"><span>Miss Julie&apos;s mission</span><strong>Find the golden word!</strong><small>Finish each checkpoint to open a new town.</small></div><div className="world-level-path">{mockLevels.map((level, index) => <Link key={level.id} href={level.status === 'locked' ? '#' : `/student/levels/${level.number}`} className={`world-level-node ${level.status}`} style={{ left: `${18 + (index % 2) * 64}%`, top: `${23 + Math.floor(index / 2) * 18}%` }}><span>{level.status === 'in-progress' ? '▶' : level.status === 'available' ? level.number : level.status === 'complete' ? '★' : 'LOCKED'}</span><b>World {level.number}: {level.title}</b><small>{level.place}</small><em>{level.status === 'locked' ? 'Earn stars to open' : level.status === 'complete' ? 'Badge earned' : level.status === 'in-progress' ? 'Continue mission' : 'New mission'}</em></Link>)}</div></main></WorldShell> }

export function LevelWorld({ id }: { id: string }) { const level = mockLevels.find((item) => item.id === id || String(item.number) === id) ?? mockLevels[0]; return <WorldShell type="classroom" title={level.title} subtitle={`${level.place} · Level ${level.number} of 10`}><div className="world-character teacher-character"><img src={missJulie} alt="Miss Julie teaching in the classroom" /></div><div className="lesson-sign"><span>Talkora classroom</span><h2>{level.title}</h2><p>{level.description}</p><div className="stars-row">★ ★ ★</div><Link className="world-button" href={`/student/lesson/${level.number}`}>Enter lesson</Link></div></WorldShell> }

// export function LessonWorld({ id }: { id: string }) { const activities = mockActivities.filter((activity) => activity.lessonId === `lesson-${id}`); const lessonActivities: ActivityItem[] = (activities.length ? activities : mockActivities.slice(0, 8)).map((activity, index) => ({ ...activity, order: index + 1, difficulty: 'easy', estimatedSeconds: 30, voiceEnabled: true, aiEnabled: true })); return <WorldShell type="classroom" compact title="" subtitle=""><AnimatedMissJulie message="Listen carefully, then try the word with me!" /><div className="world-character teacher-character small"><img src={missJulie} alt="Miss Julie guiding the lesson" /></div><div className="activity-stage"><ActivityEngine activities={lessonActivities} /></div></WorldShell> }


export function LessonWorld({
  id,
}: {
  id: string
}) {
  const activities =
    mockActivities.filter(
      (activity) =>
        activity.lessonId ===
        `lesson-${id}`,
    )

  const lessonActivities =
    (
      activities.length
        ? activities
        : mockActivities.slice(
            0,
            8,
          )
    ).map(
      (
        activity,
        index,
      ) => ({
        ...activity,

        order:
          index + 1,

        stage:
          'PRACTICE_ZONE',

        difficulty:
          'easy',

        estimatedSeconds:
          30,

        voiceEnabled:
          true,

        aiEnabled:
          true,

        allowMic:
          true,
      }),
    ) as unknown as ActivityItem[]

  return (
    <WorldShell
      type="classroom"
      compact
      title=""
      subtitle=""
    >
      <AnimatedMissJulie
        message="Listen carefully, then try the word with me!"
      />

      <div className="world-character teacher-character small">
        <img
          src={missJulie}
          alt="Miss Julie guiding the lesson"
        />
      </div>

      <div className="activity-stage">
        <ActivityEngine
          activities={
            lessonActivities
          }
        />
      </div>
    </WorldShell>
  )
}
export function CompletionWorld() { return <WorldShell type="celebration" title="Level complete!" subtitle="You explored, practiced, and found your English voice."><div className="completion-card"><div className="big-stars">★ ★ ★</div><strong>Fantastic work!</strong><p>+20 XP · New activity unlocked</p><Link className="world-button" href="/student/levels">Continue the journey</Link></div></WorldShell> }
