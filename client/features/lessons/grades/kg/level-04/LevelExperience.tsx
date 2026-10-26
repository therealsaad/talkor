
'use client'

import { useRef, useState } from 'react'

const PICTURES = [
  { word: 'Queen', symbol: '👸' },
  { word: 'Rabbit', symbol: '🐇' },
  { word: 'Sun', symbol: '☀️' },
  { word: 'Tiger', symbol: '🐅' },
  { word: 'Umbrella', symbol: '☂️' },
  { word: 'Van', symbol: '🚐' },
]

type LessonPhase = 'teaching' | 'video' | 'video-complete'

export default function LevelExperience() {
  const [phase, setPhase] = useState<LessonPhase>('teaching')
  const [pictureIndex, setPictureIndex] = useState(0)
  const [videoError, setVideoError] = useState('')
  const [videoPlaying, setVideoPlaying] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const lastTimeRef = useRef(0)

  const picture = PICTURES[pictureIndex]

  async function playIntro() {
    if (!videoRef.current) return

    try {
      setVideoError('')
      await videoRef.current.play()
      setVideoPlaying(true)
    } catch {
      setVideoError(
        'Video play nahi ho raha. Video file ka path aur filename check karo.',
      )
    }
  }

  function handleSeeking() {
    const video = videoRef.current

    if (!video || !video.seeking) return

    if (Math.abs(video.currentTime - lastTimeRef.current) > 0.5) {
      video.currentTime = lastTimeRef.current
    }
  }

  return (
    <main className="min-h-screen bg-[#fff7ef] px-4 py-8 text-[#352822] sm:px-8">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-5 shadow-lg sm:p-8">
        <p className="font-semibold tracking-wide text-[#8f3625]">
          KINDERGARTEN · LEVEL 4
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Picture Words: Q–V ⭐
        </h1>

        {phase === 'teaching' && (
          <section className="mt-6">
            <h2 className="text-2xl font-bold">
              Meet the Pictures!
            </h2>

            <p className="mt-2">
              Let&apos;s explore the pictures with Miss Julie.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PICTURES.map((item, index) => (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => setPictureIndex(index)}
                  aria-pressed={pictureIndex === index}
                  className={`rounded-2xl border-2 p-4 text-center transition ${
                    pictureIndex === index
                      ? 'border-[#8f3625] bg-[#f5e6ca]'
                      : 'border-[#ead9c5] bg-[#fffaf4]'
                  }`}
                >
                  <span className="block text-5xl" aria-hidden="true">
                    {item.symbol}
                  </span>

                  <span className="mt-2 block font-bold">
                    {item.word}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-[#f5e6ca] p-6 text-center">
              <div className="text-7xl" aria-hidden="true">
                {picture.symbol}
              </div>

              <h2 className="mt-3 text-2xl font-bold">
                {picture.word}
              </h2>

              <p className="mt-2">
                Picture {pictureIndex + 1} of {PICTURES.length}
              </p>

              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  disabled={pictureIndex === 0}
                  onClick={() =>
                    setPictureIndex((index) => index - 1)
                  }
                  className="rounded-xl border border-[#8f3625] px-4 py-3 font-semibold disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pictureIndex < PICTURES.length - 1) {
                      setPictureIndex((index) => index + 1)
                    } else {
                      setPhase('video')
                    }
                  }}
                  className="rounded-xl bg-[#8f3625] px-5 py-3 font-semibold text-white"
                >
                  {pictureIndex === PICTURES.length - 1
                    ? 'Continue to video →'
                    : 'Next picture →'}
                </button>
              </div>
            </div>
          </section>
        )}

        {phase === 'video' && (
          <section className="mt-6">
            <h2 className="text-2xl font-bold">
              Watch the Intro Video
            </h2>

            <p className="mt-2">
              Video finish hone ke baad hi next section unlock hoga.
            </p>

            <video
              ref={videoRef}
              src="/lessons/kg/level-04/animal-sounds-intro.mp4"
              controls={false}
              playsInline
              preload="metadata"
              onTimeUpdate={(event) => {
                lastTimeRef.current = event.currentTarget.currentTime
              }}
              onSeeking={handleSeeking}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => {
                setVideoPlaying(false)
                setPhase('video-complete')
              }}
              onError={() => {
                setVideoError(
                  'Video load nahi hua. Filename aur public folder path check karo.',
                )
              }}
              className="mt-5 w-full rounded-2xl bg-black"
            />

            {!videoPlaying && (
              <button
                type="button"
                onClick={playIntro}
                className="mt-4 w-full rounded-xl bg-[#8f3625] px-5 py-4 font-bold text-white"
              >
                Play / Resume Video
              </button>
            )}

            {videoPlaying && (
              <p className="mt-4" role="status">
                Video chal raha hai. Please finish watching.
              </p>
            )}

            {videoError && (
              <p className="mt-4 text-red-700" role="alert">
                {videoError}
              </p>
            )}
          </section>
        )}

        {phase === 'video-complete' && (
          <section className="mt-6 rounded-2xl bg-[#f5e6ca] p-6">
            <h2 className="text-2xl font-bold">
              Well done! ⭐
            </h2>

            <p className="mt-3">
              Intro video complete ho gaya. Miss Julie ka microphone Q&amp;A
              abhi implement karna baaki hai.
            </p>
          </section>
        )}

        <p className="mt-8 border-t border-[#ead9c5] pt-4 text-sm text-[#76685e]">
          Staff preview only · Not published to students
        </p>
      </section>
    </main>
  )
}
