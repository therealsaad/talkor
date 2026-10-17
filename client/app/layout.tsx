import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './student-v2.css'
import './conversation.css'
import './world-reference.css'
import './educator.css'
import { AuthProvider } from '@/components/auth/auth-provider'

export const metadata: Metadata = {
  title: {
    default: 'Talkora | Speak, Learn, Shine',
    template: '%s | Talkora',
  },
  description: 'A bright, playful English-learning world for students and teachers.',
  generator: 'Talkora',
  icons: {
    icon: '/brand/talkora-logo-transparent.png',
    apple: '/brand/talkora-logo-transparent.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#eef3ee',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
