'use client'

import Link from 'next/link'
import { mockLevels } from '@/services/lessons'
import { worldFor } from '@/services/world-catalog'

const levelStories: Record<number, { icon: string; color: string; objective: string; welcome: string; skills: string[] }> = {
  1: { icon: 'GROW', color: '#b8e94e', objective: 'Grow a strong base of everyday English words.', welcome: 'Welcome to the Word Garden! We will spot, hear, build, and say new words together.', skills: ['20 new words', 'Listen & recognise', 'Spell it', 'Build a sentence', 'Speak with me'] },
  2: { icon: 'BUILD', color: '#28b8ff', objective: 'Turn your new words into clear, confident sentences.', welcome: 'School Street is full of clues. Let us put every word in the right place!', skills: ['School words', 'Sentence building', 'Reading', 'Speaking'] },
  3: { icon: 'TALK', color: '#ff7a3d', objective: 'Use English to talk about food, choices, and likes.', welcome: 'Welcome to Food Market! Tell me what you like and what you would choose.', skills: ['Food words', 'Likes & dislikes', 'Listening', 'Conversation'] },
  4: { icon: 'SAY', color: '#ff4fa3', objective: 'Practice everyday conversations with your voice.', welcome: 'This is the Speaking Studio. Take a breath — your voice belongs here.', skills: ['Conversation', 'Pronunciation', 'Speaking', 'Confidence'] },
  5: { icon: 'READ', color: '#8b5cf6', objective: 'Read stories, understand clues, and share what happened.', welcome: 'Story Forest is full of adventures. We will read one together and find its secret.', skills: ['Reading', 'Comprehension', 'New words', 'Tell a story'] },
}

export function AdventureLevelDetail({ id }: { id: string }) {
  const level = mockLevels.find((item) => item.id === id || String(item.number) === id) ?? mockLevels[0]
  const story = levelStories[level.number] ?? { icon: 'QUEST', color: '#ffd83d', objective: 'Bring together everything you have learned so far.', welcome: `Welcome to ${level.title}! Your next English adventure is ready.`, skills: ['Vocabulary', 'Grammar', 'Listening', 'Speaking'] }
  const isComplete = level.status === 'complete'
  const progress = isComplete ? 100 : level.status === 'in-progress' ? 38 : 0
  const world = worldFor(level)

  return (
    <div className="world-screen world-classroom" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
      <div className="scene-props props-classroom" aria-hidden="true"><span className="cloud cloud-a" /><span className="cloud cloud-b" /><span className="tree tree-left" /><span className="tree tree-right" /><span className="chalkboard" /><span className="window" /></div>
      <div className="world-copy"><span className="world-kicker">Level {level.number} of 10 · {level.place}</span><h1>{level.title}</h1><p>Find out what is waiting for you before you step into this adventure.</p></div>
      <main className="level-briefing" style={{ '--level-color': story.color } as React.CSSProperties}>
        <section className="level-hero-object"><span>{story.icon}</span><small>Level {level.number}</small></section>
        <section className="level-briefing-copy"><span className="level-eyebrow">{level.place} · Your next destination</span><h2>{level.title}</h2><p className="level-objective">{story.objective}</p><div className="level-dialogue"><img src="/miss-julie/welcome.png" alt="Miss Julie" /><p>“{story.welcome}”</p></div><div className="level-progress-label"><span>Your progress</span><b>{progress}%</b></div><div className="level-progress-bar"><i style={{ width: `${progress}%` }} /></div><Link className="world-button" href={`/student/lesson/${level.number}`}>{isComplete ? 'Play again' : progress ? 'Continue adventure' : 'Start adventure'}</Link></section>
        <section className="level-skills"><span>On this adventure · {world.lessons.length} lessons</span><div>{world.lessons.map((lesson, index) => <b key={lesson}><i>{index + 1}</i>{lesson}</b>)}</div><small>Each lesson teaches first, then lets you practise with Miss Julie.</small></section>
      </main>
      <nav className="world-nav" aria-label="Student Navigation"><Link href="/student/home">Home</Link><Link className="learn-active" href="/student/levels">Adventure Map</Link><Link href="/student/practice">Practice</Link><Link href="/student/rewards">Rewards</Link><Link href="/student/profile">Profile</Link></nav>
    </div>
  )
}
