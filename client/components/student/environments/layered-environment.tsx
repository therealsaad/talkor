'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function EnvironmentLayer({ children, depth = 1, className = '' }: { children: ReactNode; depth?: number; className?: string }) { return <div className={`student-environment-layer ${className}`} data-depth={depth}>{children}</div> }

export function LayeredEnvironment({ image, children, className = '', overlay = 0.48 }: { image: string; children: ReactNode; className?: string; overlay?: number }) {
  const scene = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!scene.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const layers = scene.current.querySelectorAll<HTMLElement>('[data-depth]')
    const onMove = (event: PointerEvent) => {
      const rect = scene.current!.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - 0.5; const y = (event.clientY - rect.top) / rect.height - 0.5
      layers.forEach((layer) => gsap.to(layer, { x: x * Number(layer.dataset.depth || 1) * 8, y: y * Number(layer.dataset.depth || 1) * 5, duration: 0.7, ease: 'power2.out', overwrite: true }))
    }
    const node = scene.current; node.addEventListener('pointermove', onMove); return () => node.removeEventListener('pointermove', onMove)
  }, [])
  return <div ref={scene} className={`student-environment ${className}`} style={{ '--student-scene': `url(${image})`, '--student-overlay': overlay } as CSSProperties}>{children}</div>
}

export function EnvironmentHotspot({ label, icon, href, position }: { label: string; icon: ReactNode; href: string; position?: CSSProperties }) { return <a className="environment-hotspot" href={href} style={position}>{icon}<span>{label}</span></a> }
