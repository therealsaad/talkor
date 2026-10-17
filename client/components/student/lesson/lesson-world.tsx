'use client'

import Image from 'next/image'
import {
  type ReactNode,
  type MouseEvent,
  useState,
} from 'react'

import {
  motion,
} from 'framer-motion'

import type {
  ActivityItem,
} from '@/services/curriculum-service'

interface LessonWorldProps {
  children: ReactNode
  activity?: ActivityItem
  worldName?: string
  syllabusName?: string
  levelNumber?: number
}

type PointerState = {
  x: number
  y: number
}

const LEVEL_ONE_BACKGROUND =
  '/assets/level-1-favourite-fair-talkora.png'

const DEFAULT_BACKGROUND =
  '/assets/favourite-fair-bg.png'

export function LessonWorld({
  children,
  activity,
  worldName = 'Favourite Fair',
  syllabusName = 'My Favourite Things',
  levelNumber = 1,
}: LessonWorldProps) {
  const [
    pointer,
    setPointer,
  ] =
    useState<PointerState>({
      x: 0,
      y: 0,
    })

  function handleMouseMove(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (
      typeof window !== 'undefined' &&
      window.innerWidth < 850
    ) {
      return
    }

    const rect =
      event.currentTarget.getBoundingClientRect()

    const x =
      (
        (event.clientX - rect.left) /
          rect.width -
        0.5
      ) * 2

    const y =
      (
        (event.clientY - rect.top) /
          rect.height -
        0.5
      ) * 2

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

  const backgroundSrc =
    Number(levelNumber) === 1
      ? LEVEL_ONE_BACKGROUND
      : DEFAULT_BACKGROUND

  const stage =
    String(
      activity?.stage ||
        activity?.type ||
        'lesson',
    )
      .toLowerCase()
      .replaceAll(
        '_',
        '-',
      )

  return (
    <div
      className="tk-lesson-world"
      data-lesson-stage={
        stage
      }
      aria-label={`${syllabusName} lesson`}
      onMouseMove={
        handleMouseMove
      }
      onMouseLeave={
        resetPointer
      }
    >
      {/* ====================================================
          CINEMATIC BACKGROUND

          Slight mouse movement makes the child feel inside
          the courtyard.
      ==================================================== */}

      <motion.div
        className="tk-lesson-world-bg"
        animate={{
          x:
            pointer.x *
            -12,

          y:
            pointer.y *
            -7,

          scale:
            1.045,

          rotateY:
            pointer.x *
            0.55,

          rotateX:
            pointer.y *
            -0.3,
        }}
        transition={{
          type: 'spring',
          stiffness: 42,
          damping: 28,
          mass: 0.7,
        }}
      >
        <Image
          src={backgroundSrc}
          alt={`${worldName} learning environment`}
          fill
          priority
          sizes="100vw"
          className="tk-lesson-world-img"
        />
      </motion.div>

      {/* depth lighting */}

      <motion.div
        className="tk-world-light tk-world-light-a"
        animate={{
          x:
            pointer.x *
            24,

          y:
            pointer.y *
            14,
        }}
      />

      <motion.div
        className="tk-world-light tk-world-light-b"
        animate={{
          x:
            pointer.x *
            -18,

          y:
            pointer.y *
            -12,
        }}
      />

      <div className="tk-world-overlay" />

      {/* actual lesson UI */}

      <motion.div
        className="tk-lesson-content"
        animate={{
          x:
            pointer.x *
            3,

          y:
            pointer.y *
            2,
        }}
        transition={{
          type: 'spring',
          stiffness: 55,
          damping: 30,
        }}
      >
        {children}
      </motion.div>

      <style jsx global>{`
        .tk-lesson-world {
          position: relative;

          width: 100%;
          min-height: 100svh;

          overflow: hidden;

          color: white;

          background:
            #071526;

          perspective:
            1600px;
        }

        .tk-lesson-world-bg {
          position: fixed;

          inset: -24px;

          z-index: 0;

          transform-origin:
            center;

          will-change:
            transform;
        }

        .tk-lesson-world-img {
          object-fit: cover;

          object-position:
            center;

          filter:
            saturate(1.04)
            contrast(1.025)
            brightness(0.9);
        }

        .tk-world-overlay {
          position: fixed;

          inset: 0;

          z-index: 1;

          pointer-events: none;

          background:
            linear-gradient(
              180deg,
              rgba(
                4,
                15,
                31,
                0.28
              )
                0%,
              rgba(
                4,
                15,
                31,
                0.04
              )
                25%,
              rgba(
                3,
                11,
                25,
                0.08
              )
                65%,
              rgba(
                3,
                11,
                25,
                0.32
              )
                100%
            ),
            radial-gradient(
              ellipse at center,
              transparent
                45%,
              rgba(
                1,
                7,
                18,
                0.18
              )
                100%
            );
        }

        .tk-world-light {
          position: fixed;

          z-index: 1;

          width: 380px;
          height: 380px;

          border-radius:
            50%;

          pointer-events:
            none;

          filter:
            blur(105px);
        }

        .tk-world-light-a {
          top: 5%;
          right: 12%;

          background:
            rgba(
              255,
              211,
              88,
              0.08
            );
        }

        .tk-world-light-b {
          left: 12%;
          bottom: 5%;

          background:
            rgba(
              68,
              203,
              255,
              0.07
            );
        }

        .tk-lesson-content {
          position: relative;

          z-index: 10;

          width: 100%;
          min-height: 100svh;

          transform-style:
            preserve-3d;
        }

        @media (
          max-width:
            850px
        ) {
          .tk-lesson-world-bg {
            inset: 0;

            transform:
              none !important;
          }

          .tk-lesson-world-img {
            object-position:
              50% center;
          }

          .tk-lesson-content {
            transform:
              none !important;
          }

          .tk-world-light {
            display: none;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .tk-lesson-world-bg,
          .tk-lesson-content {
            transform:
              none !important;
          }
        }
      `}</style>
    </div>
  )
}

/* ============================================================
   EXISTING LOADER EXPORT

   Keep because LessonExperience currently imports it.
============================================================ */

export function TalkoraWorldLoader({
  destination = 'Favourite Fair',
  subtitle = 'Opening your speaking adventure…',
}: {
  destination?: string
  subtitle?: string
}) {
  return (
    <motion.div
      className="tk-world-loader"
      initial={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        scale: 1.08,
      }}
      transition={{
        duration: 0.6,
      }}
    >
      <motion.div
        className="tk-world-loader-card"
        initial={{
          opacity: 0,
          y: 20,
          scale: 0.92,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
      >
        <motion.span
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat:
              Infinity,
            ease: 'linear',
          }}
        >
          ✦
        </motion.span>

        <small>
          ENTERING
        </small>

        <strong>
          {destination}
        </strong>

        <p>
          {subtitle}
        </p>
      </motion.div>

      <style jsx global>{`
        .tk-world-loader {
          position: fixed;

          inset: 0;

          z-index: 500;

          display: grid;
          place-items: center;

          background:
            radial-gradient(
              circle at center,
              rgba(
                26,
                79,
                86,
                0.52
              ),
              #061327
                70%
            );

          backdrop-filter:
            blur(7px);
        }

        .tk-world-loader-card {
          display: flex;

          flex-direction:
            column;

          align-items:
            center;

          min-width: 270px;

          padding:
            30px 34px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );

          border-radius:
            28px;

          background:
            rgba(
              8,
              27,
              51,
              0.82
            );

          box-shadow:
            0 30px 80px
            rgba(
              0,
              0,
              0,
              0.38
            );

          text-align: center;
        }

        .tk-world-loader-card
          > span {
          color: #ffe15c;

          font-size: 30px;
        }

        .tk-world-loader-card
          small {
          margin-top: 12px;

          color: #79dfff;

          font-size: 8px;

          font-weight: 1000;

          letter-spacing:
            0.2em;
        }

        .tk-world-loader-card
          strong {
          margin-top: 5px;

          font-size: 28px;
        }

        .tk-world-loader-card
          p {
          margin:
            7px 0 0;

          color: #bad0df;

          font-size: 11px;
        }
      `}</style>
    </motion.div>
  )
}