'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

import { TalkoraLogo } from '@/components/brand/talkora-logo'

export function TalkoraLoader({
  message = 'Getting your adventure ready...',
  compact = false,
  worldSrc = '/assets/talkora-world-approved.png',
}: {
  message?: string
  compact?: boolean
  worldSrc?: string
}) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={[
        'talkora-loader',
        compact ? 'talkora-loader--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Image
        src={worldSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className="talkora-loader__world"
      />

      <div
        className="talkora-loader__world-shade"
        aria-hidden="true"
      />

      <motion.div
        className="talkora-loader__scene"
        initial={
          reducedMotion
            ? false
            : {
                opacity: 0,
                y: 18,
                scale: 0.96,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.4,
          ease: 'easeOut',
        }}
      >
        <motion.div
          className="talkora-loader__logo-wrap"
          animate={
            reducedMotion
              ? undefined
              : {
                  y: [0, -4, 0],
                }
          }
          transition={
            reducedMotion
              ? undefined
              : {
                  duration: 2.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        >
          <TalkoraLogo
            className="talkora-loader__logo"
            priority
          />
        </motion.div>

        <div className="talkora-loader__teacher-row">
          <motion.div
            className="talkora-loader__julie-wrap"
            animate={
              reducedMotion
                ? undefined
                : {
                    y: [0, -5, 0],
                  }
            }
            transition={
              reducedMotion
                ? undefined
                : {
                    duration: 3.1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          >
            <span
              className="talkora-loader__julie-shadow"
              aria-hidden="true"
            />

            <Image
              src="/miss-julie-welcome.png"
              alt="Miss Julie"
              width={250}
              height={390}
              priority
              className="talkora-loader__julie"
            />
          </motion.div>

          <motion.div
            className="talkora-loader__bubble"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    x: -10,
                    scale: 0.94,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            transition={{
              delay: 0.16,
              duration: 0.32,
              ease: 'easeOut',
            }}
          >
            <span className="talkora-loader__eyebrow">
              MISS JULIE
            </span>

            <strong className="talkora-loader__message">
              {message}
            </strong>

            <span className="talkora-loader__promise">
              Your next Talkora adventure is almost ready.
            </span>

            <div
              className="talkora-loader__dots"
              aria-hidden="true"
            >
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  animate={
                    reducedMotion
                      ? undefined
                      : {
                          y: [0, -6, 0],
                          opacity: [0.35, 1, 0.35],
                        }
                  }
                  transition={
                    reducedMotion
                      ? undefined
                      : {
                          duration: 0.82,
                          repeat: Infinity,
                          delay: dot * 0.14,
                          ease: 'easeInOut',
                        }
                  }
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style jsx global>{`
        .talkora-loader {
          position: fixed;
          inset: 0;
          z-index: 10050;
          width: 100vw;
          height: 100dvh;
          min-height: 100dvh;
          overflow: hidden;
          isolation: isolate;
          background: #071a14;
        }

        .talkora-loader--compact {
          position: absolute;
          width: 100%;
          height: 100%;
          min-height: 280px;
        }

        .talkora-loader__world {
          z-index: 0;
          object-fit: cover;
          object-position: center;
          filter: saturate(1.04) contrast(1.02) brightness(0.72);
          transform: scale(1.025);
        }

        .talkora-loader__world-shade {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(circle at 48% 48%, rgba(255,255,255,.05), transparent 29%),
            linear-gradient(180deg, rgba(2,11,9,.20), rgba(2,11,9,.42));
          backdrop-filter: blur(1.5px);
        }

        .talkora-loader__scene {
          position: relative;
          z-index: 3;
          width: min(760px, calc(100vw - 32px));
          height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .talkora-loader__logo-wrap {
          width: clamp(145px, 14vw, 220px);
          margin-bottom: clamp(2px, 1vh, 12px);
          filter: drop-shadow(0 12px 15px rgba(0,0,0,.30));
        }

        .talkora-loader__logo {
          display: block;
          width: 100%;
          height: auto;
        }

        .talkora-loader__teacher-row {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0;
        }

        .talkora-loader__julie-wrap {
          position: relative;
          z-index: 2;
          width: clamp(115px, 12vw, 175px);
          height: clamp(190px, 29vh, 270px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          transform-origin: bottom center;
        }

        .talkora-loader__julie {
          position: relative;
          z-index: 2;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom center;
          filter: drop-shadow(0 16px 13px rgba(0,0,0,.38));
        }

        .talkora-loader__julie-shadow {
          position: absolute;
          z-index: 1;
          left: 50%;
          bottom: 1px;
          width: 74%;
          height: 19px;
          border-radius: 50%;
          background: rgba(2,14,7,.46);
          filter: blur(6px);
          transform: translateX(-50%) scaleY(.65);
        }

        .talkora-loader__bubble {
          position: relative;
          z-index: 4;
          width: clamp(255px, 31vw, 410px);
          margin-left: -6px;
          margin-bottom: clamp(45px, 8vh, 72px);
          padding: 17px 18px 16px;
          border: 3px solid #e9c4c8;
          border-radius: 21px 21px 21px 7px;
          color: #21362a;
          background: rgba(255,249,234,.97);
          box-shadow:
            0 8px 0 rgba(160,102,105,.17),
            0 22px 42px rgba(0,0,0,.32);
        }

        .talkora-loader__bubble::before {
          content: '';
          position: absolute;
          left: -13px;
          bottom: 22px;
          width: 23px;
          height: 23px;
          background: #fff9ea;
          border-left: 3px solid #e9c4c8;
          border-bottom: 3px solid #e9c4c8;
          transform: rotate(45deg);
        }

        .talkora-loader__eyebrow {
          position: relative;
          z-index: 2;
          display: block;
          color: #d75f7c;
          font-size: 9px;
          font-weight: 1000;
          letter-spacing: .15em;
        }

        .talkora-loader__message {
          position: relative;
          z-index: 2;
          display: block;
          margin-top: 7px;
          color: #21362a;
          font-size: clamp(17px, 1.8vw, 23px);
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -.02em;
        }

        .talkora-loader__promise {
          position: relative;
          z-index: 2;
          display: block;
          margin-top: 7px;
          color: #6e776f;
          font-size: 11px;
          line-height: 1.4;
          font-weight: 700;
        }

        .talkora-loader__dots {
          position: relative;
          z-index: 2;
          height: 18px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .talkora-loader__dots span {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d75f7c;
          box-shadow: 0 2px 5px rgba(118,52,69,.18);
        }

        .talkora-loader--compact .talkora-loader__logo-wrap {
          width: 120px;
        }

        .talkora-loader--compact .talkora-loader__julie-wrap {
          width: 92px;
          height: 145px;
        }

        .talkora-loader--compact .talkora-loader__bubble {
          width: min(300px, 55vw);
          margin-bottom: 28px;
          padding: 12px 13px;
        }

        @media (max-width: 680px) {
          .talkora-loader__scene {
            justify-content: center;
          }

          .talkora-loader__logo-wrap {
            width: 140px;
            margin-bottom: 0;
          }

          .talkora-loader__teacher-row {
            width: min(94vw, 460px);
            align-items: flex-end;
          }

          .talkora-loader__julie-wrap {
            width: 92px;
            min-width: 92px;
            height: 150px;
          }

          .talkora-loader__bubble {
            width: auto;
            flex: 1;
            margin-left: -3px;
            margin-bottom: 31px;
            padding: 12px 13px;
            border-width: 2px;
            border-radius: 17px 17px 17px 6px;
          }

          .talkora-loader__bubble::before {
            left: -9px;
            bottom: 18px;
            width: 16px;
            height: 16px;
            border-width: 2px;
          }

          .talkora-loader__message {
            font-size: 15px;
          }

          .talkora-loader__promise {
            font-size: 9px;
          }
        }

        @media (max-width: 430px) {
          .talkora-loader__logo-wrap {
            width: 124px;
          }

          .talkora-loader__julie-wrap {
            width: 76px;
            min-width: 76px;
            height: 126px;
          }

          .talkora-loader__bubble {
            margin-bottom: 25px;
          }

          .talkora-loader__promise {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .talkora-loader *,
          .talkora-loader *::before,
          .talkora-loader *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
