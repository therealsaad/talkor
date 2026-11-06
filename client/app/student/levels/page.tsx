// // // client/app/student/levels/page.tsx

// // 'use client'

// // import Image from 'next/image'
// // import { useRouter } from 'next/navigation'
// // import {
// //   type MouseEvent,
// //   useEffect,
// //   useMemo,
// //   useRef,
// //   useState,
// // } from 'react'

// // import {
// //   AnimatePresence,
// //   motion,
// // } from 'framer-motion'

// // import {
// //   BarChart3,
// //   Home,
// //   LoaderCircle,
// //   Lock,
// //   LogOut,
// //   Map,
// //   Sparkles,
// //   Star,
// //   Trophy,
// //   User,
// //   Volume2,
// //   VolumeX,
// // } from 'lucide-react'

// // import {
// //   TalkoraLoader,
// // } from '@/components/student/talkora-loader'

// // import {
// //   TalkoraLogo,
// // } from '@/components/brand/talkora-logo'

// // import {
// //   authService,
// //   type AuthSession,
// // } from '@/services/auth-service'

// // import {
// //   curriculumService,
// //   type StudentCurriculum,
// // } from '@/services/curriculum-service'

// // import {
// //   voiceService,
// //   type VoicePlaybackState,
// // } from '@/services/voice-service'

// // type MapStatus =
// //   | 'CURRENT'
// //   | 'COMPLETED'
// //   | 'LOCKED'
// //   | 'UPCOMING'

// // type World = {
// //   number: number
// //   id: string
// //   name: string
// //   syllabus: string

// //   /*
// //    * Level button location.
// //    */
// //   x: number
// //   y: number

// //   /*
// //    * Full-body student feet position.
// //    * Kept separate so the student stands NEXT
// //    * to the level instead of covering it.
// //    */
// //   studentX: number
// //   studentY: number
// // }

// // type PointerState = {
// //   x: number
// //   y: number
// // }

// // type CameraState = {
// //   x: number
// //   y: number
// //   scale: number
// // }

// // /*