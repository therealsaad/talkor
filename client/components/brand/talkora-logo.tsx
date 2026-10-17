import Image from 'next/image'

const LOGO_SRC = '/brand/talkora-logo-transparent.png'

export function TalkoraLogo({
  className = '',
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Talkora - Speak, Learn, Shine"
      width={1264}
      height={1149}
      className={`talkora-official-logo ${className}`.trim()}
      priority={priority}
    />
  )
}

export const talkoraLogoSrc = LOGO_SRC
