import { NextResponse } from 'next/server'

/**
 * The teaching-stage showcase is a development-only visual sandbox.
 *
 * A banner or missing navigation link is not access control. The preview is
 * inaccessible to students and anonymous visitors on production deployments,
 * before React renders or any simulated controls become interactive.
 *
 * This must stay separate from the real student lessons and progress engine.
 */
export function proxy() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }

  return NextResponse.next()
}

// Next.js 16 route proxy executes before both app routes and public assets.
export const config = {
  matcher: ['/classroom-preview', '/classroom-preview.html'],
}
