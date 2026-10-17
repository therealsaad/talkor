'use client'

import Link from 'next/link'

import {
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  AnimatePresence,
  motion,
} from 'framer-motion'

import {
  Brain,
  Check,
  ChevronRight,
  Mic,
  Sparkles,
  Star,
  Volume2,
} from 'lucide-react'

import type {
  ActivityItem,
} from '@/services/curriculum-service'

import {
  voiceService,
} from '@/services/voice-service'

import {
  useMissJulieVoice,
} from '@/hooks/use-miss-julie-voice'

import {
  LessonHud,
} from '@/components/student/lesson/lesson-hud'

import {
  LessonWorld,
} from '@/components/student/lesson/lesson-world'

import {
  ConversationStage,
} from '@/components/student/lesson/conversation-stage'

import {
  OptionTile,
} from '@/components/student/lesson/option-tile'

import {
  MicrophoneControl,
} from '@/components/student/lesson/microphone-control'

import {
  SpeechFeedback,
} from '@/components/student/lesson/speech-feedback'

import {
  resolveStageLabel,
  resolveWorldForLevel,
} from '@/components/student/worlds/world-config'


/* ============================================================
   PROPS
============================================================ */

export interface ConversationEngineProps {
  activities: ActivityItem[]
  levelTitle?: string
  levelNumber?: number
  avatarType?: 'BOY' | 'GIRL'
  onLessonComplete?: (
    xpEarned: number,
  ) => void
}


/* ============================================================
   TYPES
============================================================ */

type LessonMode =
  | 'listen'
  | 'repeat'
  | 'speak'

type Phase =
  | 'teaching'
  | 'ready'
  | 'playing'
  | 'listening_mic'
  | 'evaluating'
  | 'correct'
  | 'retry'
  | 'completed'

type JuliePose =
  | 'teaching'
  | 'listening'
  | 'thinking'
  | 'encouraging'
  | 'celebrating'

type PointerState = {
  x: number
  y: number
}


/* ============================================================
   COMPONENT
============================================================ */

