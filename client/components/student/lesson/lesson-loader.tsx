export function LessonLoader({ message = 'Preparing your next adventure...' }: { message?: string }) {
  return (
    <main className="lesson-loader-screen" role="status" aria-live="polite">
      <div className="lesson-loader-badge">T</div>
      <strong>TALKORA</strong>
      <p>{message}</p>
    </main>
  )
}
