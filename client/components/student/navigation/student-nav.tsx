'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

import {
  LayoutDashboard,
  Map,
  Mic2,
  Trophy,
  TrendingUp,
  UserRound,
} from 'lucide-react'

import {
  TalkoraLogo,
} from '@/components/brand/talkora-logo'

export const studentNavItems = [
  {
    href: '/student/home',
    label: 'Home',
    icon: LayoutDashboard,
  },
  {
    href: '/student/levels',
    label: 'Adventure',
    icon: Map,
  },
  {
    href: '/student/practice',
    label: 'Practice',
    icon: Mic2,
  },
  {
    href: '/student/rewards',
    label: 'Rewards',
    icon: Trophy,
  },
  {
    href: '/student/progress',
    label: 'Progress',
    icon: TrendingUp,
  },
  {
    href: '/student/profile',
    label: 'Profile',
    icon: UserRound,
  },
]

function isStudentNavItemActive(href: string, pathname: string) {
  if (pathname === href || pathname.startsWith(`${href}/`)) {
    return true
  }

  if (href === '/student/levels') {
    return pathname.startsWith('/student/lesson')
  }

  return href === '/student/home' && pathname === '/student'
}

export function StudentNav() {
  const pathname =
    usePathname()

  if (
    pathname.startsWith(
      '/student/lesson',
    )
  ) {
    return null
  }

  return (
    <>
      {/* =====================================================
          DESKTOP HOVER RAIL
      ===================================================== */}

      <aside
        className="talkora-desktop-rail talkora-hover-rail"
        aria-label="Main Navigation"
      >
        {/* ---------------------------------------------------
            BRAND
        --------------------------------------------------- */}

        <div className="talkora-rail-brand talkora-hover-brand">
          <Link
            href="/student/home"
            className="talkora-brand-mark"
            aria-label="Talkora Home"
          >
            <TalkoraLogo
              className="talkora-logo--rail talkora-hover-logo"
              priority
            />
          </Link>
        </div>

        {/* ---------------------------------------------------
            LINKS
        --------------------------------------------------- */}

        <nav className="talkora-rail-links">
          {studentNavItems.map(
            ({
              href,
              label,
              icon: Icon,
            }) => {
              const isActive = isStudentNavItemActive(href, pathname)

              return (
                <Link
                  key={href}
                  href={href}
                  className={`talkora-rail-item talkora-hover-rail-item ${
                    isActive
                      ? 'is-active'
                      : ''
                  }`}
                  aria-current={
                    isActive
                      ? 'page'
                      : undefined
                  }
                  title={label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="talkora-rail-pill"
                      className="talkora-rail-active-pill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}

                  <span className="talkora-rail-icon">
                    <Icon
                      size={22}
                    />
                  </span>

                  <span className="talkora-rail-label talkora-hover-label">
                    {label}
                  </span>
                </Link>
              )
            },
          )}
        </nav>

        {/* ---------------------------------------------------
            SMALL HOVER HINT

            No extra Julie status card.
        --------------------------------------------------- */}

        <div className="talkora-hover-rail-footer">
          <span className="talkora-hover-rail-dot" />

          <span className="talkora-hover-footer-text">
            Talkora
          </span>
        </div>
      </aside>

      {/* =====================================================
          MOBILE NAV

          KEEP EXISTING BEHAVIOUR.
      ===================================================== */}

      <nav
        className="student-bottom-nav"
        aria-label="Mobile Navigation"
      >
        {studentNavItems.map(
          ({
            href,
            label,
            icon: Icon,
          }) => {
            const isActive = isStudentNavItemActive(href, pathname)

            return (
              <Link
                key={href}
                href={href}
                className={
                  isActive
                    ? 'active'
                    : ''
                }
                aria-current={
                  isActive
                    ? 'page'
                    : undefined
                }
              >
                {isActive && (
                  <motion.i
                    layoutId="student-nav-active"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 34,
                    }}
                  />
                )}

                <Icon
                  size={20}
                />

                <span>
                  {label}
                </span>
              </Link>
            )
          },
        )}
      </nav>

      {/* =====================================================
          HOVER RAIL OVERRIDES
      ===================================================== */}

      <style jsx global>{`
        /*
        ================================================
        DESKTOP COLLAPSED RAIL
        ================================================
        */

        @media (min-width: 961px) {
          .talkora-hover-rail {
            width: 76px !important;

            padding:
              22px 10px !important;

            overflow: hidden;

            transition:
              width 280ms
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                ),
              box-shadow 280ms ease,
              background 280ms ease;

            background:
              linear-gradient(
                180deg,
                rgba(
                  5,
                  17,
                  40,
                  0.98
                ),
                rgba(
                  4,
                  15,
                  35,
                  0.98
                )
              ) !important;

            box-shadow:
              12px 0 30px
              rgba(
                0,
                0,
                0,
                0.12
              );
          }

          /*
           * FULL SIDEBAR ONLY
           * WHEN HOVERED / KEYBOARD FOCUSED.
           */

          .talkora-hover-rail:hover,
          .talkora-hover-rail:focus-within {
            width: 250px !important;

            padding:
              24px 16px !important;

            box-shadow:
              20px 0 45px
              rgba(
                0,
                0,
                0,
                0.3
              );
          }

          /*
          ================================================
          LOGO
          ================================================
          */

          .talkora-hover-brand {
            width: 100%;

            margin-bottom:
              26px !important;

            padding: 0 !important;

            display: flex;

            justify-content:
              center;

            transition:
              justify-content
              250ms ease;
          }

          .talkora-hover-rail:hover
            .talkora-hover-brand,
          .talkora-hover-rail:focus-within
            .talkora-hover-brand {
            justify-content:
              flex-start;
          }

          .talkora-hover-logo {
            width: 52px !important;

            max-width: 52px;

            height: auto;

            object-fit: contain;

            transition:
              width 280ms
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                ),
              max-width 280ms
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                );
          }

          .talkora-hover-rail:hover
            .talkora-hover-logo,
          .talkora-hover-rail:focus-within
            .talkora-hover-logo {
            width: 108px !important;

            max-width: 108px;
          }

          /*
          ================================================
          LINKS
          ================================================
          */

          .talkora-hover-rail-item {
            min-height: 52px;

            padding:
              12px 16px !important;

            gap: 14px;

            white-space: nowrap;

            overflow: hidden;

            transition:
              transform 180ms ease,
              background 180ms ease,
              color 180ms ease;
          }

          .talkora-hover-rail:not(:hover):not(:focus-within)
            .talkora-hover-rail-item {
            justify-content:
              center;

            padding:
              12px 0 !important;
          }

          .talkora-hover-rail-item:hover {
            transform:
              translateX(3px);
          }

          .talkora-hover-rail
            .talkora-rail-icon {
            flex: 0 0 24px;

            min-width: 24px;
          }

          /*
          ================================================
          LABELS
          ================================================
          */

          .talkora-hover-label {
            max-width: 0;

            opacity: 0;

            overflow: hidden;

            transform:
              translateX(-8px);

            transition:
              opacity 160ms ease,
              max-width 250ms ease,
              transform 250ms ease;
          }

          .talkora-hover-rail:hover
            .talkora-hover-label,
          .talkora-hover-rail:focus-within
            .talkora-hover-label {
            max-width: 150px;

            opacity: 1;

            transform:
              translateX(0);

            transition-delay:
              60ms;
          }

          /*
          ================================================
          ACTIVE ICON
          ================================================
          */

          .talkora-hover-rail:not(:hover):not(:focus-within)
            .talkora-rail-active-pill {
            inset:
              3px 0 !important;

            border-radius:
              18px !important;
          }

          /*
          ================================================
          FOOTER
          ================================================
          */

          .talkora-hover-rail-footer {
            min-height: 44px;

            margin-top: auto;

            display: flex;

            align-items: center;

            justify-content:
              center;

            gap: 9px;

            overflow: hidden;
          }

          .talkora-hover-rail-dot {
            width: 8px;
            height: 8px;

            flex: 0 0 8px;

            border-radius: 50%;

            background:
              #4ad5ff;

            box-shadow:
              0 0 12px
              rgba(
                74,
                213,
                255,
                0.8
              );
          }

          .talkora-hover-footer-text {
            max-width: 0;

            opacity: 0;

            overflow: hidden;

            color:
              #bad8ef;

            font-size: 11px;

            font-weight: 800;

            letter-spacing:
              0.08em;

            transition:
              opacity 160ms ease,
              max-width 250ms ease;
          }

          .talkora-hover-rail:hover
            .talkora-hover-footer-text,
          .talkora-hover-rail:focus-within
            .talkora-hover-footer-text {
            max-width: 100px;

            opacity: 1;
          }
        }

        /*
        ================================================
        MOBILE

        Original nav remains.
        ================================================
        */

        @media (max-width: 960px) {
          .talkora-hover-rail {
            display:
              none !important;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .talkora-hover-rail,
          .talkora-hover-label,
          .talkora-hover-logo,
          .talkora-hover-footer-text {
            transition:
              none !important;
          }
        }
      `}</style>
    </>
  )
}