export function ConversationEngine({
  activities,
  levelTitle = 'Wonder Fair',
  levelNumber = 1,
  avatarType = 'BOY',
  onLessonComplete,
}: ConversationEngineProps) {
  const [
    index,
    setIndex,
  ] =
    useState(0)

  const [
    phase,
    setPhase,
  ] =
    useState<Phase>(
      'teaching',
    )

  const [
    mode,
    setMode,
  ] =
    useState<LessonMode>(
      'listen',
    )

  const [
    selected,
    setSelected,
  ] =
    useState('')

  const [
    transcript,
    setTranscript,
  ] =
    useState('')

  const [
    evaluationFeedback,
    setEvaluationFeedback,
  ] =
    useState('')

  const [
    aiMessage,
    setAiMessage,
  ] =
    useState('')

  const [
    followUpQuestion,
    setFollowUpQuestion,
  ] =
    useState('')

  const [
    response,
    setResponse,
  ] =
    useState('')

  const [
    xp,
    setXp,
  ] =
    useState(0)

  const [
    seconds,
    setSeconds,
  ] =
    useState(0)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    pose,
    setPose,
  ] =
    useState<JuliePose>(
      'teaching',
    )

  const [
    pointer,
    setPointer,
  ] =
    useState<PointerState>({
      x: 0,
      y: 0,
    })

  const [
    activityFlash,
    setActivityFlash,
  ] =
    useState(false)

  const activity =
    activities[index]

  const julie =
    useMissJulieVoice()

  const recorder =
    useRef<MediaRecorder | null>(
      null,
    )

  const stream =
    useRef<MediaStream | null>(
      null,
    )

  const sessionId =
    useRef<string | null>(
      null,
    )

  const interval =
    useRef<number | null>(
      null,
    )

  const timeout =
    useRef<number | null>(
      null,
    )


  /* ==========================================================
     ACTIVITY START

     MISS JULIE SPEAKS FIRST.
  ========================================================== */

  useEffect(() => {
    if (!activity) {
      return
    }

    setPhase(
      'teaching',
    )

    setMode(
      activity.stage === 'SPEAK' ||
        activity.stage === 'INTERACT' ||
        activity.stage === 'FINAL_TALK'
        ? 'speak'
        : 'listen',
    )

    setSelected('')
    setTranscript('')
    setAiMessage('')
    setFollowUpQuestion('')
    setEvaluationFeedback('')
    setResponse('')
    setPose(
      'teaching',
    )

    setActivityFlash(
      true,
    )

    const flashTimer =
      window.setTimeout(
        () => {
          setActivityFlash(
            false,
          )
        },
        700,
      )

    const spokenLine =
      activity.prompt ||
      activity.target ||
      "Let's begin."

    /*
     * Audio should become a CACHE HIT once the
     * existing lesson TTS cache has pre-generated this line.
     */
    timeout.current =
      window.setTimeout(
        () => {
          setPhase(
            'ready',
          )

          void julie.speak(
            spokenLine,
          )
        },
        560,
      )

    return () => {
      window.clearTimeout(
        flashTimer,
      )

      if (
        timeout.current
      ) {
        window.clearTimeout(
          timeout.current,
        )
      }

      if (
        interval.current
      ) {
        window.clearInterval(
          interval.current,
        )
      }

      if (
        recorder.current &&
        recorder.current.state !==
          'inactive'
      ) {
        recorder.current.stop()
      }

      stream.current
        ?.getTracks()
        .forEach(
          (
            track,
          ) =>
            track.stop(),
        )
    }
  }, [
    activity,
    index,
  ])


  /* ==========================================================
     EMPTY
  ========================================================== */

  if (!activity) {
    return (
      <main className="lesson-empty-state">
        <h2>
          No activities found.
        </h2>

        <Link href="/student/levels">
          Back to adventure map
        </Link>
      </main>
    )
  }


  /* ==========================================================
     RESOLVED DATA
  ========================================================== */

  const world =
    resolveWorldForLevel(
      levelNumber,
      levelTitle,
    )

  const options =
    activity.choices?.length
      ? activity.choices.slice(
          0,
          4,
        )
      : [
          'I like it',
          'Not for me',
        ]

  const teacherLine =
    activity.prompt ||
    activity.target ||
    "Let's begin."

  const visibleDialogue =
    [
      aiMessage,
      followUpQuestion,
    ]
      .filter(Boolean)
      .join(' ') ||
    response ||
    (
      mode === 'repeat'
        ? activity.target ||
          teacherLine
        : teacherLine
    )

  const stageStatus =
    phase ===
    'listening_mic'
      ? 'I’m listening to you…'
      : phase ===
          'evaluating'
        ? 'Miss Julie is thinking about your answer…'
        : julie.state ===
            'loading'
          ? 'Miss Julie is getting ready to speak…'
          : ''

  const hasMic =
    Boolean(
      activity.voiceEnabled ||
        activity.metadata
          ?.micMode ||
        activity.stage ===
          'SPEAK' ||
        activity.stage ===
          'INTERACT' ||
        activity.stage ===
          'FINAL_TALK',
    )

  const learnerState =
    phase ===
    'listening_mic'
      ? 'speaking'
      : phase ===
          'evaluating'
        ? 'thinking'
        : phase ===
            'correct'
          ? 'happy'
          : phase ===
              'retry'
            ? 'retry'
            : julie.isSpeaking
              ? 'listening'
              : 'idle'

  const stageLabel =
    resolveStageLabel(
      activity.stage,
      world.stageLabel,
    )

  const bubbleText =
    visibleDialogue ||
    "Let's get started."


  /* ==========================================================
     CAMERA / PARALLAX
  ========================================================== */

  function handleMouseMove(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (
      typeof window !==
        'undefined' &&
      window.innerWidth <
        900
    ) {
      return
    }

    const rect =
      event.currentTarget
        .getBoundingClientRect()

    const x =
      (
        (
          event.clientX -
          rect.left
        ) /
        rect.width -
        0.5
      ) *
      2

    const y =
      (
        (
          event.clientY -
          rect.top
        ) /
        rect.height -
        0.5
      ) *
      2

    setPointer({
      x,
      y,
    })
  }

  function resetPointer() {
    setPointer({
      x: 0,
      y: 0,
    })
  }


  /* ==========================================================
     SUBMIT STUDENT TURN

     Existing backend remains the brain:
     transcript -> voice session -> MissJulieService -> Qwen
     -> memory/progress -> structured response.
  ========================================================== */

  async function submit(
    text: string,
    id: string,
  ) {
    setPhase(
      'evaluating',
    )

    setPose(
      'thinking',
    )

    try {
      const result =
        await voiceService
          .submitTranscript(
            id,
            text,
            'MIC',
          )

      const ai =
        result.aiResponse

      const backendRetryRequired =
        Boolean(
          ai?.shouldRetry ||
            ai?.conversation
              ?.retryState
              ?.waiting,
        )

      const backendActivityComplete =
        Boolean(
          ai?.activityComplete ||
            ai?.conversation
              ?.complete,
        )

      const backendConversationComplete =
        Boolean(
          ai?.conversation
            ?.complete,
        )

      const backendHintLevel =
        Math.max(
          0,
          Number(
            ai?.hintLevel ??
              ai?.conversation
                ?.retryState
                ?.hintLevel ??
              0,
          ),
        )

      const nextAiMessage =
        ai?.message || ''

      const nextFollowUp =
        ai?.followUpQuestion ||
        ''

      const nextEvaluation =
        result.evaluation
          ?.feedback ||
        ai?.message ||
        ''

      setTranscript(
        text,
      )

      setAiMessage(
        nextAiMessage,
      )

      setFollowUpQuestion(
        nextFollowUp,
      )

      setEvaluationFeedback(
        nextEvaluation,
      )

      setResponse(
        nextAiMessage,
      )

      setXp(
        (
          value,
        ) =>
          value +
          (
            result.xpAwarded ||
            0
          ),
      )

      if (
        backendActivityComplete ||
        backendConversationComplete
      ) {
        setPhase(
          'correct',
        )

        setPose(
          'celebrating',
        )
      } else if (
        backendRetryRequired
      ) {
        setPhase(
          'retry',
        )

        setPose(
          'encouraging',
        )
      } else {
        /*
         * Qwen may ask another follow-up.
         * We remain inside the same activity.
         */
        setPhase(
          'ready',
        )

        setPose(
          'teaching',
        )
      }

      const conversationTurn =
        ai?.conversation?.turnCount ??
        0

      const spokenResponse =
        [
          nextAiMessage,
          nextFollowUp,
        ]
          .filter(Boolean)
          .join(' ') ||
        (
          backendRetryRequired
            ? "That was a good try. Let's practise again."
            : backendActivityComplete ||
                backendConversationComplete
              ? "Wonderful! You did it."
              : "Thanks for sharing that."
        )

      /*
       * Dynamic Qwen replies use the live conversation voice router.
       *
       * First occurrence may synthesize.
       * Repeated text becomes a cache hit.
       */
      void julie.speak(
        spokenResponse,
        `conversation-${activity.id}-${conversationTurn}`,
        'CONVERSATION',
      )

      if (
        backendHintLevel >
        0
      ) {
        setEvaluationFeedback(
          (
            current,
          ) =>
            current ||
            `Hint level ${backendHintLevel}.`,
        )
      }

      if (
        backendActivityComplete
      ) {
        setActivityFlash(
          true,
        )

        window.setTimeout(
          () => {
            setActivityFlash(
              false,
            )
          },
          750,
        )
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'I could not evaluate that attempt.'

      setTranscript(
        text,
      )

      setAiMessage('')
      setFollowUpQuestion('')

      setEvaluationFeedback(
        message,
      )

      setPhase(
        'retry',
      )

      setPose(
        'encouraging',
      )
    }
  }


  /* ==========================================================
     MIC CLEANUP
  ========================================================== */

  function resetMic() {
    if (
      interval.current
    ) {
      window.clearInterval(
        interval.current,
      )
    }

    if (
      timeout.current
    ) {
      window.clearTimeout(
        timeout.current,
      )
    }

    stream.current
      ?.getTracks()
      .forEach(
        (
          track,
        ) =>
          track.stop(),
      )

    stream.current =
      null

    recorder.current =
      null

    setSeconds(0)
  }


  /* ==========================================================
     START MIC
  ========================================================== */

  async function startMic() {
    setPhase(
      'listening_mic',
    )

    setPose(
      'listening',
    )

    setTranscript('')
    setAiMessage('')
    setFollowUpQuestion('')
    setEvaluationFeedback('')

    try {
      if (
        !navigator
          .mediaDevices
          ?.getUserMedia ||
        !window.MediaRecorder
      ) {
        throw new Error(
          "Voice isn't ready. Try again.",
        )
      }

      stream.current =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation:
                true,

              noiseSuppression:
                true,

              autoGainControl:
                true,
            },
          })

      /*
       * IMPORTANT:
       * A fresh voice session for every spoken turn.
       *
       * This is safer for multi-turn Qwen conversation
       * than reusing a session that backend may already
       * consider completed.
       */
      const session =
        await voiceService
          .startSession({
            lessonId:
              activity.lessonId,

            activityId:
              activity.id,
          })

      sessionId.current =
        session._id

      const mimeType =
        MediaRecorder
          .isTypeSupported(
            'audio/webm;codecs=opus',
          )
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'

      const chunks: Blob[] =
        []

      const activeRecorder =
        new MediaRecorder(
          stream.current,
          {
            mimeType,
          },
        )

      activeRecorder
        .ondataavailable =
        (
          event,
        ) => {
          if (
            event.data.size
          ) {
            chunks.push(
              event.data,
            )
          }
        }

      activeRecorder.onstop =
        async () => {
          resetMic()

          const activeSessionId =
            sessionId.current

          sessionId.current =
            null

          if (
            !activeSessionId
          ) {
            return
          }

          try {
            setPhase(
              'evaluating',
            )

            setPose(
              'thinking',
            )

            const text =
              await voiceService
                .transcribeAudio(
                  new Blob(
                    chunks,
                    {
                      type:
                        mimeType,
                    },
                  ),
                  undefined,
                  undefined,
                  mode === 'repeat' ? 'accurate' : 'fast',
                )

            setTranscript(
              text,
            )

            await submit(
              text,
              activeSessionId,
            )
          } catch (error) {
            const message =
              error instanceof
              Error
                ? error.message
                : 'No speech was detected.'

            setEvaluationFeedback(
              message,
            )

            setPhase(
              'retry',
            )

            setPose(
              'encouraging',
            )
          }
        }

      recorder.current =
        activeRecorder

      activeRecorder.start()

      interval.current =
        window.setInterval(
          () =>
            setSeconds(
              (
                value,
              ) =>
                value +
                1,
            ),
          1000,
        )

      timeout.current =
        window.setTimeout(
          () => {
            if (
              activeRecorder
                .state !==
              'inactive'
            ) {
              activeRecorder.stop()
            }
          },
          8000,
        )
    } catch (error) {
      resetMic()

      const message =
        error instanceof Error
          ? error.message
          : 'Please allow microphone access.'

      setEvaluationFeedback(
        message,
      )

      setPhase(
        'retry',
      )

      setPose(
        'encouraging',
      )
    }
  }


  /* ==========================================================
     OPTION RESPONSE
  ========================================================== */

  async function choose(
    choice: string,
  ) {
    setSelected(
      choice,
    )

    setPhase(
      'playing',
    )

    setSubmitting(
      true,
    )

    try {
      const session =
        await voiceService
          .startSession({
            lessonId:
              activity.lessonId,

            activityId:
              activity.id,
          })

      await submit(
        choice,
        session._id,
      )
    } finally {
      setSubmitting(
        false,
      )
    }
  }


  /* ==========================================================
     NEXT
  ========================================================== */

  function next() {
    if (
      index ===
      activities.length -
        1
    ) {
      setPhase(
        'completed',
      )

      setPose(
        'celebrating',
      )

      onLessonComplete?.(
        xp,
      )

      void julie.speak(
        'Hurray! You finished this adventure!',
      )

      return
    }

    setActivityFlash(
      true,
    )

    window.setTimeout(
      () => {
        setIndex(
          (
            value,
          ) =>
            value +
            1,
        )
      },
      300,
    )
  }


  /* ==========================================================
     UI
  ========================================================== */

  return (
    <LessonWorld
      activity={activity}
      levelNumber={
        levelNumber
      }
      worldName={
        levelTitle
      }
      syllabusName={
        stageLabel
      }
    >
      <div
        className="tk-lesson-experience"
        onMouseMove={
          handleMouseMove
        }
        onMouseLeave={
          resetPointer
        }
      >
        {/* ==================================================
            CINEMATIC ACTIVITY FLASH
        ================================================== */}

        <AnimatePresence>
          {activityFlash && (
            <motion.div
              className="tk-activity-flash"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: [
                  0,
                  0.65,
                  0,
                ],
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration:
                  0.75,
              }}
            />
          )}
        </AnimatePresence>

        {/* ==================================================
            AMBIENT DEPTH
        ================================================== */}

        <motion.div
          className="tk-lesson-depth-light light-one"
          animate={{
            x:
              pointer.x *
              25,

            y:
              pointer.y *
              14,
          }}
          transition={{
            type:
              'spring',

            stiffness:
              35,

            damping:
              22,
          }}
        />

        <motion.div
          className="tk-lesson-depth-light light-two"
          animate={{
            x:
              pointer.x *
              -20,

            y:
              pointer.y *
              -12,
          }}
          transition={{
            type:
              'spring',

            stiffness:
              35,

            damping:
              22,
          }}
        />

        {/* ==================================================
            HUD
        ================================================== */}

        <motion.div
          className="tk-hud-layer"
          initial={{
            opacity: 0,
            y: -16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration:
              0.45,
          }}
        >
          <LessonHud
            title={
              levelTitle
            }
            levelLabel={
              stageLabel
            }
            xp={xp}
            index={
              index
            }
            total={
              activities.length
            }
            mode={
              mode
            }
            onModeChange={(
              nextMode,
            ) => {
              setMode(
                nextMode,
              )

              if (
                nextMode ===
                'listen'
              ) {
                void julie.speak(
                  teacherLine ||
                    activity.prompt,
                )
              }

              if (
                nextMode ===
                'repeat'
              ) {
                void julie.speak(
                  activity.target ||
                    teacherLine,
                )
              }

              if (
                nextMode ===
                  'speak' &&
                hasMic
              ) {
                void startMic()
              }
            }}
          />
        </motion.div>

        {/* ==================================================
            CONVERSATION WORLD

            Small mouse movement = child feels inside scene.
        ================================================== */}

        <motion.div
          className={[
            'tk-conversation-world',

            julie.isSpeaking
              ? 'is-julie-speaking'
              : '',

            phase ===
            'evaluating'
              ? 'is-thinking'
              : '',

            phase ===
            'listening_mic'
              ? 'is-listening'
              : '',
          ]
            .filter(
              Boolean,
            )
            .join(' ')}
          animate={{
            x:
              pointer.x *
              -7,

            y:
              pointer.y *
              -4,

            rotateY:
              pointer.x *
              0.7,

            rotateX:
              pointer.y *
              -0.4,

            scale:
              phase ===
              'listening_mic'
                ? 1.008
                : 1,
          }}
          transition={{
            type:
              'spring',

            stiffness:
              42,

            damping:
              24,
          }}
        >
          {/* Julie voice halo */}

          <AnimatePresence>
            {julie.isSpeaking && (
              <motion.div
                className="tk-julie-speaking-halo"
                initial={{
                  opacity: 0,
                  scale:
                    0.7,
                }}
                animate={{
                  opacity: [
                    0.18,
                    0.48,
                    0.18,
                  ],

                  scale: [
                    0.9,
                    1.12,
                    0.9,
                  ],
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration:
                    2,

                  repeat:
                    Infinity,

                  ease:
                    'easeInOut',
                }}
              />
            )}
          </AnimatePresence>

          {/* Qwen thinking */}

          <AnimatePresence>
            {phase ===
              'evaluating' && (
              <motion.div
                className="tk-ai-thinking-orbit"
                initial={{
                  opacity: 0,
                  scale:
                    0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale:
                    1.12,
                }}
              >
                <motion.div
                  animate={{
                    rotate:
                      360,
                  }}
                  transition={{
                    duration:
                      3,

                    repeat:
                      Infinity,

                    ease:
                      'linear',
                  }}
                >
                  <Brain
                    size={
                      22
                    }
                  />
                </motion.div>

                <span>
                  Thinking
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <ConversationStage
            julieMessage={
              bubbleText
            }
            julieState={
              phase ===
              'correct'
                ? 'celebrating'
                : phase ===
                    'retry'
                  ? 'encouraging'
                  : phase ===
                      'evaluating'
                    ? 'thinking'
                    : pose
            }
            transcript={
              transcript
            }
            learnerState={
              learnerState
            }
            avatarType={
              avatarType
            }
            onReplay={() =>
              void julie.replay()
            }
            isJulieSpeaking={
              julie.isSpeaking
            }
            statusText={
              stageStatus
            }
          />
        </motion.div>

        {/* ==================================================
            ACTIVITY AREA
        ================================================== */}

        <motion.div
          className="tk-activity-zone"
          animate={{
            y:
              phase ===
              'listening_mic'
                ? -5
                : 0,
          }}
          transition={{
            type:
              'spring',

            stiffness:
              180,

            damping:
              18,
          }}
        >
          {phase !==
            'completed' && (
            <>
              {/* OPTIONS */}

              {options.length >
                0 && (
                <motion.div
                  className="lesson-choice-grid tk-choice-grid"
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      0.25,

                    duration:
                      0.38,
                  }}
                >
                  {options.map(
                    (
                      option,
                      optionIndex,
                    ) => (
                      <motion.div
                        key={
                          option
                        }
                        whileHover={{
                          y: -6,
                          scale:
                            1.018,
                        }}
                        whileTap={{
                          y: 2,
                          scale:
                            0.985,
                        }}
                        transition={{
                          type:
                            'spring',

                          stiffness:
                            260,

                          damping:
                            20,
                        }}
                      >
                        <OptionTile
                          label={
                            option
                          }
                          icon={
                            [
                              '👍',
                              '👎',
                              '✅',
                              '✨',
                            ][
                              optionIndex
                            ] ||
                            '✨'
                          }
                          selected={
                            selected ===
                            option
                          }
                          disabled={
                            submitting
                          }
                          onSelect={() =>
                            void choose(
                              option,
                            )
                          }
                        />
                      </motion.div>
                    ),
                  )}
                </motion.div>
              )}

              {/* =================================================
                  MIC

                  Mic is the main child interaction for speaking
                  activities.
              ================================================= */}

              {hasMic && (
                <motion.div
                  className={[
                    'tk-mic-zone',

                    phase ===
                    'listening_mic'
                      ? 'is-recording'
                      : '',

                    phase ===
                    'evaluating'
                      ? 'is-processing'
                      : '',
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      ' ',
                    )}
                  animate={
                    phase ===
                    'listening_mic'
                      ? {
                          scale: [
                            1,
                            1.025,
                            1,
                          ],
                        }
                      : {
                          scale:
                            1,
                        }
                  }
                  transition={{
                    duration:
                      1.4,

                    repeat:
                      phase ===
                      'listening_mic'
                        ? Infinity
                        : 0,

                    ease:
                      'easeInOut',
                  }}
                >
                  {phase ===
                    'listening_mic' && (
                    <>
                      <motion.span
                        className="tk-mic-ring ring-one"
                        animate={{
                          scale: [
                            0.7,
                            1.8,
                          ],

                          opacity: [
                            0.5,
                            0,
                          ],
                        }}
                        transition={{
                          duration:
                            1.5,

                          repeat:
                            Infinity,
                        }}
                      />

                      <motion.span
                        className="tk-mic-ring ring-two"
                        animate={{
                          scale: [
                            0.7,
                            1.8,
                          ],

                          opacity: [
                            0.5,
                            0,
                          ],
                        }}
                        transition={{
                          duration:
                            1.5,

                          delay:
                            0.75,

                          repeat:
                            Infinity,
                        }}
                      />
                    </>
                  )}

                  <MicrophoneControl
                    state={
                      phase ===
                      'listening_mic'
                        ? 'recording'
                        : phase ===
                            'evaluating'
                          ? 'processing'
                          : 'ready'
                    }
                    onClick={
                      phase ===
                      'listening_mic'
                        ? () =>
                            recorder.current
                              ?.stop()
                        : () =>
                            void startMic()
                    }
                    disabled={
                      phase ===
                      'evaluating'
                    }
                    seconds={
                      seconds
                    }
                  />

                  {phase ===
                    'listening_mic' && (
                    <motion.div
                      className="tk-listening-label"
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                    >
                      <Mic
                        size={
                          14
                        }
                      />

                      Miss Julie is
                      listening
                    </motion.div>
                  )}
                </motion.div>
              )}
            </>
          )}

          {/* ==================================================
              AI FEEDBACK
          ================================================== */}

          <AnimatePresence
            mode="wait"
          >
            {(
              aiMessage ||
              evaluationFeedback ||
              followUpQuestion ||
              transcript
            ) &&
              phase !==
                'teaching' && (
                <motion.div
                  key={
                    `${index}-${transcript}-${aiMessage}`
                  }
                  className="tk-feedback-zone"
                  initial={{
                    opacity: 0,
                    y: 15,
                    scale:
                      0.97,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration:
                      0.28,
                  }}
                >
                  <SpeechFeedback
                    transcript={
                      transcript
                    }
                    aiMessage={
                      aiMessage
                    }
                    followUpQuestion={
                      followUpQuestion
                    }
                    evaluationFeedback={
                      evaluationFeedback
                    }
                  />
                </motion.div>
              )}
          </AnimatePresence>

          {/* ==================================================
              RETRY
          ================================================== */}

          <AnimatePresence>
            {phase ===
              'retry' && (
              <motion.div
                className="lesson-retry-actions tk-action-buttons"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                <motion.button
                  type="button"
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    y: 3,
                  }}
                  onClick={() =>
                    setPhase(
                      'ready',
                    )
                  }
                >
                  Try again
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    y: 3,
                  }}
                  onClick={
                    next
                  }
                >
                  Next

                  <ChevronRight
                    size={
                      16
                    }
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================================================
              SUCCESS
          ================================================== */}

          <AnimatePresence>
            {phase ===
              'correct' && (
              <motion.div
                className="lesson-retry-actions tk-action-buttons tk-success-actions"
                initial={{
                  opacity: 0,
                  y: 12,
                  scale:
                    0.96,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
              >
                <motion.div
                  className="tk-success-spark"
                  animate={{
                    rotate: [
                      -5,
                      5,
                      -5,
                    ],

                    scale: [
                      1,
                      1.08,
                      1,
                    ],
                  }}
                  transition={{
                    duration:
                      1.8,

                    repeat:
                      Infinity,
                  }}
                >
                  <Check
                    size={
                      17
                    }
                  />
                </motion.div>

                <motion.button
                  type="button"
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    y: 3,
                  }}
                  onClick={() =>
                    setPhase(
                      'ready',
                    )
                  }
                >
                  Keep practising
                </motion.button>

                <motion.button
                  type="button"
                  className="is-primary"
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    y: 3,
                  }}
                  onClick={
                    next
                  }
                >
                  Continue

                  <ChevronRight
                    size={
                      16
                    }
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================================================
              COMPLETION
          ================================================== */}

          <AnimatePresence>
            {phase ===
              'completed' && (
              <motion.div
                className="lesson-finish-card tk-finish-card"
                initial={{
                  opacity: 0,
                  scale:
                    0.78,
                  y: 30,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                transition={{
                  type:
                    'spring',

                  stiffness:
                    150,

                  damping:
                    15,
                }}
              >
                {[
                  0,
                  1,
                  2,
                  3,
                  4,
                  5,
                  6,
                  7,
                ].map(
                  (
                    item,
                  ) => (
                    <motion.span
                      key={
                        item
                      }
                      className="tk-celebration-star"
                      initial={{
                        opacity: 0,
                        x: 0,
                        y: 0,
                      }}
                      animate={{
                        opacity: [
                          0,
                          1,
                          0,
                        ],

                        x:
                          Math.cos(
                            item,
                          ) *
                          110,

                        y:
                          Math.sin(
                            item,
                          ) *
                            75 -
                          35,

                        rotate:
                          item *
                          65,

                        scale: [
                          0.5,
                          1,
                          0.6,
                        ],
                      }}
                      transition={{
                        duration:
                          1.5,

                        delay:
                          item *
                          0.05,
                      }}
                    >
                      ★
                    </motion.span>
                  ),
                )}

                <motion.span
                  className="reward-symbol"
                  animate={{
                    rotate: [
                      -8,
                      8,
                      -8,
                    ],

                    scale: [
                      1,
                      1.12,
                      1,
                    ],
                  }}
                  transition={{
                    duration:
                      2,

                    repeat:
                      Infinity,
                  }}
                >
                  ★
                </motion.span>

                <h3>
                  Fantastic work!
                </h3>

                <p>
                  +{xp} XP earned
                  in {levelTitle}.
                </p>

                <Link href="/student/levels">
                  Return to Adventure Map
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ==================================================
            GLOBAL PHASE INDICATOR
        ================================================== */}

        <AnimatePresence>
          {phase ===
            'evaluating' && (
            <motion.div
              className="tk-thinking-pill"
              initial={{
                opacity: 0,
                y: 14,
                scale:
                  0.9,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 8,
              }}
            >
              <motion.span
                animate={{
                  rotate:
                    360,
                }}
                transition={{
                  duration:
                    2,

                  repeat:
                    Infinity,

                  ease:
                    'linear',
                }}
              >
                <Sparkles
                  size={
                    15
                  }
                />
              </motion.span>

              Miss Julie is thinking…
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {julie.isSpeaking && (
            <motion.div
              className="tk-speaking-pill"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
            >
              <Volume2
                size={
                  15
                }
              />

              Miss Julie is speaking
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        /* ====================================================
           ROOT
        ==================================================== */

        .tk-lesson-experience {
          position: relative;

          width: 100%;
          height: 100%;

          min-height:
            calc(
              100svh -
              20px
            );

          overflow: hidden;

          perspective:
            1400px;
        }

        /* ====================================================
           DEPTH LIGHTING
        ==================================================== */

        .tk-lesson-depth-light {
          position: absolute;

          z-index: 1;

          pointer-events: none;

          border-radius: 50%;

          filter:
            blur(
              95px
            );
        }

        .tk-lesson-depth-light.light-one {
          width: 350px;
          height: 350px;

          right: 12%;
          top: 14%;

          background:
            rgba(
              255,
              205,
              65,
              0.1
            );
        }

        .tk-lesson-depth-light.light-two {
          width: 300px;
          height: 300px;

          left: 10%;
          bottom: 8%;

          background:
            rgba(
              67,
              200,
              255,
              0.08
            );
        }

        .tk-activity-flash {
          position: absolute;

          inset: 0;

          z-index: 100;

          pointer-events:
            none;

          background:
            radial-gradient(
              circle at center,
              rgba(
                255,
                225,
                91,
                0.22
              ),
              transparent
                58%
            );
        }

        /* ====================================================
           HUD
        ==================================================== */

        .tk-hud-layer {
          position: relative;

          z-index: 20;
        }

        /* ====================================================
           MAIN CONVERSATION
        ==================================================== */

        .tk-conversation-world {
          position: relative;

          z-index: 10;

          transform-style:
            preserve-3d;

          will-change:
            transform;
        }

        .tk-conversation-world.is-julie-speaking {
          filter:
            saturate(
              1.025
            );
        }

        .tk-julie-speaking-halo {
          position: absolute;

          z-index: 0;

          right: 57%;
          top: 24%;

          width: 260px;
          height: 260px;

          border-radius:
            50%;

          pointer-events:
            none;

          background:
            radial-gradient(
              circle,
              rgba(
                255,
                207,
                93,
                0.22
              ),
              rgba(
                255,
                172,
                95,
                0.06
              )
                50%,
              transparent
                72%
            );

          filter:
            blur(
              12px
            );
        }

        /* ====================================================
           AI THINKING
        ==================================================== */

        .tk-ai-thinking-orbit {
          position: absolute;

          z-index: 40;

          left: 50%;
          top: 16px;

          min-height:
            38px;

          padding:
            0 14px;

          transform:
            translateX(
              -50%
            );

          display:
            inline-flex;

          align-items:
            center;

          gap: 8px;

          border:
            1px solid
            rgba(
              111,
              218,
              255,
              0.28
            );

          border-radius:
            999px;

          color:
            #81e5ff;

          background:
            rgba(
              5,
              27,
              59,
              0.82
            );

          backdrop-filter:
            blur(
              12px
            );

          box-shadow:
            0 12px 25px
            rgba(
              0,
              0,
              0,
              0.23
            );

          font-size:
            10px;

          font-weight:
            900;
        }

        /* ====================================================
           ACTIVITY
        ==================================================== */

        .tk-activity-zone {
          position: relative;

          z-index: 30;
        }

        .tk-choice-grid {
          transform-style:
            preserve-3d;
        }

        .tk-choice-grid > div {
          transform:
            translateZ(
              20px
            );
        }

        /* ====================================================
           MIC
        ==================================================== */

        .tk-mic-zone {
          position: relative;

          display: flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          isolation:
            isolate;
        }

        .tk-mic-ring {
          position: absolute;

          z-index: -1;

          width: 92px;
          height: 92px;

          border:
            3px solid
            rgba(
              76,
              216,
              255,
              0.52
            );

          border-radius:
            50%;

          pointer-events:
            none;
        }

        .tk-mic-zone.is-recording
          .tk-mic-ring {
          border-color:
            rgba(
              255,
              111,
              139,
              0.6
            );
        }

        .tk-listening-label {
          min-height:
            31px;

          margin-top:
            7px;

          padding:
            0 12px;

          display:
            inline-flex;

          align-items:
            center;

          gap: 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );

          border-radius:
            999px;

          color:
            #fff;

          background:
            rgba(
              7,
              25,
              55,
              0.76
            );

          backdrop-filter:
            blur(
              10px
            );

          font-size:
            9px;

          font-weight:
            850;
        }

        /* ====================================================
           FEEDBACK
        ==================================================== */

        .tk-feedback-zone {
          margin-top:
            10px;
        }

        /* ====================================================
           ACTIONS
        ==================================================== */

        .tk-action-buttons {
          display: flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 10px;

          margin-top:
            13px;
        }

        .tk-action-buttons button {
          min-height:
            46px;

          padding:
            0 18px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.13
            );

          border-radius:
            14px;

          color: white;

          background:
            rgba(
              10,
              32,
              67,
              0.9
            );

          box-shadow:
            0 6px 0
              rgba(
                2,
                11,
                30,
                0.72
              ),
            0 12px 22px
              rgba(
                0,
                0,
                0,
                0.2
              );

          cursor:
            pointer;

          font-weight:
            900;
        }

        .tk-action-buttons
          button.is-primary {
          color:
            #17243e;

          background:
            linear-gradient(
              145deg,
              #ffe461,
              #ffb323
            );

          border: 0;

          box-shadow:
            0 6px 0
              #a76612,
            0 12px 22px
              rgba(
                0,
                0,
                0,
                0.22
              );
        }

        .tk-success-spark {
          width: 34px;
          height: 34px;

          display: grid;

          place-items:
            center;

          border-radius:
            50%;

          color:
            #183522;

          background:
            #80dc89;

          box-shadow:
            0 6px 14px
            rgba(
              56,
              172,
              81,
              0.25
            );
        }

        /* ====================================================
           FINISH
        ==================================================== */

        .tk-finish-card {
          position: relative;

          overflow:
            visible;
        }

        .tk-celebration-star {
          position: absolute;

          left: 50%;
          top: 42%;

          color:
            #ffe05a;

          font-size:
            17px;

          pointer-events:
            none;
        }

        /* ====================================================
           STATUS PILLS
        ==================================================== */

        .tk-thinking-pill,
        .tk-speaking-pill {
          position: fixed;

          z-index: 200;

          left: 50%;

          bottom: 22px;

          transform:
            translateX(
              -50%
            );

          min-height:
            38px;

          padding:
            0 14px;

          display:
            flex;

          align-items:
            center;

          gap: 7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.13
            );

          border-radius:
            999px;

          backdrop-filter:
            blur(
              14px
            );

          box-shadow:
            0 12px 28px
            rgba(
              0,
              0,
              0,
              0.25
            );

          font-size:
            9px;

          font-weight:
            900;
        }

        .tk-thinking-pill {
          color:
            #8fe7ff;

          background:
            rgba(
              7,
              30,
              66,
              0.9
            );
        }

        .tk-speaking-pill {
          color:
            #ffe58b;

          background:
            rgba(
              38,
              29,
              10,
              0.88
            );
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (
          max-width:
            720px
        ) {
          .tk-lesson-experience {
            min-height:
              100svh;
          }

          .tk-conversation-world {
            transform:
              none !important;
          }

          .tk-julie-speaking-halo {
            right: 45%;

            width: 180px;
            height: 180px;
          }

          .tk-ai-thinking-orbit {
            top: 7px;
          }

          .tk-action-buttons {
            flex-wrap:
              wrap;
          }

          .tk-action-buttons button {
            min-height:
              48px;

            flex:
              1;

            min-width:
              120px;
          }

          .tk-thinking-pill,
          .tk-speaking-pill {
            bottom:
              82px;
          }
        }

        /* ====================================================
           REDUCED MOTION
        ==================================================== */

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          *,
          *::before,
          *::after {
            animation-duration:
              0.01ms !important;

            animation-iteration-count:
              1 !important;

            transition-duration:
              0.01ms !important;
          }
        }
      `}</style>
    </LessonWorld>
  )
}