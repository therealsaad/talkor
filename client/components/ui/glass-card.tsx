import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** A project-level shadcn-compatible surface for the Talkora glass theme. */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('talkora-glass', className)} {...props} />
}
