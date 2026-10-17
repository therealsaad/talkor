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
// // =========================================================
// // ASSETS
// // =========================================================
// // */

// // const MAP_BACKGROUND =
// //   '/assets/levelmap.png'

// // /*
// //  * client/public/miss-julie-welcome.png
// //  */
// // const MISS_JULIE_IMAGE =
// //   '/miss-julie-welcome.png'

// // /*
// //  * client/public/talkora/characters/students/boy/canonical.png
// //  */
// // const BOY_STUDENT_IMAGE =
// //   '/talkora/characters/students/boy/canonical.png'

// // /*
// //  * client/public/talkora/characters/students/girl/canonical.png
// //  */
// // const GIRL_STUDENT_IMAGE =
// //   '/talkora/characters/students/girl/canonical.png'

// // /*
// // =========================================================
// // LEVEL LOCATIONS

// // These positions correspond to the actual visible land,
// // bridges, platforms and circular pads in levelmap.png.

// // Miss Julie occupies the upper-left TALKORA-board area,
// // so no level is placed on top of her.
// // =========================================================
// // */

// // const WORLDS: World[] = [
// //   {
// //     number: 1,
// //     id: 'favourite-fair',
// //     name: 'Favourite Fair',
// //     syllabus: 'My Favourite Things',

// //     /*
// //      * Bottom-left learning camp.
// //      */
// //     x: 25,
// //     y: 76,

// //     studentX: 20,
// //     studentY: 83,
// //   },

// //   {
// //     number: 2,
// //     id: 'friendship-garden',
// //     name: 'Friendship Garden',
// //     syllabus: 'All About My Partner',

// //     /*
// //      * Centre-left bridge landing.
// //      */
// //     x: 40,
// //     y: 58,

// //     studentX: 35,
// //     studentY: 65,
// //   },

// //   {
// //     number: 3,
// //     id: 'talkora-cafe',
// //     name: 'Talkora Café',
// //     syllabus: 'Let’s Order',

// //     /*
// //      * Treehouse learning platform.
// //      */
// //     x: 47,
// //     y: 34,

// //     studentX: 42,
// //     studentY: 41,
// //   },

// //   {
// //     number: 4,
// //     id: 'calendar-town',
// //     name: 'Calendar Town',
// //     syllabus: 'On My Calendar',

// //     /*
// //      * Upper centre path.
// //      */
// //     x: 61,
// //     y: 37,

// //     studentX: 56,
// //     studentY: 44,
// //   },

// //   {
// //     number: 5,
// //     id: 'helper-harbour',
// //     name: 'Helper Harbour',
// //     syllabus: 'Let Me Help You',

// //     /*
// //      * Temple entrance.
// //      */
// //     x: 82,
// //     y: 43,

// //     studentX: 77,
// //     studentY: 50,
// //   },

// //   {
// //     number: 6,
// //     id: 'story-forest',
// //     name: 'Story Forest',
// //     syllabus: 'Familiar Folk Tales',

// //     /*
// //      * Lower temple path.
// //      */
// //     x: 72,
// //     y: 56,

// //     studentX: 67,
// //     studentY: 63,
// //   },

// //   {
// //     number: 7,
// //     id: 'special-moments-studio',
// //     name: 'Memory Meadows',
// //     syllabus: 'My Special Moment',

// //     /*
// //      * Lower-centre river bridge.
// //      */
// //     x: 61,
// //     y: 73,

// //     studentX: 56,
// //     studentY: 80,
// //   },

// //   {
// //     number: 8,
// //     id: 'voices-for-good-theatre',
// //     name: 'Voice Valley',
// //     syllabus: 'Using Our Voices for Good',

// //     /*
// //      * Bottom-right final learning stage.
// //      */
// //     x: 90,
// //     y: 72,

// //     studentX: 85,
// //     studentY: 79,
// //   },
// // ]

// // export default function AdventureMapPage() {
// //   const router =
// //     useRouter()

// //   const greetedRef =
// //     useRef(false)

// //   const [
// //     session,
// //     setSession,
// //   ] =
// //     useState<AuthSession | null>(
// //       null,
// //     )

// //   const [
// //     curriculum,
// //     setCurriculum,
// //   ] =
// //     useState<StudentCurriculum | null>(
// //       null,
// //     )

// //   const [
// //     loading,
// //     setLoading,
// //   ] =
// //     useState(true)

// //   const [
// //     error,
// //     setError,
// //   ] =
// //     useState('')

// //   const [
// //     selected,
// //     setSelected,
// //   ] =
// //     useState(1)

// //   const [
// //     focusedWorld,
// //     setFocusedWorld,
// //   ] =
// //     useState<number | null>(
// //       null,
// //     )

// //   const [
// //     entering,
// //     setEntering,
// //   ] =
// //     useState(false)

// //   const [
// //     julieMessage,
// //     setJulieMessage,
// //   ] =
// //     useState('')

// //   const [
// //     displayedJulieMessage,
// //     setDisplayedJulieMessage,
// //   ] =
// //     useState('')

// //   const [
// //     voiceState,
// //     setVoiceState,
// //   ] =
// //     useState<VoicePlaybackState>(
// //       'idle',
// //     )

// //   const [
// //     voiceError,
// //     setVoiceError,
// //   ] =
// //     useState('')

// //   const [
// //     pointer,
// //     setPointer,
// //   ] =
// //     useState<PointerState>({
// //       x: 0,
// //       y: 0,
// //     })

// //   const [
// //     camera,
// //     setCamera,
// //   ] =
// //     useState<CameraState>({
// //       x: 0,
// //       y: 0,
// //       scale: 1,
// //     })

// //   /*
// //   =========================================================
// //   LOAD STUDENT + CURRICULUM
// //   =========================================================
// //   */

// //   useEffect(() => {
// //     let alive = true

// //     async function load() {
// //       try {
// //         const auth =
// //           await authService.getMe()

// //         if (!alive) {
// //           return
// //         }

// //         if (
// //           !auth ||
// //           auth.role !== 'STUDENT' ||
// //           !auth.student
// //         ) {
// //           router.replace(
// //             '/login/student',
// //           )

// //           return
// //         }

// //         setSession(auth)

// //         const data =
// //           await curriculumService.getMyCurriculum()

// //         if (!alive) {
// //           return
// //         }

// //         setCurriculum(data)
// //         setLoading(false)
// //       } catch (cause) {
// //         if (!alive) {
// //           return
// //         }

// //         console.error(
// //           '[TALKORA ADVENTURE]',
// //           cause,
// //         )

// //         setError(
// //           cause instanceof Error
// //             ? cause.message
// //             : 'Failed to load your adventure.',
// //         )

// //         setLoading(false)
// //       }
// //     }

// //     void load()

// //     return () => {
// //       alive = false

// //       voiceService.stop()

// //       if (
// //         typeof window !==
// //           'undefined' &&
// //         'speechSynthesis' in window
// //       ) {
// //         window.speechSynthesis.cancel()
// //       }
// //     }
// //   }, [router])

// //   /*
// //   =========================================================
// //   STUDENT
// //   =========================================================
// //   */

// //   const student =
// //     session?.student

// //   const firstName =
// //     student?.fullName
// //       ?.trim()
// //       .split(/\s+/)[0] ||
// //     'Explorer'

// //   /*
// //    * Use the requested canonical full-body character.
// //    */
// //   const studentCharacter =
// //     String(
// //       student?.avatarType ??
// //       '',
// //     ).toUpperCase() === 'GIRL'
// //       ? GIRL_STUDENT_IMAGE
// //       : BOY_STUDENT_IMAGE

// //   /*
// //   =========================================================
// //   CURRENT CURRICULUM LEVEL
// //   =========================================================
// //   */

// //   const currentUnit =
// //     useMemo(() => {
// //       return (
// //         Number(
// //           curriculum?.units.find(
// //             (unit) =>
// //               unit.status ===
// //               'CURRENT',
// //           )?.unitNumber,
// //         ) || 1
// //       )
// //     }, [curriculum])

// //   const currentWorld =
// //     WORLDS.find(
// //       (world) =>
// //         world.number ===
// //         currentUnit,
// //     ) || WORLDS[0]

// //   const selectedWorld =
// //     WORLDS.find(
// //       (world) =>
// //         world.number ===
// //         selected,
// //     ) || currentWorld

// //   function statusFor(
// //     number: number,
// //   ): MapStatus {
// //     const unit =
// //       curriculum?.units.find(
// //         (item) =>
// //           Number(
// //             item.unitNumber,
// //           ) === number,
// //       )

// //     return (
// //       (unit?.status as
// //         | MapStatus
// //         | undefined) ??
// //       'UPCOMING'
// //     )
// //   }

// //   useEffect(() => {
// //     setSelected(
// //       currentUnit,
// //     )
// //   }, [currentUnit])

// //   /*
// //   =========================================================
// //   MAP PARALLAX
// //   =========================================================
// //   */

// //   function handlePointerMove(
// //     event: MouseEvent<HTMLElement>,
// //   ) {
// //     if (
// //       focusedWorld !== null ||
// //       entering
// //     ) {
// //       return
// //     }

// //     if (
// //       typeof window !==
// //         'undefined' &&
// //       window.innerWidth < 850
// //     ) {
// //       return
// //     }

// //     const rect =
// //       event.currentTarget.getBoundingClientRect()

// //     const relativeX =
// //       (event.clientX -
// //         rect.left) /
// //       rect.width

// //     const relativeY =
// //       (event.clientY -
// //         rect.top) /
// //       rect.height

// //     setPointer({
// //       x:
// //         (relativeX - 0.5) *
// //         2,

// //       y:
// //         (relativeY - 0.5) *
// //         2,
// //     })
// //   }

// //   function resetPointer() {
// //     if (
// //       focusedWorld !== null ||
// //       entering
// //     ) {
// //       return
// //     }

// //     setPointer({
// //       x: 0,
// //       y: 0,
// //     })
// //   }

// //   /*
// //   =========================================================
// //   CAMERA
// //   =========================================================
// //   */

// //   function focusCamera(
// //     world: World,
// //     scale = 1.14,
// //   ) {
// //     /*
// //      * Move the chosen world toward screen centre.
// //      */
// //     const x =
// //       (50 - world.x) *
// //       5

// //     const y =
// //       (50 - world.y) *
// //       3.4

// //     setFocusedWorld(
// //       world.number,
// //     )

// //     setPointer({
// //       x: 0,
// //       y: 0,
// //     })

// //     setCamera({
// //       x,
// //       y,
// //       scale,
// //     })
// //   }

// //   function showWholeWorld() {
// //     if (entering) {
// //       return
// //     }

// //     setFocusedWorld(
// //       null,
// //     )

// //     setPointer({
// //       x: 0,
// //       y: 0,
// //     })

// //     setCamera({
// //       x: 0,
// //       y: 0,
// //       scale: 1,
// //     })
// //   }

// //   /*
// //   =========================================================
// //   MISS JULIE VOICE
// //   =========================================================
// //   */

// //   async function speakJulie(
// //     message: string,
// //   ) {
// //     const cleaned =
// //       message.trim()

// //     if (!cleaned) {
// //       return
// //     }

// //     setVoiceError('')

// //     try {
// //       await voiceService.speak(
// //         cleaned,

// //         (
// //           state,
// //           messageText,
// //         ) => {
// //           setVoiceState(
// //             state,
// //           )

// //           if (
// //             state === 'error'
// //           ) {
// //             setVoiceError(
// //               messageText ||
// //                 'Tap the speaker to hear Miss Julie.',
// //             )
// //           }
// //         },

// //         undefined,

// //         'PAGE_GUIDANCE',
// //       )
// //     } catch {
// //       setVoiceState(
// //         'idle',
// //       )
// //     }
// //   }

// //   function stopJulie() {
// //     voiceService.stop()

// //     if (
// //       typeof window !==
// //         'undefined' &&
// //       'speechSynthesis' in window
// //     ) {
// //       window.speechSynthesis.cancel()
// //     }

// //     setVoiceState(
// //       'idle',
// //     )
// //   }

// //   /*
// //   =========================================================
// //   AUTO GREETING
// //   =========================================================
// //   */

// //   useEffect(() => {
// //     if (
// //       !curriculum ||
// //       !student ||
// //       greetedRef.current
// //     ) {
// //       return
// //     }

// //     greetedRef.current =
// //       true

// //     const greeting =
// //       `Hi ${firstName}! Welcome back to Talkora. ` +
// //       `Our English adventure is ready! ` +
// //       `Today we're continuing ${currentWorld.name}. ` +
// //       `Choose the glowing level and let's go!`

// //     setJulieMessage(
// //       greeting,
// //     )

// //     const timer =
// //       window.setTimeout(
// //         () => {
// //           void speakJulie(
// //             greeting,
// //           )
// //         },
// //         650,
// //       )

// //     return () => {
// //       window.clearTimeout(
// //         timer,
// //       )
// //     }
// //   }, [
// //     curriculum,
// //     student,
// //     firstName,
// //     currentWorld,
// //   ])

// //   /*
// //   =========================================================
// //   MISS JULIE TYPEWRITER TEXT
// //   =========================================================
// //   */

// //   useEffect(() => {
// //     const message =
// //       julieMessage ||
// //       `Hi ${firstName}! Ready for today's adventure?`

// //     setDisplayedJulieMessage(
// //       '',
// //     )

// //     let index = 0

// //     const timer =
// //       window.setInterval(
// //         () => {
// //           index += 1

// //           setDisplayedJulieMessage(
// //             message.slice(
// //               0,
// //               index,
// //             ),
// //           )

// //           if (
// //             index >=
// //             message.length
// //           ) {
// //             window.clearInterval(
// //               timer,
// //             )
// //           }
// //         },
// //         18,
// //       )

// //     return () => {
// //       window.clearInterval(
// //         timer,
// //       )
// //     }
// //   }, [
// //     julieMessage,
// //     firstName,
// //   ])

// //   /*
// //   =========================================================
// //   OPEN LEVEL
// //   =========================================================
// //   */

// //   function beginWorld(
// //     world: World,
// //   ) {
// //     const status =
// //       statusFor(
// //         world.number,
// //       )

// //     if (
// //       status !== 'CURRENT' &&
// //       status !== 'COMPLETED'
// //     ) {
// //       return
// //     }

// //     setEntering(true)

// //     setSelected(
// //       world.number,
// //     )

// //     const message =
// //       status === 'COMPLETED'
// //         ? `Amazing ${firstName}! Let's visit ${world.name} again.`
// //         : `Come on ${firstName}! Let's begin ${world.name}!`

// //     setJulieMessage(
// //       message,
// //     )

// //     void speakJulie(
// //       message,
// //     )

// //     focusCamera(
// //       world,
// //       1.42,
// //     )

// //     window.setTimeout(
// //       () => {
// //         router.push(
// //           `/student/lesson/${world.number}`,
// //         )
// //       },
// //       850,
// //     )
// //   }

// //   function chooseWorld(
// //     world: World,
// //   ) {
// //     const status =
// //       statusFor(
// //         world.number,
// //       )

// //     setSelected(
// //       world.number,
// //     )

// //     if (
// //       status === 'CURRENT' ||
// //       status === 'COMPLETED'
// //     ) {
// //       beginWorld(
// //         world,
// //       )

// //       return
// //     }

// //     focusCamera(
// //       world,
// //       1.12,
// //     )

// //     if (
// //       status === 'LOCKED'
// //     ) {
// //       const message =
// //         `${world.name} is still locked. ` +
// //         `Finish ${currentWorld.name} first and we'll unlock it together.`

// //       setJulieMessage(
// //         message,
// //       )

// //       void speakJulie(
// //         message,
// //       )

// //       return
// //     }

// //     const message =
// //       `${world.name} is waiting further along our adventure. ` +
// //       `We'll reach it soon!`

// //     setJulieMessage(
// //       message,
// //     )

// //     void speakJulie(
// //       message,
// //     )
// //   }

// //   /*
// //   =========================================================
// //   LOADER

// //   Fixed fullscreen so the parent student dashboard / XP bar
// //   never appears above it while loading.
// //   =========================================================
// //   */

// //   if (loading) {
// //     return (
// //       <div className="tk-map-loading">
// //         <motion.div
// //           className="tk-map-loading-logo"
// //           initial={{
// //             opacity: 0,
// //             scale: 0.8,
// //             y: 10,
// //           }}
// //           animate={{
// //             opacity: 1,
// //             scale: 1,
// //             y: 0,
// //           }}
// //           transition={{
// //             duration: 0.45,
// //           }}
// //         >
// //           <TalkoraLogo
// //             className="tk-loader-logo-image"
// //             priority
// //           />
// //         </motion.div>

// //         <TalkoraLoader
// //           message="Opening your English adventure..."
// //         />

// //         <AdventureStyles />
// //       </div>
// //     )
// //   }

// //   /*
// //   =========================================================
// //   ERROR
// //   =========================================================
// //   */

// //   if (error) {
// //     return (
// //       <main className="tk-map-error">
// //         <motion.div
// //           initial={{
// //             opacity: 0,
// //             y: 18,
// //             scale: 0.96,
// //           }}
// //           animate={{
// //             opacity: 1,
// //             y: 0,
// //             scale: 1,
// //           }}
// //         >
// //           <TalkoraLogo
// //             className="tk-error-logo"
// //           />

// //           <h1>
// //             Adventure paused
// //           </h1>

// //           <p>
// //             {error}
// //           </p>

// //           <button
// //             type="button"
// //             onClick={() =>
// //               window.location.reload()
// //             }
// //           >
// //             Try again
// //           </button>
// //         </motion.div>

// //         <AdventureStyles />
// //       </main>
// //     )
// //   }

// //   return (
// //     <div className="tk-map">
// //       {/* ===================================================
// //           MINIMAL SIDEBAR
// //       =================================================== */}

// //       <motion.aside
// //         className="tk-mini-sidebar"
// //         initial={{
// //           opacity: 0,
// //           x: -30,
// //         }}
// //         animate={{
// //           opacity: 1,
// //           x: 0,
// //         }}
// //         transition={{
// //           duration: 0.58,
// //           ease: 'easeOut',
// //         }}
// //       >
// //         {/* REAL TALKORA LOGO */}

// //         <button
// //           type="button"
// //           className="tk-mini-logo"
// //           aria-label="Talkora Home"
// //           onClick={() =>
// //             router.push(
// //               '/student',
// //             )
// //           }
// //         >
// //           <span className="tk-mini-logo-art">
// //             <TalkoraLogo
// //               className="tk-mini-logo-image"
// //               priority
// //             />
// //           </span>

// //           <span className="tk-mini-label">
// //             TALKORA
// //           </span>
// //         </button>

// //         <nav className="tk-mini-nav">
// //           <button
// //             type="button"
// //             onClick={() =>
// //               router.push(
// //                 '/student',
// //               )
// //             }
// //           >
// //             <Home size={20} />

// //             <span>
// //               Home
// //             </span>
// //           </button>

// //           <button
// //             type="button"
// //             className="active"
// //           >
// //             <Map size={20} />

// //             <span>
// //               Adventures
// //             </span>
// //           </button>

// //           <button
// //             type="button"
// //             onClick={() =>
// //               router.push(
// //                 '/student/achievements',
// //               )
// //             }
// //           >
// //             <Trophy size={20} />

// //             <span>
// //               Achievements
// //             </span>
// //           </button>

// //           <button
// //             type="button"
// //             onClick={() =>
// //               router.push(
// //                 '/student/progress',
// //               )
// //             }
// //           >
// //             <BarChart3
// //               size={20}
// //             />

// //             <span>
// //               Progress
// //             </span>
// //           </button>

// //           <button
// //             type="button"
// //             onClick={() =>
// //               router.push(
// //                 '/student/profile',
// //               )
// //             }
// //           >
// //             <User size={20} />

// //             <span>
// //               Profile
// //             </span>
// //           </button>
// //         </nav>

// //         <div className="tk-mini-bottom">
// //           <button
// //             type="button"
// //             onClick={() =>
// //               router.push(
// //                 '/login/student',
// //               )
// //             }
// //           >
// //             <LogOut size={20} />

// //             <span>
// //               Exit
// //             </span>
// //           </button>
// //         </div>
// //       </motion.aside>

// //       {/* ===================================================
// //           MAP
// //       =================================================== */}

// //       <section
// //         className="tk-map-stage"
// //         onMouseMove={
// //           handlePointerMove
// //         }
// //         onMouseLeave={
// //           resetPointer
// //         }
// //       >
// //         {/* =================================================
// //             CAMERA
// //         ================================================= */}

// //         <motion.div
// //           className="tk-world-camera"
// //           animate={{
// //             x:
// //               camera.x +
// //               pointer.x *
// //                 -16,

// //             y:
// //               camera.y +
// //               pointer.y *
// //                 -10,

// //             scale:
// //               camera.scale,

// //             rotateY:
// //               focusedWorld ===
// //               null
// //                 ? pointer.x *
// //                   1.2
// //                 : 0,

// //             rotateX:
// //               focusedWorld ===
// //               null
// //                 ? pointer.y *
// //                   -0.7
// //                 : 0,
// //           }}
// //           transition={{
// //             type: 'spring',

// //             stiffness:
// //               focusedWorld ===
// //               null
// //                 ? 42
// //                 : 58,

// //             damping:
// //               focusedWorld ===
// //               null
// //                 ? 26
// //                 : 21,

// //             mass: 0.72,
// //           }}
// //         >
// //           {/* FULL SCREEN IMAGE */}

// //           <div className="tk-world-bg">
// //             <Image
// //               src={
// //                 MAP_BACKGROUND
// //               }
// //               alt="Talkora English Adventure Map"
// //               fill
// //               priority
// //               sizes="100vw"
// //               className="tk-world-bg-image"
// //             />

// //             <div className="tk-world-depth-overlay" />
// //           </div>

// //           {/* =================================================
// //               LEVEL BUTTONS
// //           ================================================= */}

// //           <div className="tk-level-layer">
// //             {WORLDS.map(
// //               (
// //                 world,
// //                 index,
// //               ) => {
// //                 const status =
// //                   statusFor(
// //                     world.number,
// //                   )

// //                 const current =
// //                   status ===
// //                   'CURRENT'

// //                 const completed =
// //                   status ===
// //                   'COMPLETED'

// //                 const locked =
// //                   status ===
// //                     'LOCKED' ||
// //                   status ===
// //                     'UPCOMING'

// //                 const isSelected =
// //                   selected ===
// //                   world.number

// //                 return (
// //                   /*
// //                    * Anchor handles physical map position.
// //                    * Motion button handles animation separately.
// //                    *
// //                    * This avoids Framer Motion overriding
// //                    * translate(-50%, -50%).
// //                    */
// //                   <div
// //                     key={
// //                       world.id
// //                     }
// //                     className="tk-level-anchor"
// //                     style={{
// //                       left:
// //                         `${world.x}%`,

// //                       top:
// //                         `${world.y}%`,
// //                     }}
// //                   >
// //                     <motion.button
// //                       type="button"
// //                       aria-label={
// //                         `Level ${world.number}: ${world.name}`
// //                       }
// //                       className={[
// //                         'tk-level',

// //                         current
// //                           ? 'is-current'
// //                           : '',

// //                         completed
// //                           ? 'is-completed'
// //                           : '',

// //                         locked
// //                           ? 'is-locked'
// //                           : '',

// //                         isSelected
// //                           ? 'is-selected'
// //                           : '',
// //                       ]
// //                         .filter(
// //                           Boolean,
// //                         )
// //                         .join(' ')}
// //                       initial={{
// //                         opacity: 0,
// //                         scale: 0.68,
// //                         y: 22,
// //                       }}
// //                       animate={{
// //                         opacity: 1,
// //                         scale: 1,
// //                         y: 0,
// //                       }}
// //                       transition={{
// //                         delay:
// //                           0.16 +
// //                           index *
// //                             0.07,

// //                         duration:
// //                           0.45,

// //                         ease:
// //                           'easeOut',
// //                       }}
// //                       whileHover={{
// //                         y: -8,
// //                         scale: 1.07,
// //                       }}
// //                       whileTap={{
// //                         scale: 0.94,
// //                       }}
// //                       onClick={() =>
// //                         chooseWorld(
// //                           world,
// //                         )
// //                       }
// //                     >
// //                       <span className="tk-level-ground-shadow" />

// //                       {/* CURRENT LEVEL PULSES */}

// //                       {current ? (
// //                         <>
// //                           <motion.span
// //                             className="tk-level-pulse pulse-one"
// //                             animate={{
// //                               scale: [
// //                                 0.78,
// //                                 1.6,
// //                               ],

// //                               opacity: [
// //                                 0.76,
// //                                 0,
// //                               ],
// //                             }}
// //                             transition={{
// //                               duration: 2,
// //                               repeat:
// //                                 Infinity,
// //                               ease:
// //                                 'easeOut',
// //                             }}
// //                           />

// //                           <motion.span
// //                             className="tk-level-pulse pulse-two"
// //                             animate={{
// //                               scale: [
// //                                 0.78,
// //                                 1.6,
// //                               ],

// //                               opacity: [
// //                                 0.65,
// //                                 0,
// //                               ],
// //                             }}
// //                             transition={{
// //                               duration: 2,
// //                               delay: 1,
// //                               repeat:
// //                                 Infinity,
// //                               ease:
// //                                 'easeOut',
// //                             }}
// //                           />
// //                         </>
// //                       ) : null}

// //                       {/* LEVEL ORB */}

// //                       <span className="tk-level-orb">
// //                         {completed ? (
// //                           <Star
// //                             size={22}
// //                             fill="currentColor"
// //                           />
// //                         ) : locked ? (
// //                           <Lock
// //                             size={19}
// //                           />
// //                         ) : (
// //                           world.number
// //                         )}
// //                       </span>

// //                       {/* LEVEL NAME */}

// //                       <span className="tk-level-name">
// //                         <strong>
// //                           {world.name}
// //                         </strong>

// //                         <small>
// //                           {world.number}.
// //                           {' '}
// //                           {
// //                             world.syllabus
// //                           }
// //                         </small>
// //                       </span>
// //                     </motion.button>
// //                   </div>
// //                 )
// //               },
// //             )}
// //           </div>

// //           {/* =================================================
// //               CURRENT STUDENT

// //               FULL BODY BOY/GIRL CHARACTER.
// //               FEET ARE ANCHORED ON LAND.
// //           ================================================= */}

// //           <div
// //             className="tk-student-anchor"
// //             style={{
// //               left:
// //                 `${currentWorld.studentX}%`,

// //               top:
// //                 `${currentWorld.studentY}%`,
// //             }}
// //           >
// //             <motion.div
// //               className="tk-you-marker"
// //               initial={{
// //                 opacity: 0,
// //                 scale: 0.8,
// //               }}
// //               animate={{
// //                 opacity: 1,

// //                 scale: 1,

// //                 y: [
// //                   0,
// //                   -6,
// //                   0,
// //                 ],
// //               }}
// //               transition={{
// //                 opacity: {
// //                   duration:
// //                     0.45,
// //                 },

// //                 scale: {
// //                   duration:
// //                     0.45,
// //                 },

// //                 y: {
// //                   duration:
// //                     3.2,

// //                   repeat:
// //                     Infinity,

// //                   ease:
// //                     'easeInOut',
// //                 },
// //               }}
// //             >
// //               <div className="tk-student-shadow" />

// //               <Image
// //                 src={
// //                   studentCharacter
// //                 }
// //                 alt={
// //                   `${firstName} Talkora student`
// //                 }
// //                 width={180}
// //                 height={280}
// //                 priority
// //                 className="tk-student-character"
// //               />

// //               <span className="tk-you-label">
// //                 YOU
// //               </span>
// //             </motion.div>
// //           </div>
// //         </motion.div>

// //         {/* =================================================
// //             FULL MAP BUTTON
// //         ================================================= */}

// //         <AnimatePresence>
// //           {focusedWorld !==
// //             null &&
// //           !entering ? (
// //             <motion.button
// //               type="button"
// //               className="tk-full-map-btn"
// //               initial={{
// //                 opacity: 0,
// //                 y: -8,
// //               }}
// //               animate={{
// //                 opacity: 1,
// //                 y: 0,
// //               }}
// //               exit={{
// //                 opacity: 0,
// //                 y: -8,
// //               }}
// //               onClick={
// //                 showWholeWorld
// //               }
// //             >
// //               ← FULL MAP
// //             </motion.button>
// //           ) : null}
// //         </AnimatePresence>

// //         {/* =================================================
// //             MISS JULIE

// //             Fixed requested:
// //             /miss-julie-welcome.png

// //             Positioned underneath Talkora board.
// //         ================================================= */}

// //         <motion.aside
// //           className="tk-julie"
// //           initial={{
// //             opacity: 0,
// //             x: -18,
// //             y: 15,
// //           }}
// //           animate={{
// //             opacity: 1,

// //             x:
// //               focusedWorld ===
// //               null
// //                 ? pointer.x *
// //                   5
// //                 : 0,

// //             y:
// //               focusedWorld ===
// //               null
// //                 ? pointer.y *
// //                   3
// //                 : 0,
// //           }}
// //           transition={{
// //             type: 'spring',
// //             stiffness: 54,
// //             damping: 20,
// //           }}
// //         >
// //           {/* MISS JULIE FULL-BODY */}

// //           <motion.div
// //             className="tk-julie-character"
// //             animate={{
// //               y: [
// //                 0,
// //                 -5,
// //                 0,
// //               ],

// //               rotate:
// //                 voiceState ===
// //                 'speaking'
// //                   ? [
// //                       0,
// //                       -0.7,
// //                       0.7,
// //                       0,
// //                     ]
// //                   : 0,
// //             }}
// //             transition={{
// //               y: {
// //                 duration: 4,
// //                 repeat:
// //                   Infinity,
// //                 ease:
// //                   'easeInOut',
// //               },

// //               rotate: {
// //                 duration: 1.6,
// //                 repeat:
// //                   voiceState ===
// //                   'speaking'
// //                     ? Infinity
// //                     : 0,
// //                 ease:
// //                   'easeInOut',
// //               },
// //             }}
// //           >
// //             <span className="tk-julie-ground-shadow" />

// //             <Image
// //               src={
// //                 MISS_JULIE_IMAGE
// //               }
// //               alt="Miss Julie"
// //               width={300}
// //               height={460}
// //               priority
// //               className="tk-julie-img"
// //             />
// //           </motion.div>

// //           {/* TALKING BUBBLE */}

// //           <motion.div
// //             className="tk-julie-bubble"
// //             initial={{
// //               opacity: 0,
// //               x: -15,
// //               scale: 0.9,
// //             }}
// //             animate={{
// //               opacity: 1,
// //               x: 0,
// //               scale: 1,
// //             }}
// //             transition={{
// //               delay: 0.3,
// //               duration: 0.5,
// //               ease: 'easeOut',
// //             }}
// //           >
// //             <div className="tk-julie-header">
// //               <div>
// //                 <span>
// //                   MISS JULIE
// //                 </span>

// //                 <small>
// //                   YOUR ENGLISH GUIDE
// //                 </small>
// //               </div>

// //               <button
// //                 type="button"
// //                 aria-label={
// //                   voiceState ===
// //                   'speaking'
// //                     ? 'Stop Miss Julie'
// //                     : 'Hear Miss Julie'
// //                 }
// //                 onClick={() => {
// //                   if (
// //                     voiceState ===
// //                     'speaking'
// //                   ) {
// //                     stopJulie()

// //                     return
// //                   }

// //                   void speakJulie(
// //                     julieMessage ||
// //                       displayedJulieMessage,
// //                   )
// //                 }}
// //               >
// //                 {voiceState ===
// //                 'loading' ? (
// //                   <LoaderCircle
// //                     size={16}
// //                     className="tk-spin"
// //                   />
// //                 ) : voiceState ===
// //                   'speaking' ? (
// //                   <VolumeX
// //                     size={16}
// //                   />
// //                 ) : (
// //                   <Volume2
// //                     size={16}
// //                   />
// //                 )}
// //               </button>
// //             </div>

// //             <p>
// //               {
// //                 displayedJulieMessage
// //               }

// //               <span className="tk-julie-cursor">
// //                 |
// //               </span>
// //             </p>

// //             {voiceState ===
// //             'speaking' ? (
// //               <div className="tk-sound-wave">
// //                 <i />
// //                 <i />
// //                 <i />
// //                 <i />
// //                 <i />
// //               </div>
// //             ) : null}

// //             {voiceError ? (
// //               <small className="tk-voice-error">
// //                 Tap the speaker to
// //                 hear me.
// //               </small>
// //             ) : null}
// //           </motion.div>
// //         </motion.aside>

// //         {/* =================================================
// //             ENTERING LEVEL
// //         ================================================= */}

// //         <AnimatePresence>
// //           {entering ? (
// //             <motion.div
// //               className="tk-entering"
// //               initial={{
// //                 opacity: 0,
// //               }}
// //               animate={{
// //                 opacity: 1,
// //               }}
// //               exit={{
// //                 opacity: 0,
// //               }}
// //               transition={{
// //                 duration: 0.55,
// //               }}
// //             >
// //               <motion.div
// //                 initial={{
// //                   opacity: 0,
// //                   y: 20,
// //                   scale: 0.78,
// //                 }}
// //                 animate={{
// //                   opacity: 1,
// //                   y: 0,
// //                   scale: 1,
// //                 }}
// //                 transition={{
// //                   delay: 0.12,
// //                   duration: 0.42,
// //                 }}
// //               >
// //                 <motion.span
// //                   animate={{
// //                     rotate: [
// //                       -6,
// //                       6,
// //                       -6,
// //                     ],

// //                     scale: [
// //                       1,
// //                       1.15,
// //                       1,
// //                     ],
// //                   }}
// //                   transition={{
// //                     duration: 1.2,
// //                     repeat:
// //                       Infinity,
// //                   }}
// //                 >
// //                   <Sparkles
// //                     size={28}
// //                   />
// //                 </motion.span>

// //                 <small>
// //                   ENTERING ADVENTURE
// //                 </small>

// //                 <strong>
// //                   {
// //                     selectedWorld.name
// //                   }
// //                 </strong>
// //               </motion.div>
// //             </motion.div>
// //           ) : null}
// //         </AnimatePresence>
// //       </section>

// //       <AdventureStyles />
// //     </div>
// //   )
// // }

// // function AdventureStyles() {
// //   return (
// //     <style jsx global>{`
// //       /* =====================================================
// //          FULL SCREEN TAKEOVER

// //          Covers the old parent dashboard header,
// //          XP, stars, streak, etc.
// //       ===================================================== */

// //       .tk-map {
// //         position: fixed;
// //         inset: 0;

// //         z-index: 9999;

// //         width: 100vw;
// //         height: 100dvh;
// //         min-height: 100dvh;

// //         overflow: hidden;

// //         background: #0b1a14;

// //         isolation: isolate;
// //       }

// //       .tk-map-stage {
// //         position: absolute;
// //         inset: 0;

// //         width: 100%;
// //         height: 100%;

// //         overflow: hidden;

// //         perspective: 1500px;

// //         background: #10251c;
// //       }

// //       /* =====================================================
// //          LOADING
// //       ===================================================== */

// //       .tk-map-loading {
// //         position: fixed;
// //         inset: 0;

// //         z-index: 10050;

// //         width: 100vw;
// //         height: 100dvh;

// //         overflow: hidden;

// //         background:
// //           radial-gradient(
// //             circle at 50% 42%,
// //             rgba(45, 120, 78, 0.24),
// //             transparent 32%
// //           ),
// //           linear-gradient(
// //             180deg,
// //             #0a251d,
// //             #071b18 58%,
// //             #061512
// //           );

// //         isolation: isolate;
// //       }

// //       .tk-map-loading-logo {
// //         position: fixed;

// //         z-index: 11000;

// //         top: 30px;
// //         left: 50%;

// //         width: clamp(
// //           130px,
// //           13vw,
// //           210px
// //         );

// //         transform:
// //           translateX(-50%);

// //         pointer-events: none;

// //         filter:
// //           drop-shadow(
// //             0 14px 17px
// //             rgba(0,0,0,.3)
// //           );
// //       }

// //       .tk-loader-logo-image {
// //         display: block;

// //         width: 100%;
// //         height: auto;
// //       }

// //       /* =====================================================
// //          MAP CAMERA
// //       ===================================================== */

// //       .tk-world-camera {
// //         position: absolute;

// //         inset: 0;

// //         z-index: 1;

// //         width: 100%;
// //         height: 100%;

// //         transform-style:
// //           preserve-3d;

// //         transform-origin:
// //           center center;

// //         will-change:
// //           transform;
// //       }

// //       .tk-world-bg {
// //         position: absolute;

// //         inset: -1%;

// //         width: 102%;
// //         height: 102%;

// //         transform:
// //           translateZ(-35px)
// //           scale(1.018);
// //       }

// //       .tk-world-bg-image {
// //         width: 100% !important;
// //         height: 100% !important;

// //         object-fit: cover;

// //         object-position:
// //           center center;

// //         filter:
// //           saturate(1.05)
// //           contrast(1.025)
// //           brightness(0.98);
// //       }

// //       .tk-world-depth-overlay {
// //         position: absolute;

// //         inset: 0;

// //         z-index: 2;

// //         pointer-events: none;

// //         background:
// //           linear-gradient(
// //             180deg,
// //             rgba(2,13,10,.02),
// //             transparent 38%,
// //             rgba(2,12,8,.10)
// //           ),
// //           radial-gradient(
// //             ellipse at center,
// //             transparent 60%,
// //             rgba(2,9,6,.08)
// //           );
// //       }

// //       /* =====================================================
// //          SMALL HOVER SIDEBAR
// //       ===================================================== */

// //       .tk-mini-sidebar {
// //         position: fixed;

// //         z-index: 5000;

// //         top: 14px;
// //         left: 14px;
// //         bottom: 14px;

// //         width: 62px;

// //         padding: 8px;

// //         display: flex;

// //         flex-direction:
// //           column;

// //         overflow: hidden;

// //         border:
// //           1px solid
// //           rgba(255,255,255,.17);

// //         border-radius:
// //           21px;

// //         background:
// //           rgba(3,18,24,.74);

// //         backdrop-filter:
// //           blur(16px);

// //         -webkit-backdrop-filter:
// //           blur(16px);

// //         box-shadow:
// //           0 16px 40px
// //           rgba(0,0,0,.31);

// //         transition:
// //           width
// //           .38s
// //           cubic-bezier(
// //             .22,
// //             1,
// //             .36,
// //             1
// //           ),
// //           background
// //           .28s ease,
// //           box-shadow
// //           .28s ease;
// //       }

// //       .tk-mini-sidebar:hover {
// //         width: 196px;

// //         background:
// //           rgba(3,18,24,.94);

// //         box-shadow:
// //           0 20px 58px
// //           rgba(0,0,0,.42);
// //       }

// //       .tk-mini-logo {
// //         width: 100%;
// //         min-height: 47px;

// //         padding: 0 2px;

// //         display: flex;

// //         align-items:
// //           center;

// //         gap: 12px;

// //         border: 0;

// //         color: white;

// //         background:
// //           transparent;

// //         cursor: pointer;
// //       }

// //       .tk-mini-logo-art {
// //         width: 44px;
// //         min-width: 44px;
// //         height: 44px;

// //         padding: 3px;

// //         display: grid;

// //         place-items:
// //           center;

// //         overflow: hidden;

// //         border:
// //           1px solid
// //           rgba(255,255,255,.18);

// //         border-radius:
// //           14px;

// //         background:
// //           rgba(3,13,22,.62);

// //         box-shadow:
// //           0 8px 18px
// //           rgba(0,0,0,.3);
// //       }

// //       .tk-mini-logo-image {
// //         display: block;

// //         width: 39px;

// //         max-width: 39px;

// //         height: auto;

// //         object-fit:
// //           contain;
// //       }

// //       .tk-mini-label,
// //       .tk-mini-nav
// //         button span,
// //       .tk-mini-bottom
// //         button span {
// //         opacity: 0;

// //         transform:
// //           translateX(-8px);

// //         white-space:
// //           nowrap;

// //         transition:
// //           opacity
// //           .23s ease,
// //           transform
// //           .32s ease;
// //       }

// //       .tk-mini-label {
// //         color:
// //           #fff4ae;

// //         font-size: 12px;

// //         font-weight: 1000;

// //         letter-spacing:
// //           .1em;
// //       }

// //       .tk-mini-sidebar:hover
// //         .tk-mini-label,
// //       .tk-mini-sidebar:hover
// //         .tk-mini-nav
// //         button span,
// //       .tk-mini-sidebar:hover
// //         .tk-mini-bottom
// //         button span {
// //         opacity: 1;

// //         transform:
// //           translateX(0);
// //       }

// //       .tk-mini-nav {
// //         margin-top: 24px;

// //         display: flex;

// //         flex-direction:
// //           column;

// //         gap: 6px;
// //       }

// //       .tk-mini-bottom {
// //         margin-top: auto;
// //       }

// //       .tk-mini-nav button,
// //       .tk-mini-bottom button {
// //         width: 100%;
// //         height: 46px;

// //         padding: 0 11px;

// //         display: flex;

// //         align-items:
// //           center;

// //         gap: 12px;

// //         border:
// //           1px solid
// //           transparent;

// //         border-radius:
// //           14px;

// //         color:
// //           rgba(
// //             255,
// //             255,
// //             255,
// //             .72
// //           );

// //         background:
// //           transparent;

// //         cursor: pointer;

// //         transition:
// //           color
// //             .22s ease,
// //           background
// //             .22s ease,
// //           border-color
// //             .22s ease,
// //           transform
// //             .22s ease;
// //       }

// //       .tk-mini-nav button:hover,
// //       .tk-mini-bottom button:hover {
// //         color: white;

// //         background:
// //           rgba(
// //             255,
// //             255,
// //             255,
// //             .09
// //           );

// //         transform:
// //           translateX(2px);
// //       }

// //       .tk-mini-nav
// //         button.active {
// //         color:
// //           #70ddff;

// //         border-color:
// //           rgba(
// //             81,
// //             213,
// //             255,
// //             .34
// //           );

// //         background:
// //           linear-gradient(
// //             135deg,
// //             rgba(
// //               8,
// //               168,
// //               225,
// //               .24
// //             ),
// //             rgba(
// //               31,
// //               101,
// //               182,
// //               .15
// //             )
// //           );

// //         box-shadow:
// //           inset
// //           0 0 15px
// //           rgba(
// //             37,
// //             184,
// //             255,
// //             .08
// //           );
// //       }

// //       .tk-mini-nav svg,
// //       .tk-mini-bottom svg {
// //         min-width: 20px;
// //       }

// //       .tk-mini-nav
// //         button span,
// //       .tk-mini-bottom
// //         button span {
// //         font-size: 11px;

// //         font-weight: 850;
// //       }

// //       /* =====================================================
// //          LEVELS
// //       ===================================================== */

// //       .tk-level-layer {
// //         position: absolute;

// //         inset: 0;

// //         z-index: 20;

// //         transform-style:
// //           preserve-3d;
// //       }

// //       .tk-level-anchor {
// //         position: absolute;

// //         z-index: 22;

// //         transform:
// //           translate(
// //             -50%,
// //             -50%
// //           );

// //         pointer-events:
// //           none;
// //       }

// //       .tk-level {
// //         position: relative;

// //         min-width: 145px;

// //         padding: 0;

// //         display: flex;

// //         flex-direction:
// //           column;

// //         align-items:
// //           center;

// //         border: 0;

// //         color: white;

// //         background:
// //           transparent;

// //         cursor: pointer;

// //         pointer-events:
// //           auto;

// //         transform-style:
// //           preserve-3d;
// //       }

// //       .tk-level-ground-shadow {
// //         position: absolute;

// //         top: 41px;
// //         left: 50%;

// //         z-index: -1;

// //         width: 74px;
// //         height: 26px;

// //         border-radius: 50%;

// //         background:
// //           rgba(
// //             1,
// //             7,
// //             5,
// //             .42
// //           );

// //         filter:
// //           blur(5px);

// //         transform:
// //           translateX(-50%)
// //           rotateX(67deg);
// //       }

// //       .tk-level-orb {
// //         position: relative;

// //         z-index: 5;

// //         width: 59px;
// //         height: 59px;

// //         display: grid;

// //         place-items:
// //           center;

// //         border:
// //           4px solid
// //           rgba(
// //             255,
// //             250,
// //             218,
// //             .98
// //           );

// //         border-radius:
// //           50%;

// //         color:
// //           #25321e;

// //         background:
// //           radial-gradient(
// //             circle at
// //               33% 26%,
// //             #fff7ad,
// //             #ffdc4f
// //               49%,
// //             #e69e1d
// //               100%
// //           );

// //         box-shadow:
// //           0 8px 0
// //             #8b601b,
// //           0 13px 25px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .34
// //             ),
// //           inset
// //             4px 5px 8px
// //             rgba(
// //               255,
// //               255,
// //               255,
// //               .54
// //             );

// //         font-size: 17px;

// //         font-weight: 1000;

// //         transition:
// //           filter
// //             .2s ease,
// //           box-shadow
// //             .2s ease;
// //       }

// //       .tk-level:hover
// //         .tk-level-orb {
// //         filter:
// //           brightness(1.05);

// //         box-shadow:
// //           0 7px 0
// //             #8b601b,
// //           0 0 31px
// //             rgba(
// //               255,
// //               218,
// //               58,
// //               .42
// //             ),
// //           0 16px 25px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .32
// //             );
// //       }

// //       .tk-level.is-current
// //         .tk-level-orb {
// //         width: 72px;
// //         height: 72px;

// //         background:
// //           radial-gradient(
// //             circle at
// //               34% 25%,
// //             #ffffdd,
// //             #ffe753
// //               48%,
// //             #f4aa22
// //               100%
// //           );

// //         box-shadow:
// //           0 9px 0
// //             #8c6119,
// //           0 0 0 9px
// //             rgba(
// //               255,
// //               223,
// //               70,
// //               .18
// //             ),
// //           0 0 35px
// //             rgba(
// //               255,
// //               214,
// //               52,
// //               .56
// //             ),
// //           0 16px 29px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .34
// //             );
// //       }

// //       .tk-level.is-completed
// //         .tk-level-orb {
// //         color:
// //           #153921;

// //         background:
// //           radial-gradient(
// //             circle at
// //               34% 27%,
// //             #ddffd3,
// //             #6fd07e
// //           );

// //         box-shadow:
// //           0 8px 0
// //             #346d39,
// //           0 14px 24px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .3
// //             );
// //       }

// //       .tk-level.is-locked
// //         .tk-level-orb {
// //         width: 51px;
// //         height: 51px;

// //         color:
// //           #dde8df;

// //         border-color:
// //           rgba(
// //             227,
// //             237,
// //             224,
// //             .72
// //           );

// //         background:
// //           radial-gradient(
// //             circle at
// //               34% 28%,
// //             #67776b,
// //             #344238
// //           );

// //         box-shadow:
// //           0 7px 0
// //             #1b261d,
// //           0 12px 22px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .34
// //             );
// //       }

// //       .tk-level.is-selected
// //         .tk-level-name {
// //         transform:
// //           translateY(2px)
// //           scale(1.025);
// //       }

// //       /* =====================================================
// //          CURRENT PULSE
// //       ===================================================== */

// //       .tk-level-pulse {
// //         position: absolute;

// //         z-index: 1;

// //         top: -10px;
// //         left: 50%;

// //         width: 92px;
// //         height: 92px;

// //         border:
// //           3px solid
// //           rgba(
// //             255,
// //             221,
// //             75,
// //             .88
// //           );

// //         border-radius:
// //           50%;

// //         transform:
// //           translateX(-50%);

// //         pointer-events:
// //           none;
// //       }

// //       /* =====================================================
// //          LEVEL NAME
// //       ===================================================== */

// //       .tk-level-name {
// //         position: relative;

// //         z-index: 6;

// //         min-width: 138px;
// //         max-width: 185px;

// //         margin-top: 9px;

// //         padding:
// //           8px 11px;

// //         border:
// //           1px solid
// //           rgba(
// //             255,
// //             238,
// //             184,
// //             .25
// //           );

// //         border-radius:
// //           13px;

// //         color:
// //           #fffef4;

// //         background:
// //           linear-gradient(
// //             145deg,
// //             rgba(
// //               14,
// //               29,
// //               19,
// //               .91
// //             ),
// //             rgba(
// //               5,
// //               19,
// //               13,
// //               .87
// //             )
// //           );

// //         backdrop-filter:
// //           blur(8px);

// //         box-shadow:
// //           0 6px 0
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .19
// //             ),
// //           0 11px 23px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .27
// //             );

// //         text-align:
// //           center;

// //         transition:
// //           transform
// //           .22s ease,
// //           background
// //           .22s ease;
// //       }

// //       .tk-level-name strong {
// //         display: block;

// //         font-size: 14px;

// //         line-height: 1.05;

// //         font-weight: 1000;

// //         text-shadow:
// //           0 2px 4px
// //           rgba(
// //             0,
// //             0,
// //             0,
// //             .4
// //           );
// //       }

// //       .tk-level-name small {
// //         display: block;

// //         margin-top: 4px;

// //         color:
// //           #ffe37d;

// //         font-size: 8px;

// //         line-height: 1.2;

// //         font-weight: 800;
// //       }

// //       .tk-level.is-current
// //         .tk-level-name {
// //         border-color:
// //           rgba(
// //             255,
// //             221,
// //             76,
// //             .66
// //           );

// //         background:
// //           linear-gradient(
// //             145deg,
// //             rgba(
// //               40,
// //               43,
// //               18,
// //               .95
// //             ),
// //             rgba(
// //               10,
// //               28,
// //               17,
// //               .94
// //             )
// //           );

// //         box-shadow:
// //           0 6px 0
// //             rgba(
// //               83,
// //               62,
// //               15,
// //               .62
// //             ),
// //           0 0 23px
// //             rgba(
// //               255,
// //               216,
// //               62,
// //               .20
// //             ),
// //           0 14px 27px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .33
// //             );
// //       }

// //       .tk-level.is-locked
// //         .tk-level-name {
// //         opacity: .78;
// //       }

// //       /* =====================================================
// //          FULL BODY STUDENT
// //       ===================================================== */

// //       .tk-student-anchor {
// //         position: absolute;

// //         z-index: 28;

// //         transform:
// //           translate(
// //             -50%,
// //             -100%
// //           );

// //         pointer-events:
// //           none;
// //       }

// //       .tk-you-marker {
// //         position: relative;

// //         width: clamp(
// //           69px,
// //           5.4vw,
// //           98px
// //         );

// //         height: clamp(
// //           120px,
// //           17vh,
// //           170px
// //         );

// //         display: flex;

// //         align-items:
// //           flex-end;

// //         justify-content:
// //           center;

// //         transform-origin:
// //           bottom center;

// //         filter:
// //           drop-shadow(
// //             0 10px 8px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .30
// //             )
// //           );
// //       }

// //       .tk-student-character {
// //         position: relative;

// //         z-index: 3;

// //         display: block;

// //         width: 100%;
// //         height: 100%;

// //         object-fit:
// //           contain;

// //         object-position:
// //           bottom center;
// //       }

// //       .tk-student-shadow {
// //         position: absolute;

// //         z-index: 1;

// //         left: 50%;
// //         bottom: 2px;

// //         width: 72%;
// //         height: 16px;

// //         border-radius:
// //           50%;

// //         background:
// //           rgba(
// //             6,
// //             23,
// //             12,
// //             .43
// //           );

// //         filter:
// //           blur(5px);

// //         transform:
// //           translateX(-50%);
// //       }

// //       .tk-you-label {
// //         position: absolute;

// //         z-index: 5;

// //         left: 50%;
// //         bottom: -16px;

// //         transform:
// //           translateX(-50%);

// //         padding:
// //           4px 8px;

// //         border:
// //           2px solid
// //           rgba(
// //             255,
// //             255,
// //             255,
// //             .68
// //           );

// //         border-radius:
// //           999px;

// //         color:
// //           #172319;

// //         background:
// //           #ffe263;

// //         box-shadow:
// //           0 4px 0
// //             rgba(
// //               126,
// //               88,
// //               23,
// //               .72
// //             ),
// //           0 7px 13px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .23
// //             );

// //         font-size: 7px;

// //         font-weight: 1000;

// //         letter-spacing:
// //           .08em;
// //       }

// //       /* =====================================================
// //          MISS JULIE

// //          Under TALKORA board.
// //       ===================================================== */

// //       .tk-julie {
// //         position: absolute;

// //         z-index: 90;

// //         top: 29%;
// //         left: 16.5%;

// //         display: flex;

// //         align-items:
// //           flex-start;

// //         gap: 5px;

// //         pointer-events:
// //           none;
// //       }

// //       .tk-julie-character {
// //         position: relative;

// //         width: clamp(
// //           115px,
// //           9vw,
// //           160px
// //         );

// //         height: clamp(
// //           190px,
// //           27vh,
// //           250px
// //         );

// //         display: flex;

// //         align-items:
// //           flex-end;

// //         justify-content:
// //           center;
// //       }

// //       .tk-julie-img {
// //         position: relative;

// //         z-index: 3;

// //         display: block;

// //         width: 100%;
// //         height: 100%;

// //         object-fit:
// //           contain;

// //         object-position:
// //           bottom center;

// //         filter:
// //           drop-shadow(
// //             0 15px 12px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .38
// //             )
// //           );
// //       }

// //       .tk-julie-ground-shadow {
// //         position: absolute;

// //         z-index: 1;

// //         left: 50%;
// //         bottom: 1px;

// //         width: 72%;
// //         height: 19px;

// //         border-radius: 50%;

// //         background:
// //           rgba(
// //             5,
// //             21,
// //             12,
// //             .37
// //           );

// //         filter:
// //           blur(6px);

// //         transform:
// //           translateX(-50%);
// //       }

// //       /* =====================================================
// //          JULIE BUBBLE
// //       ===================================================== */

// //       .tk-julie-bubble {
// //         position: relative;

// //         width: clamp(
// //           250px,
// //           23vw,
// //           390px
// //         );

// //         margin-top: 22px;

// //         padding:
// //           14px 15px;

// //         border:
// //           3px solid
// //           #e8c4c7;

// //         border-radius:
// //           19px
// //           19px
// //           19px
// //           6px;

// //         color:
// //           #21362a;

// //         background:
// //           rgba(
// //             255,
// //             249,
// //             234,
// //             .97
// //           );

// //         backdrop-filter:
// //           blur(5px);

// //         box-shadow:
// //           0 8px 0
// //             rgba(
// //               160,
// //               102,
// //               105,
// //               .17
// //             ),
// //           0 20px 35px
// //             rgba(
// //               0,
// //               0,
// //               0,
// //               .29
// //             );

// //         pointer-events:
// //           auto;
// //       }

// //       .tk-julie-bubble::before {
// //         content: '';

// //         position: absolute;

// //         left: -13px;
// //         top: 35px;

// //         width: 24px;
// //         height: 24px;

// //         background:
// //           #fff9ea;

// //         border-left:
// //           3px solid
// //           #e8c4c7;

// //         border-bottom:
// //           3px solid
// //           #e8c4c7;

// //         transform:
// //           rotate(45deg);
// //       }

// //       .tk-julie-header {
// //         position: relative;

// //         z-index: 2;

// //         display: flex;

// //         align-items:
// //           center;

// //         justify-content:
// //           space-between;

// //         gap: 12px;
// //       }

// //       .tk-julie-header
// //         > div {
// //         display: flex;

// //         flex-direction:
// //           column;
// //       }

// //       .tk-julie-header
// //         > div > span {
// //         color:
// //           #d75f7c;

// //         font-size: 8px;

// //         font-weight: 1000;

// //         letter-spacing:
// //           .14em;
// //       }

// //       .tk-julie-header
// //         > div > small {
// //         margin-top: 2px;

// //         color:
// //           #957278;

// //         font-size: 6px;

// //         font-weight: 900;

// //         letter-spacing:
// //           .10em;
// //       }

// //       .tk-julie-header
// //         button {
// //         width: 32px;
// //         min-width: 32px;
// //         height: 32px;

// //         display: grid;

// //         place-items:
// //           center;

// //         border: 0;

// //         border-radius:
// //           50%;

// //         color:
// //           #26362a;

// //         background:
// //           rgba(
// //             30,
// //             51,
// //             34,
// //             .09
// //           );

// //         cursor: pointer;

// //         transition:
// //           transform
// //           .2s ease,
// //           background
// //           .2s ease;
// //       }

// //       .tk-julie-header
// //         button:hover {
// //         transform:
// //           scale(1.1);

// //         background:
// //           rgba(
// //             30,
// //             51,
// //             34,
// //             .16
// //           );
// //       }

// //       .tk-julie-bubble p {
// //         position: relative;

// //         z-index: 2;

// //         min-height: 40px;

// //         margin:
// //           8px 0 0;

// //         font-size: 12px;

// //         font-weight: 760;

// //         line-height: 1.48;
// //       }

// //       .tk-julie-cursor {
// //         display: inline-block;

// //         margin-left: 1px;

// //         color:
// //           #d75f7c;

// //         animation:
// //           tkCursor
// //           .68s
// //           steps(1)
// //           infinite;
// //       }

// //       @keyframes tkCursor {
// //         50% {
// //           opacity: 0;
// //         }
// //       }

// //       .tk-voice-error {
// //         display: block;

// //         margin-top: 5px;

// //         color:
// //           #9a757a;

// //         font-size: 8px;
// //       }

// //       /* =====================================================
// //          JULIE SOUND
// //       ===================================================== */

// //       .tk-sound-wave {
// //         position: relative;

// //         z-index: 2;

// //         height: 17px;

// //         margin-top: 7px;

// //         display: flex;

// //         align-items:
// //           center;

// //         gap: 3px;
// //       }

// //       .tk-sound-wave i {
// //         width: 3px;
// //         height: 6px;

// //         border-radius:
// //           999px;

// //         background:
// //           #d75f7c;

// //         animation:
// //           tkJulieWave
// //           .55s
// //           ease-in-out
// //           infinite;
// //       }

// //       .tk-sound-wave
// //         i:nth-child(2) {
// //         animation-delay:
// //           .08s;
// //       }

// //       .tk-sound-wave
// //         i:nth-child(3) {
// //         animation-delay:
// //           .16s;
// //       }

// //       .tk-sound-wave
// //         i:nth-child(4) {
// //         animation-delay:
// //           .24s;
// //       }

// //       .tk-sound-wave
// //         i:nth-child(5) {
// //         animation-delay:
// //           .32s;
// //       }

// //       @keyframes tkJulieWave {
// //         50% {
// //           height: 16px;
// //         }
// //       }

// //       .tk-spin {
// //         animation:
// //           tkSpin
// //           .9s
// //           linear
// //           infinite;
// //       }

// //       @keyframes tkSpin {
// //         to {
// //           transform:
// //             rotate(360deg);
// //         }
// //       }

// //       /* =====================================================
// //          FULL MAP BUTTON
// //       ===================================================== */

// //       .tk-full-map-btn {
// //         position: absolute;

// //         z-index: 120;

// //         top: 17px;
// //         left: 90px;

// //         min-height: 40px;

// //         padding:
// //           0 14px;

// //         border:
// //           1px solid
// //           rgba(
// //             255,
// //             234,
// //             174,
// //             .25
// //           );

// //         border-radius:
// //           999px;

// //         color:
// //           #fff9db;

// //         background:
// //           rgba(
// //             7,
// //             24,
// //             16,
// //             .79
// //           );

// //         backdrop-filter:
// //           blur(12px);

// //         box-shadow:
// //           0 10px 25px
// //           rgba(
// //             0,
// //             0,
// //             0,
// //             .25
// //           );

// //         font-size: 9px;

// //         font-weight: 1000;

// //         letter-spacing:
// //           .08em;

// //         cursor: pointer;

// //         transition:
// //           transform
// //           .2s ease,
// //           background
// //           .2s ease;
// //       }

// //       .tk-full-map-btn:hover {
// //         transform:
// //           translateY(-2px);

// //         background:
// //           rgba(
// //             7,
// //             30,
// //             19,
// //             .94
// //           );
// //       }

// //       /* =====================================================
// //          ENTER LEVEL CINEMATIC
// //       ===================================================== */

// //       .tk-entering {
// //         position: absolute;

// //         inset: 0;

// //         z-index: 9000;

// //         display: grid;

// //         place-items:
// //           center;

// //         background:
// //           radial-gradient(
// //             circle at center,
// //             rgba(
// //               69,
// //               129,
// //               74,
// //               .08
// //             ),
// //             rgba(
// //               1,
// //               9,
// //               6,
// //               .79
// //             )
// //           );

// //         backdrop-filter:
// //           blur(3px);
// //       }

// //       .tk-entering > div {
// //         display: flex;

// //         flex-direction:
// //           column;

// //         align-items:
// //           center;

// //         color: white;

// //         text-align:
// //           center;
// //       }

// //       .tk-entering
// //         svg {
// //         color:
// //           #ffe36a;
// //       }

// //       .tk-entering
// //         small {
// //         margin-top: 11px;

// //         color:
// //           #b6eac2;

// //         font-size: 9px;

// //         font-weight: 1000;

// //         letter-spacing:
// //           .18em;
// //       }

// //       .tk-entering
// //         strong {
// //         margin-top: 5px;

// //         font-size:
// //           clamp(
// //             26px,
// //             3vw,
// //             40px
// //           );

// //         text-shadow:
// //           0 5px 18px
// //           rgba(
// //             0,
// //             0,
// //             0,
// //             .42
// //           );
// //       }

// //       /* =====================================================
// //          ERROR
// //       ===================================================== */

// //       .tk-map-error {
// //         position: fixed;

// //         inset: 0;

// //         z-index: 10000;

// //         min-height:
// //           100dvh;

// //         display: grid;

// //         place-items:
// //           center;

// //         padding: 20px;

// //         color: white;

// //         background:
// //           #101915;
// //       }

// //       .tk-map-error
// //         > div {
// //         width:
// //           min(
// //             420px,
// //             100%
// //           );

// //         padding: 28px;

// //         border-radius:
// //           24px;

// //         background:
// //           #17271d;

// //         box-shadow:
// //           0 25px 50px
// //           rgba(
// //             0,
// //             0,
// //             0,
// //             .28
// //           );

// //         text-align:
// //           center;
// //       }

// //       .tk-error-logo {
// //         width: 120px;
// //         height: auto;

// //         margin:
// //           0 auto 16px;
// //       }

// //       .tk-map-error h1 {
// //         margin: 0;

// //         font-size: 28px;
// //       }

// //       .tk-map-error p {
// //         color:
// //           #bfd1c3;
// //       }

// //       .tk-map-error button {
// //         min-height: 44px;

// //         margin-top: 10px;

// //         padding:
// //           0 18px;

// //         border: 0;

// //         border-radius:
// //           13px;

// //         color:
// //           #172019;

// //         background:
// //           #ffe05c;

// //         font-weight: 900;

// //         cursor: pointer;
// //       }

// //       /* =====================================================
// //          TABLET
// //       ===================================================== */

// //       @media (
// //         max-width: 1050px
// //       ) {
// //         .tk-level-name {
// //           min-width: 112px;
// //           max-width: 145px;

// //           padding:
// //             7px 8px;
// //         }

// //         .tk-level-name
// //           strong {
// //           font-size: 11px;
// //         }

// //         .tk-level-name
// //           small {
// //           font-size: 7px;
// //         }

// //         .tk-julie {
// //           top: 28%;
// //           left: 13%;
// //         }

// //         .tk-julie-character {
// //           width: 105px;
// //           height: 178px;
// //         }

// //         .tk-julie-bubble {
// //           width: 210px;

// //           margin-top: 14px;
// //         }

// //         .tk-julie-bubble p {
// //           font-size: 10px;
// //         }

// //         .tk-you-marker {
// //           width: 72px;
// //           height: 125px;
// //         }
// //       }

// //       /* =====================================================
// //          SMALL TABLET / MOBILE
// //       ===================================================== */

// //       @media (
// //         max-width: 720px
// //       ) {
// //         .tk-map {
// //           width: 100vw;
// //           height: 100dvh;

// //           min-height:
// //             100dvh;
// //         }

// //         .tk-map-stage {
// //           position: absolute;

// //           inset: 0;

// //           width: 100%;
// //           height: 100%;
// //         }

// //         .tk-world-camera {
// //           /*
// //            * No 3D tilt on mobile.
// //            */
// //           rotate: 0deg;
// //         }

// //         .tk-mini-sidebar {
// //           top: 8px;
// //           left: 8px;
// //           bottom: 8px;

// //           width: 52px;

// //           padding: 5px;

// //           border-radius:
// //             17px;
// //         }

// //         .tk-mini-sidebar:hover {
// //           width: 168px;
// //         }

// //         .tk-mini-logo-art {
// //           width: 40px;
// //           min-width: 40px;
// //           height: 40px;

// //           border-radius:
// //             12px;
// //         }

// //         .tk-mini-logo-image {
// //           width: 35px;

// //           max-width:
// //             35px;
// //         }

// //         .tk-mini-nav {
// //           margin-top: 17px;

// //           gap: 4px;
// //         }

// //         .tk-mini-nav button,
// //         .tk-mini-bottom button {
// //           height: 42px;

// //           padding:
// //             0 9px;
// //         }

// //         .tk-level {
// //           min-width: 90px;
// //         }

// //         .tk-level-orb {
// //           width: 44px;
// //           height: 44px;

// //           border-width:
// //             3px;

// //           font-size: 12px;
// //         }

// //         .tk-level.is-current
// //           .tk-level-orb {
// //           width: 54px;
// //           height: 54px;
// //         }

// //         .tk-level.is-locked
// //           .tk-level-orb {
// //           width: 39px;
// //           height: 39px;
// //         }

// //         .tk-level-pulse {
// //           width: 68px;
// //           height: 68px;

// //           top: -7px;
// //         }

// //         .tk-level-name {
// //           min-width: 81px;
// //           max-width: 105px;

// //           margin-top: 5px;

// //           padding:
// //             5px 6px;

// //           border-radius:
// //             9px;
// //         }

// //         .tk-level-name
// //           strong {
// //           font-size: 8px;
// //         }

// //         .tk-level-name
// //           small {
// //           font-size: 6px;
// //         }

// //         .tk-student-anchor {
// //           transform:
// //             translate(
// //               -50%,
// //               -100%
// //             );
// //         }

// //         .tk-you-marker {
// //           width: 53px;

// //           height: 94px;
// //         }

// //         .tk-you-label {
// //           bottom: -13px;

// //           padding:
// //             3px 6px;

// //           font-size: 6px;
// //         }

// //         .tk-julie {
// //           top: 22%;
// //           left: 57px;

// //           gap: 1px;
// //         }

// //         .tk-julie-character {
// //           width: 75px;

// //           height: 128px;
// //         }

// //         .tk-julie-bubble {
// //           width:
// //             min(
// //               58vw,
// //               240px
// //             );

// //           margin-top: 8px;

// //           padding:
// //             9px 10px;

// //           border-width: 2px;
// //         }

// //         .tk-julie-bubble::before {
// //           left: -8px;
// //           top: 20px;

// //           width: 15px;
// //           height: 15px;

// //           border-width: 2px;
// //         }

// //         .tk-julie-bubble p {
// //           min-height: 30px;

// //           font-size: 9px;
// //         }

// //         .tk-julie-header
// //           button {
// //           width: 28px;
// //           min-width: 28px;
// //           height: 28px;
// //         }

// //         .tk-full-map-btn {
// //           top: 11px;
// //           left: 69px;

// //           min-height:
// //             35px;

// //           padding:
// //             0 10px;

// //           font-size: 7px;
// //         }

// //         .tk-map-loading-logo {
// //           top: 20px;

// //           width: 135px;
// //         }
// //       }

// //       /* =====================================================
// //          VERY SMALL MOBILE
// //       ===================================================== */

// //       @media (
// //         max-width: 480px
// //       ) {
// //         .tk-julie {
// //           top: 17%;
// //         }

// //         .tk-julie-character {
// //           width: 62px;

// //           height: 108px;
// //         }

// //         .tk-julie-bubble {
// //           width:
// //             min(
// //               62vw,
// //               220px
// //             );
// //         }

// //         .tk-level-name {
// //           display: none;
// //         }

// //         .tk-level {
// //           min-width: 55px;
// //         }

// //         .tk-you-marker {
// //           width: 45px;

// //           height: 80px;
// //         }
// //       }

// //       /* =====================================================
// //          REDUCED MOTION
// //       ===================================================== */

// //       @media (
// //         prefers-reduced-motion:
// //         reduce
// //       ) {
// //         *,
// //         *::before,
// //         *::after {
// //           animation-duration:
// //             .01ms !important;

// //           animation-iteration-count:
// //             1 !important;

// //           transition-duration:
// //             .01ms !important;
// //         }
// //       }
// //     `}</style>
// //   )
// // }


// 'use client'

// import Image from 'next/image'
// import { useRouter } from 'next/navigation'
// import {
//   type MouseEvent,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from 'react'

// import {
//   AnimatePresence,
//   motion,
// } from 'framer-motion'

// import {
//   BarChart3,
//   Home,
//   LoaderCircle,
//   Lock,
//   LogOut,
//   Map,
//   Sparkles,
//   Star,
//   Trophy,
//   User,
//   Volume2,
//   VolumeX,
// } from 'lucide-react'

// import {
//   TalkoraLoader,
// } from '@/components/student/talkora-loader'

// import {
//   TalkoraLogo,
// } from '@/components/brand/talkora-logo'

// import {
//   authService,
//   type AuthSession,
// } from '@/services/auth-service'

// import {
//   curriculumService,
//   type StudentCurriculum,
// } from '@/services/curriculum-service'

// import {
//   voiceService,
//   type VoicePlaybackState,
// } from '@/services/voice-service'

// type MapStatus =
//   | 'CURRENT'
//   | 'COMPLETED'
//   | 'LOCKED'
//   | 'UPCOMING'

// type World = {
//   number: number
//   id: string
//   name: string
//   syllabus: string
//   x: number
//   y: number
//   studentX: number
//   studentY: number
// }

// type PointerState = {
//   x: number
//   y: number
// }

// type CameraState = {
//   x: number
//   y: number
//   scale: number
// }

// /*
//  * SAVE NEW IMAGE HERE:
//  *
//  * client/public/assets/levelmap.png
//  */
// const MAP_BACKGROUND =
//   '/assets/levelmap.png'

// const MISS_JULIE_IMAGE =
//   '/miss-julie-welcome.png'

// const BOY_STUDENT_IMAGE =
//   '/talkora/characters/students/boy/canonical.png'

// const GIRL_STUDENT_IMAGE =
//   '/talkora/characters/students/girl/canonical.png'

// /*
//  * These positions are now arranged for the NEW jungle image.
//  *
//  * 1 = lower-left camp
//  * 2 = left bridge/platform
//  * 3 = centre bridge/path
//  * 4 = upper treehouse
//  * 5 = temple
//  * 6 = right jungle bridge
//  * 7 = lower-right stage
//  * 8 = final lower-right area
//  */
// const WORLDS: World[] = [
//   {
//     number: 1,
//     id: 'favourite-fair',
//     name: 'Favourite Fair',
//     syllabus: 'My Favourite Things',
//     // Bottom-left classroom camp stone.
//     x: 25.5,
//     y: 83.5,
//     // Student feet sit on the same sandy island, beside the button.
//     studentX: 20.4,
//     studentY: 86.2,
//   },
//   {
//     number: 2,
//     id: 'friendship-garden',
//     name: 'Friendship Garden',
//     syllabus: 'All About My Partner',
//     // Centre-left landing after the rope bridge.
//     x: 40.7,
//     y: 58.1,
//     studentX: 35.9,
//     studentY: 64.7,
//   },
//   {
//     number: 3,
//     id: 'talkora-cafe',
//     name: 'Talkora Café',
//     syllabus: 'Let’s Order',
//     // First treehouse platform.
//     x: 46.4,
//     y: 32.8,
//     studentX: 42.7,
//     studentY: 40.8,
//   },
//   {
//     number: 4,
//     id: 'calendar-town',
//     name: 'Calendar Town',
//     syllabus: 'On My Calendar',
//     // Second upper path stone.
//     x: 55.3,
//     y: 35.8,
//     studentX: 51.4,
//     studentY: 43.8,
//   },
//   {
//     number: 5,
//     id: 'helper-harbour',
//     name: 'Helper Harbour',
//     syllabus: 'Let Me Help You',
//     // Bridge-side stone leading towards the temple.
//     x: 64.4,
//     y: 40.1,
//     studentX: 60.6,
//     studentY: 47.5,
//   },
//   {
//     number: 6,
//     id: 'story-forest',
//     name: 'Story Forest',
//     syllabus: 'Familiar Folk Tales',
//     // Temple entrance stone.
//     x: 76.1,
//     y: 47.8,
//     studentX: 72.1,
//     studentY: 55.4,
//   },
//   {
//     number: 7,
//     id: 'special-moments-studio',
//     name: 'Memory Meadows',
//     syllabus: 'My Special Moment',
//     // Lower central path stone.
//     x: 61.4,
//     y: 75.6,
//     studentX: 56.8,
//     studentY: 82.5,
//   },
//   {
//     number: 8,
//     id: 'voices-for-good-theatre',
//     name: 'Voice Valley',
//     syllabus: 'Using Our Voices for Good',
//     // Final stage / learning tent stone.
//     x: 89.2,
//     y: 73.2,
//     studentX: 84.8,
//     studentY: 81.4,
//   },
// ]

// export default function AdventureMapPage() {
//   const router =
//     useRouter()

//   const greetedRef =
//     useRef(false)

//   const [
//     session,
//     setSession,
//   ] =
//     useState<AuthSession | null>(
//       null,
//     )

//   const [
//     curriculum,
//     setCurriculum,
//   ] =
//     useState<StudentCurriculum | null>(
//       null,
//     )

//   const [
//     selected,
//     setSelected,
//   ] =
//     useState(1)

//   const [
//     loading,
//     setLoading,
//   ] =
//     useState(true)

//   const [
//     error,
//     setError,
//   ] =
//     useState('')

//   const [
//     julieMessage,
//     setJulieMessage,
//   ] =
//     useState('')

//   const [
//     displayedJulieMessage,
//     setDisplayedJulieMessage,
//   ] = useState('')

//   const [
//     voiceState,
//     setVoiceState,
//   ] =
//     useState<VoicePlaybackState>(
//       'idle',
//     )

//   const [
//     voiceError,
//     setVoiceError,
//   ] =
//     useState('')

//   const [
//     pointer,
//     setPointer,
//   ] =
//     useState<PointerState>({
//       x: 0,
//       y: 0,
//     })

//   const [
//     camera,
//     setCamera,
//   ] =
//     useState<CameraState>({
//       x: 0,
//       y: 0,
//       scale: 1,
//     })

//   const [
//     focusedWorld,
//     setFocusedWorld,
//   ] =
//     useState<number | null>(
//       null,
//     )

//   const [
//     entering,
//     setEntering,
//   ] =
//     useState(false)

//   useEffect(() => {
//     let alive = true

//     async function load() {
//       try {
//         const auth =
//           await authService.getMe()

//         if (!alive) {
//           return
//         }

//         if (
//           !auth ||
//           auth.role !== 'STUDENT' ||
//           !auth.student
//         ) {
//           router.replace(
//             '/login/student',
//           )

//           return
//         }

//         setSession(auth)

//         const data =
//           await curriculumService.getMyCurriculum()

//         if (!alive) {
//           return
//         }

//         setCurriculum(data)
//         setLoading(false)
//       } catch (cause) {
//         if (!alive) {
//           return
//         }

//         console.error(
//           '[TALKORA ADVENTURE]',
//           cause,
//         )

//         setError(
//           cause instanceof Error
//             ? cause.message
//             : 'Failed to load your adventure.',
//         )

//         setLoading(false)
//       }
//     }

//     void load()

//     return () => {
//       alive = false

//       voiceService.stop()

//       if (
//         typeof window !==
//           'undefined' &&
//         'speechSynthesis' in window
//       ) {
//         window.speechSynthesis.cancel()
//       }
//     }
//   }, [router])

//   const student =
//     session?.student

//   const firstName =
//     student?.fullName
//       ?.trim()
//       .split(/\s+/)[0] ||
//     'Explorer'

//   const studentCharacter =
//     String(
//       student?.avatarType ??
//       '',
//     ).toUpperCase() === 'GIRL'
//       ? GIRL_STUDENT_IMAGE
//       : BOY_STUDENT_IMAGE

//   const currentUnit =
//     useMemo(() => {
//       return (
//         Number(
//           curriculum?.units.find(
//             (unit) =>
//               unit.status ===
//               'CURRENT',
//           )?.unitNumber,
//         ) || 1
//       )
//     }, [curriculum])

//   const currentWorld =
//     WORLDS.find(
//       (world) =>
//         world.number ===
//         currentUnit,
//     ) || WORLDS[0]

//   const selectedWorld =
//     WORLDS.find(
//       (world) =>
//         world.number ===
//         selected,
//     ) || currentWorld

//   function statusFor(
//     number: number,
//   ): MapStatus {
//     const unit =
//       curriculum?.units.find(
//         (item) =>
//           Number(
//             item.unitNumber,
//           ) === number,
//       )

//     return (
//       (unit?.status as
//         | MapStatus
//         | undefined) ??
//       'UPCOMING'
//     )
//   }

//   useEffect(() => {
//     setSelected(
//       currentUnit,
//     )
//   }, [currentUnit])

//   function handlePointerMove(
//     event: MouseEvent<HTMLElement>,
//   ) {
//     if (
//       focusedWorld !== null ||
//       entering
//     ) {
//       return
//     }

//     if (
//       typeof window !==
//         'undefined' &&
//       window.innerWidth < 850
//     ) {
//       return
//     }

//     const rect =
//       event.currentTarget.getBoundingClientRect()

//     const relativeX =
//       (event.clientX -
//         rect.left) /
//       rect.width

//     const relativeY =
//       (event.clientY -
//         rect.top) /
//       rect.height

//     setPointer({
//       x:
//         (relativeX - 0.5) *
//         2,

//       y:
//         (relativeY - 0.5) *
//         2,
//     })
//   }

//   function resetPointer() {
//     if (
//       focusedWorld !== null ||
//       entering
//     ) {
//       return
//     }

//     setPointer({
//       x: 0,
//       y: 0,
//     })
//   }

//   /*
//    * Camera moves scene in opposite direction
//    * so the selected point comes toward the centre.
//    */
//   function focusCamera(
//     world: World,
//     scale = 1.16,
//   ) {
//     const x =
//       (50 - world.x) *
//       5.2

//     const y =
//       (50 - world.y) *
//       3.5

//     setFocusedWorld(
//       world.number,
//     )

//     setPointer({
//       x: 0,
//       y: 0,
//     })

//     setCamera({
//       x,
//       y,
//       scale,
//     })
//   }

//   function showWholeWorld() {
//     if (entering) {
//       return
//     }

//     setFocusedWorld(
//       null,
//     )

//     setPointer({
//       x: 0,
//       y: 0,
//     })

//     setCamera({
//       x: 0,
//       y: 0,
//       scale: 1,
//     })
//   }

//   async function speakJulie(
//     message: string,
//   ) {
//     const cleaned =
//       message.trim()

//     if (!cleaned) {
//       return
//     }

//     setVoiceError('')

//     try {
//       await voiceService.speak(
//         cleaned,
//         (
//           state,
//           messageText,
//         ) => {
//           setVoiceState(
//             state,
//           )

//           if (
//             state === 'error'
//           ) {
//             setVoiceError(
//               messageText || 'Tap to listen to Miss Julie!',
//             )
//           }
//         },
//         undefined,
//         'PAGE_GUIDANCE',
//       )
//     } catch {
//       setVoiceState(
//         'idle',
//       )
//     }
//   }

//   function stopJulie() {
//     voiceService.stop()

//     if (
//       typeof window !==
//         'undefined' &&
//       'speechSynthesis' in window
//     ) {
//       window.speechSynthesis.cancel()
//     }

//     setVoiceState(
//       'idle',
//     )
//   }

//   /*
//    * Miss Julie always starts the experience.
//    */
//   useEffect(() => {
//     if (
//       !curriculum ||
//       !student ||
//       greetedRef.current
//     ) {
//       return
//     }

//     greetedRef.current =
//       true

//     const greeting =
//       `Hi ${firstName}! Welcome back to Talkora. ` +
//       `Our jungle adventure is ready! ` +
//       `Today we're continuing ${currentWorld.name}. ` +
//       `Come with me — I'll guide you!`

//     setJulieMessage(
//       greeting,
//     )

//     const timer =
//       window.setTimeout(
//         () => {
//           void speakJulie(
//             greeting,
//           )
//         },
//         650,
//       )

//     return () => {
//       window.clearTimeout(
//         timer,
//       )
//     }
//   }, [
//     curriculum,
//     student,
//     firstName,
//     currentWorld,
//   ])

//   useEffect(() => {
//     const message =
//       julieMessage ||
//       `Hi ${firstName}! Ready for today's adventure?`

//     setDisplayedJulieMessage('')

//     if (!message) {
//       return
//     }

//     let index = 0

//     const timer =
//       window.setInterval(() => {
//         index += 1
//         setDisplayedJulieMessage(
//           message.slice(0, index),
//         )

//         if (index >= message.length) {
//           window.clearInterval(timer)
//         }
//       }, 20)

//     return () => {
//       window.clearInterval(timer)
//     }
//   }, [julieMessage, firstName])

//   function beginWorld(
//     world: World,
//   ) {
//     const status =
//       statusFor(world.number)

//     if (
//       status !== 'CURRENT' &&
//       status !== 'COMPLETED'
//     ) {
//       return
//     }

//     setEntering(true)
//     setSelected(world.number)

//     const message =
//       status === 'COMPLETED'
//         ? `Amazing ${firstName}! Let's visit ${world.name} again.`
//         : `Come on ${firstName}! Let's begin ${world.name}!`

//     setJulieMessage(message)
//     void speakJulie(message)

//     /*
//      * IMPORTANT:
//      * /api/v1/lessons/:id expects a MongoDB Lesson ObjectId.
//      * The old map pushed the unit number (1, 2, 3...), which caused
//      * Mongoose to try Lesson.findById('1') and throw a CastError.
//      *
//      * The student curriculum already contains the real lesson ids,
//      * so enter the first unfinished lesson in this world. If the
//      * world is complete, revisit its first lesson.
//      */
//     const unit =
//       curriculum?.units.find(
//         (item) =>
//           Number(item.unitNumber) ===
//           world.number,
//       )

//     const targetLesson =
//       unit?.lessons.find(
//         (lesson) =>
//           !lesson.completed,
//       ) ??
//       unit?.lessons[0]

//     if (!targetLesson?.id) {
//       setEntering(false)

//       const unavailableMessage =
//         `${world.name} is ready on the map, but I could not find its lesson yet. ` +
//         `Please refresh once and try again.`

//       setJulieMessage(
//         unavailableMessage,
//       )

//       void speakJulie(
//         unavailableMessage,
//       )

//       return
//     }

//     focusCamera(world, 1.48)

//     window.setTimeout(() => {
//       router.push(
//         `/student/lesson/${targetLesson.id}`,
//       )
//     }, 850)
//   }

//   function chooseWorld(
//     world: World,
//   ) {
//     const status =
//       statusFor(world.number)

//     setSelected(world.number)

//     if (
//       status === 'CURRENT' ||
//       status === 'COMPLETED'
//     ) {
//       beginWorld(world)
//       return
//     }

//     focusCamera(world, 1.13)

//     if (status === 'LOCKED') {
//       const message =
//         `${world.name} is still locked. Finish ${currentWorld.name} first and we'll open this path together.`

//       setJulieMessage(message)
//       void speakJulie(message)
//       return
//     }

//     const message =
//       `${world.name} is waiting further inside the jungle. We'll reach it soon!`

//     setJulieMessage(message)
//     void speakJulie(message)
//   }

//   if (loading) {
//     return (
//       <div className="tk-map-loader">
//         <motion.div
//           className="tk-map-loader-logo"
//           initial={{
//             opacity: 0,
//             scale: 0.86,
//             y: 8,
//           }}
//           animate={{
//             opacity: 1,
//             scale: 1,
//             y: 0,
//           }}
//           transition={{
//             duration: 0.45,
//             ease: 'easeOut',
//           }}
//         >
//           <TalkoraLogo
//             className="tk-map-loader-logo-img"
//             priority
//           />
//         </motion.div>

//         <TalkoraLoader
//           message="Opening your English adventure..."
//           worldSrc={MAP_BACKGROUND}
//         />

//         <AdventureStyles />
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <main className="tk-map-error">
//         <div>
//           <h1>
//             Adventure paused
//           </h1>

//           <p>
//             {error}
//           </p>

//           <button
//             type="button"
//             onClick={() =>
//               window.location.reload()
//             }
//           >
//             Try again
//           </button>
//         </div>

//         <AdventureStyles />
//       </main>
//     )
//   }

//   return (
//     <div className="tk-map">
//       <motion.aside
//         className="tk-mini-sidebar"
//         initial={{
//           opacity: 0,
//           x: -28,
//         }}
//         animate={{
//           opacity: 1,
//           x: 0,
//         }}
//         transition={{
//           duration: 0.55,
//           ease: 'easeOut',
//         }}
//       >
//         <button
//           type="button"
//           className="tk-mini-logo"
//           onClick={() =>
//             router.push('/student')
//           }
//           aria-label="Talkora dashboard"
//         >
//           <span className="tk-mini-logo-art">
//             <TalkoraLogo
//               className="tk-mini-logo-image"
//               priority
//             />
//           </span>

//           <span className="tk-mini-label">
//             TALKORA
//           </span>
//         </button>

//         <nav className="tk-mini-nav">
//           <button
//             type="button"
//             onClick={() =>
//               router.push('/student')
//             }
//           >
//             <Home size={20} />
//             <span>Home</span>
//           </button>

//           <button
//             type="button"
//             className="active"
//           >
//             <Map size={20} />
//             <span>Adventures</span>
//           </button>

//           <button
//             type="button"
//             onClick={() =>
//               router.push('/student/achievements')
//             }
//           >
//             <Trophy size={20} />
//             <span>Achievements</span>
//           </button>

//           <button
//             type="button"
//             onClick={() =>
//               router.push('/student/progress')
//             }
//           >
//             <BarChart3 size={20} />
//             <span>Progress</span>
//           </button>

//           <button
//             type="button"
//             onClick={() =>
//               router.push('/student/profile')
//             }
//           >
//             <User size={20} />
//             <span>Profile</span>
//           </button>
//         </nav>

//         <div className="tk-mini-bottom">
//           <button
//             type="button"
//             onClick={() =>
//               router.push('/login/student')
//             }
//           >
//             <LogOut size={20} />
//             <span>Exit</span>
//           </button>
//         </div>
//       </motion.aside>
//       <section
//         className="tk-map-stage"
//         onMouseMove={
//           handlePointerMove
//         }
//         onMouseLeave={
//           resetPointer
//         }
//       >
//         {/* ====================================================
//             WORLD CAMERA
//         ==================================================== */}

//         <motion.div
//           className="tk-world-camera"
//           animate={{
//             x:
//               camera.x +
//               pointer.x *
//                 -18,

//             y:
//               camera.y +
//               pointer.y *
//                 -11,

//             scale:
//               camera.scale,

//             rotateY:
//               focusedWorld === null
//                 ? pointer.x *
//                   1.5
//                 : 0,

//             rotateX:
//               focusedWorld === null
//                 ? pointer.y *
//                   -0.9
//                 : 0,
//           }}
//           transition={{
//             type: 'spring',
//             stiffness:
//               focusedWorld === null
//                 ? 42
//                 : 58,
//             damping:
//               focusedWorld === null
//                 ? 26
//                 : 20,
//             mass: 0.72,
//           }}
//         >
//           {/* NEW JUNGLE IMAGE */}

//           <div className="tk-world-bg">
//             <Image
//               src={
//                 MAP_BACKGROUND
//               }
//               alt="Talkora jungle English adventure map"
//               fill
//               priority
//               sizes="100vw"
//               className="tk-world-bg-image"
//             />

//             <div className="tk-world-depth-overlay" />
//           </div>

//           {/* ==================================================
//               LEVEL DESTINATIONS

//               NO YELLOW RAIL.
//               NO SVG ROUTE.
//               THE IMAGE ITSELF HAS REAL PATHS + BRIDGES.
//           ================================================== */}

//           <div className="tk-level-layer">
//             {WORLDS.map(
//               (
//                 world,
//                 index,
//               ) => {
//                 const status =
//                   statusFor(
//                     world.number,
//                   )

//                 const current =
//                   status ===
//                   'CURRENT'

//                 const completed =
//                   status ===
//                   'COMPLETED'

//                 const locked =
//                   status ===
//                     'LOCKED' ||
//                   status ===
//                     'UPCOMING'

//                 const isSelected =
//                   selected ===
//                   world.number

//                 return (
//                   <motion.button
//                     key={
//                       world.id
//                     }
//                     type="button"
//                     className={[
//                       'tk-level',

//                       current
//                         ? 'is-current'
//                         : '',

//                       completed
//                         ? 'is-completed'
//                         : '',

//                       locked
//                         ? 'is-locked'
//                         : '',

//                       isSelected
//                         ? 'is-selected'
//                         : '',
//                     ]
//                       .filter(
//                         Boolean,
//                       )
//                       .join(' ')}
//                     style={{
//                       left: `${world.x}%`,
//                       top: `${world.y}%`,
//                     }}
//                     initial={{
//                       opacity: 0,
//                       scale:
//                         0.72,
//                       y: 22,
//                     }}
//                     animate={{
//                       opacity: 1,
//                       scale: 1,
//                       y: 0,
//                     }}
//                     transition={{
//                       delay:
//                         index *
//                         0.065,

//                       duration:
//                         0.42,
//                     }}
//                     whileHover={{
//                       y: -8,
//                       scale: 1.07,
//                     }}
//                     whileTap={{
//                       scale:
//                         0.96,
//                     }}
//                     onClick={() =>
//                       chooseWorld(
//                         world,
//                       )
//                     }
//                   >
//                     <span className="tk-level-ground-shadow" />

//                     {current ? (
//                       <>
//                         <motion.span
//                           className="tk-level-pulse pulse-a"
//                           animate={{
//                             scale: [
//                               0.8,
//                               1.6,
//                             ],

//                             opacity: [
//                               0.7,
//                               0,
//                             ],
//                           }}
//                           transition={{
//                             duration:
//                               2,

//                             repeat:
//                               Infinity,
//                           }}
//                         />

//                         <motion.span
//                           className="tk-level-pulse pulse-b"
//                           animate={{
//                             scale: [
//                               0.8,
//                               1.6,
//                             ],

//                             opacity: [
//                               0.7,
//                               0,
//                             ],
//                           }}
//                           transition={{
//                             duration:
//                               2,

//                             delay: 1,

//                             repeat:
//                               Infinity,
//                           }}
//                         />
//                       </>
//                     ) : null}

//                     <span className="tk-level-orb">
//                       {completed ? (
//                         <Star
//                           size={22}
//                           fill="currentColor"
//                         />
//                       ) : locked ? (
//                         <Lock
//                           size={20}
//                         />
//                       ) : (
//                         world.number
//                       )}
//                     </span>

//                     {/* BIGGER / READABLE LEVEL NAMES */}

//                     <span className="tk-level-name">
//                       <strong>
//                         {world.name}
//                       </strong>

//                       <small>
//                         {world.number}.
//                         {' '}
//                         {
//                           world.syllabus
//                         }
//                       </small>
//                     </span>
//                   </motion.button>
//                 )
//               },
//             )}
//           </div>

//           {/* ==================================================
//               STUDENT MARKER
//           ================================================== */}

//           <motion.div
//             className="tk-you-marker"
//             style={{
//               left: `${currentWorld.studentX}%`,
//               top: `${currentWorld.studentY}%`,
//             }}
//             animate={{
//               y: [
//                 0,
//                 -7,
//                 0,
//               ],
//             }}
//             transition={{
//               duration:
//                 2.4,

//               repeat:
//                 Infinity,

//               ease:
//                 'easeInOut',
//             }}
//           >
//             <div className="tk-you-character">
//               <Image
//                 src={studentCharacter}
//                 alt={`${firstName} student character`}
//                 width={180}
//                 height={260}
//                 priority
//                 className="tk-you-character-img"
//               />
//             </div>

//             <span>
//               YOU
//             </span>
//           </motion.div>
//         </motion.div>

//         {/* ====================================================
//             RETURN TO FULL WORLD
//         ==================================================== */}

//         <AnimatePresence>
//           {focusedWorld !==
//             null &&
//           !entering ? (
//             <motion.button
//               type="button"
//               className="tk-full-map-btn"
//               initial={{
//                 opacity: 0,
//                 y: -8,
//               }}
//               animate={{
//                 opacity: 1,
//                 y: 0,
//               }}
//               exit={{
//                 opacity: 0,
//               }}
//               onClick={
//                 showWholeWorld
//               }
//             >
//               <span>
//                 ←
//               </span>

//               FULL MAP
//             </motion.button>
//           ) : null}
//         </AnimatePresence>

//         {/* ====================================================
//             MISS JULIE

//             Foreground guide.
//         ==================================================== */}

//         <motion.aside
//           className="tk-julie"
//           initial={{
//             opacity: 0,
//             x: 30,
//           }}
//           animate={{
//             opacity: 1,

//             x:
//               focusedWorld === null
//                 ? pointer.x *
//                   8
//                 : 0,

//             y:
//               focusedWorld === null
//                 ? pointer.y *
//                   4
//                 : 0,
//           }}
//           transition={{
//             type: 'spring',
//             stiffness: 55,
//             damping: 20,
//           }}
//         >
//           <motion.div
//             className="tk-julie-character"
//             animate={{
//               y: [
//                 0,
//                 -5,
//                 0,
//               ],
//             }}
//             transition={{
//               duration: 4,
//               repeat:
//                 Infinity,
//               ease:
//                 'easeInOut',
//             }}
//           >
//             <Image
//               src={MISS_JULIE_IMAGE}
//               alt="Miss Julie"
//               width={250}
//               height={330}
//               priority
//               className="tk-julie-img"
//             />
//           </motion.div>

//           <div className="tk-julie-bubble">
//             <div className="tk-julie-header">
//               <span>
//                 MISS JULIE
//               </span>

//               <button
//                 type="button"
//                 aria-label={
//                   voiceState ===
//                   'speaking'
//                     ? 'Stop Miss Julie'
//                     : 'Hear Miss Julie'
//                 }
//                 onClick={() => {
//                   if (
//                     voiceState ===
//                     'speaking'
//                   ) {
//                     stopJulie()

//                     return
//                   }

//                   void speakJulie(
//                     julieMessage,
//                   )
//                 }}
//               >
//                 {voiceState ===
//                 'loading' ? (
//                   <LoaderCircle
//                     size={16}
//                     className="tk-spin"
//                   />
//                 ) : voiceState ===
//                   'speaking' ? (
//                   <VolumeX
//                     size={16}
//                   />
//                 ) : (
//                   <Volume2
//                     size={16}
//                   />
//                 )}
//               </button>
//             </div>

//             <p>
//               {displayedJulieMessage}
//               <span className="tk-julie-cursor">|</span>
//             </p>

//             {voiceState ===
//             'speaking' ? (
//               <div className="tk-sound-wave">
//                 <i />
//                 <i />
//                 <i />
//                 <i />
//                 <i />
//               </div>
//             ) : null}

//             {voiceError ? (
//               <small>
//                 Tap the speaker to
//                 hear me.
//               </small>
//             ) : null}
//           </div>
//         </motion.aside>

//         {/* ====================================================
//             ENTER WORLD CINEMATIC
//         ==================================================== */}

//         <AnimatePresence>
//           {entering ? (
//             <motion.div
//               className="tk-entering"
//               initial={{
//                 opacity: 0,
//               }}
//               animate={{
//                 opacity: 1,
//               }}
//               transition={{
//                 duration: 0.65,
//               }}
//             >
//               <motion.div
//                 initial={{
//                   opacity: 0,
//                   scale: 0.8,
//                   y: 15,
//                 }}
//                 animate={{
//                   opacity: 1,
//                   scale: 1,
//                   y: 0,
//                 }}
//               >
//                 <Sparkles
//                   size={23}
//                 />

//                 <span>
//                   ENTERING
//                 </span>

//                 <strong>
//                   {
//                     selectedWorld.name
//                   }
//                 </strong>
//               </motion.div>
//             </motion.div>
//           ) : null}
//         </AnimatePresence>
//       </section>

//       <AdventureStyles />
//     </div>
//   )
// }

// function AdventureStyles() {
//   return (
//     <style jsx global>{`
//       .tk-map-loader {
//         position: fixed;
//         inset: 0;
//         z-index: 10050;
//         width: 100vw;
//         height: 100dvh;
//         overflow: hidden;
//         display: grid;
//         place-items: center;
//         background:
//           radial-gradient(circle at 50% 42%, rgba(31, 92, 70, .30), transparent 34%),
//           linear-gradient(180deg, #0a251d 0%, #071b18 58%, #061512 100%);
//         isolation: isolate;
//       }

//       .tk-map-loader > * {
//         position: relative;
//         z-index: 2;
//       }

//       .tk-map-loader-logo {
//         position: absolute;
//         z-index: 5;
//         top: clamp(22px, 5vh, 52px);
//         left: 50%;
//         width: clamp(130px, 14vw, 205px);
//         transform: translateX(-50%);
//         pointer-events: none;
//         filter: drop-shadow(0 12px 18px rgba(0, 0, 0, .28));
//       }

//       .tk-map-loader-logo-img {
//         display: block;
//         width: 100%;
//         height: auto;
//       }

//       .tk-map {
//         position: fixed;
//         inset: 0;
//         z-index: 9999;
//         width: 100vw;
//         height: 100dvh;
//         min-height: 100dvh;
//         overflow: hidden;
//         background: #101915;
//         isolation: isolate;
//       }

//       .tk-map-stage {
//         position: absolute;
//         inset: 0;
//         width: 100%;
//         height: 100%;
//         overflow: hidden;
//         perspective: 1500px;
//         background: #101915;
//       }

//       /* =====================================================
//          MINI HOVER DASHBOARD
//       ===================================================== */

//       .tk-mini-sidebar {
//         position: fixed;
//         z-index: 5000;
//         top: 16px;
//         left: 16px;
//         bottom: 16px;
//         width: 58px;
//         padding: 8px;
//         display: flex;
//         flex-direction: column;
//         overflow: hidden;
//         border: 1px solid rgba(255,255,255,.16);
//         border-radius: 20px;
//         background: rgba(4,19,24,.72);
//         backdrop-filter: blur(16px);
//         -webkit-backdrop-filter: blur(16px);
//         box-shadow: 0 16px 40px rgba(0,0,0,.30);
//         transition: width .36s cubic-bezier(.22,1,.36,1), background .28s ease, box-shadow .28s ease;
//       }

//       .tk-mini-sidebar:hover {
//         width: 194px;
//         background: rgba(4,19,24,.94);
//         box-shadow: 0 20px 56px rgba(0,0,0,.42);
//       }

//       .tk-mini-logo {
//         width: 100%;
//         min-height: 43px;
//         padding: 0;
//         display: flex;
//         align-items: center;
//         gap: 12px;
//         border: 0;
//         background: transparent;
//         color: white;
//         cursor: pointer;
//       }

//       .tk-mini-logo-art {
//         width: 41px;
//         min-width: 41px;
//         height: 41px;
//         display: grid;
//         place-items: center;
//         overflow: hidden;
//         border: 1px solid rgba(255,255,255,.20);
//         border-radius: 13px;
//         background: rgba(5, 20, 24, .64);
//         box-shadow:
//           0 8px 18px rgba(0,0,0,.28),
//           inset 0 1px 0 rgba(255,255,255,.08);
//       }

//       .tk-mini-logo-image {
//         display: block;
//         width: 36px;
//         max-width: 36px;
//         height: auto;
//         object-fit: contain;
//       }

//       .tk-mini-label,
//       .tk-mini-nav button span,
//       .tk-mini-bottom button span {
//         opacity: 0;
//         white-space: nowrap;
//         transform: translateX(-8px);
//         transition: opacity .22s ease, transform .3s ease;
//       }

//       .tk-mini-label {
//         color: #fff5b8;
//         font-size: 12px;
//         font-weight: 1000;
//         letter-spacing: .08em;
//       }

//       .tk-mini-sidebar:hover .tk-mini-label,
//       .tk-mini-sidebar:hover .tk-mini-nav button span,
//       .tk-mini-sidebar:hover .tk-mini-bottom button span {
//         opacity: 1;
//         transform: translateX(0);
//       }

//       .tk-mini-nav {
//         display: flex;
//         flex-direction: column;
//         gap: 6px;
//         margin-top: 24px;
//       }

//       .tk-mini-bottom {
//         margin-top: auto;
//       }

//       .tk-mini-nav button,
//       .tk-mini-bottom button {
//         width: 100%;
//         height: 45px;
//         padding: 0 10px;
//         display: flex;
//         align-items: center;
//         gap: 12px;
//         overflow: hidden;
//         border: 1px solid transparent;
//         border-radius: 14px;
//         color: rgba(255,255,255,.72);
//         background: transparent;
//         cursor: pointer;
//         transition: transform .2s ease, color .2s ease, background .2s ease, border-color .2s ease;
//       }

//       .tk-mini-nav button:hover,
//       .tk-mini-bottom button:hover {
//         color: white;
//         background: rgba(255,255,255,.10);
//         transform: translateX(2px);
//       }

//       .tk-mini-nav button.active {
//         color: #7ce3ff;
//         border-color: rgba(83,215,255,.36);
//         background: rgba(15,146,202,.20);
//       }

//       .tk-mini-nav button span,
//       .tk-mini-bottom button span {
//         font-size: 11px;
//         font-weight: 850;
//       }

//       /* =====================================================
//          CAMERA
//       ===================================================== */

//       .tk-world-camera {
//         position: absolute;
//         inset: 0;
//         z-index: 1;
//         width: 100%;
//         height: 100%;
//         transform-style: preserve-3d;
//         transform-origin: center;
//         will-change: transform;
//       }

//       .tk-world-bg {
//         position: absolute;
//         inset: 0;
//         width: 100%;
//         height: 100%;
//         transform: translateZ(-40px) scale(1.025);
//       }

//       .tk-world-bg-image {
//         width: 100% !important;
//         height: 100% !important;
//         object-fit: cover;
//         object-position: center center;
//         filter: saturate(1.04) contrast(1.025) brightness(0.97);
//       }

//       .tk-world-depth-overlay {
//         position: absolute;

//         inset: 0;

//         z-index: 2;

//         pointer-events: none;

//         background:
//           linear-gradient(
//             180deg,
//             rgba(
//               5,
//               14,
//               13,
//               0.06
//             ),
//             transparent
//               42%,
//             rgba(
//               3,
//               10,
//               9,
//               0.18
//             )
//           ),
//           radial-gradient(
//             ellipse at
//               center,
//             transparent
//               48%,
//             rgba(
//               2,
//               9,
//               8,
//               0.16
//             )
//           );
//       }

//       /* =====================================================
//          NODES
//       ===================================================== */

//       .tk-level-layer {
//         position: absolute;

//         inset: 0;

//         z-index: 10;

//         transform-style:
//           preserve-3d;
//       }

//       .tk-level {
//         position: absolute;

//         min-width: 150px;

//         padding: 0;

//         display: flex;

//         flex-direction:
//           column;

//         align-items:
//           center;

//         border: 0;

//         color: white;

//         background:
//           transparent;

//         cursor: pointer;

//         transform:
//           translate(
//             -50%,
//             -50%
//           )
//           translateZ(
//             75px
//           );

//         transform-style:
//           preserve-3d;
//       }

//       .tk-level-ground-shadow {
//         position: absolute;

//         top: 42px;
//         left: 50%;

//         z-index: -1;

//         width: 76px;
//         height: 27px;

//         border-radius: 50%;

//         background:
//           rgba(
//             1,
//             7,
//             5,
//             0.46
//           );

//         filter:
//           blur(5px);

//         transform:
//           translateX(-50%)
//           rotateX(66deg);
//       }

//       .tk-level-orb {
//         position: relative;

//         z-index: 4;

//         width: 58px;
//         height: 58px;

//         display: grid;

//         place-items:
//           center;

//         border:
//           4px solid
//           rgba(
//             255,
//             248,
//             211,
//             0.95
//           );

//         border-radius:
//           50%;

//         color:
//           #273522;

//         background:
//           radial-gradient(
//             circle at
//               34% 27%,
//             #fff4a5,
//             #ffd953
//               47%,
//             #e7a320
//               100%
//           );

//         box-shadow:
//           0 8px 0
//             #8b641d,
//           0 13px 25px
//             rgba(
//               0,
//               0,
//               0,
//               0.34
//             ),
//           inset
//             4px 5px 8px
//             rgba(
//               255,
//               255,
//               255,
//               0.52
//             );

//         font-size: 17px;

//         font-weight: 1000;
//       }

//       .tk-level.is-current
//         .tk-level-orb {
//         width: 72px;
//         height: 72px;

//         background:
//           radial-gradient(
//             circle at
//               34% 27%,
//             #fffbd2,
//             #ffe15c
//               48%,
//             #f4ac26
//               100%
//           );

//         box-shadow:
//           0 9px 0
//             #8c641b,
//           0 0 0 9px
//             rgba(
//               255,
//               221,
//               76,
//               0.16
//             ),
//           0 0 34px
//             rgba(
//               255,
//               213,
//               52,
//               0.48
//             ),
//           0 16px 30px
//             rgba(
//               0,
//               0,
//               0,
//               0.34
//             );
//       }

//       .tk-level.is-completed
//         .tk-level-orb {
//         color: #153921;

//         background:
//           radial-gradient(
//             circle at
//               34% 27%,
//             #d7ffcc,
//             #6fd07e
//           );

//         box-shadow:
//           0 8px 0
//             #346d39,
//           0 14px 24px
//             rgba(
//               0,
//               0,
//               0,
//               0.3
//             );
//       }

//       .tk-level.is-locked
//         .tk-level-orb {
//         width: 51px;
//         height: 51px;

//         color:
//           #d7e2d9;

//         border-color:
//           rgba(
//             220,
//             231,
//             217,
//             0.72
//           );

//         background:
//           radial-gradient(
//             circle at
//               34% 28%,
//             #607064,
//             #344238
//           );

//         box-shadow:
//           0 7px 0
//             #1b261d,
//           0 12px 22px
//             rgba(
//               0,
//               0,
//               0,
//               0.34
//             );
//       }

//       .tk-level-pulse {
//         position: absolute;

//         top: -10px;
//         left: 50%;

//         z-index: 1;

//         width: 92px;
//         height: 92px;

//         border:
//           3px solid
//           rgba(
//             255,
//             221,
//             75,
//             0.9
//           );

//         border-radius:
//           50%;

//         transform:
//           translateX(-50%);

//         pointer-events:
//           none;
//       }

//       /* =====================================================
//          BIGGER LEVEL NAMES
//       ===================================================== */

//       .tk-level-name {
//         position: relative;

//         z-index: 5;

//         min-width: 145px;
//         max-width: 210px;

//         margin-top: 10px;

//         padding:
//           9px 13px;

//         border:
//           1px solid
//           rgba(
//             255,
//             235,
//             176,
//             0.24
//           );

//         border-radius:
//           14px;

//         color:
//           #fffdf2;

//         background:
//           linear-gradient(
//             145deg,
//             rgba(
//               16,
//               28,
//               20,
//               0.92
//             ),
//             rgba(
//               7,
//               19,
//               14,
//               0.86
//             )
//           );

//         backdrop-filter:
//           blur(10px);

//         box-shadow:
//           0 7px 0
//             rgba(
//               0,
//               0,
//               0,
//               0.2
//             ),
//           0 13px 25px
//             rgba(
//               0,
//               0,
//               0,
//               0.28
//             );

//         text-align:
//           center;
//       }

//       .tk-level-name strong {
//         display: block;

//         color:
//           #ffffff;

//         font-size: 15px;

//         line-height: 1.05;

//         font-weight: 1000;

//         letter-spacing:
//           -0.02em;

//         text-shadow:
//           0 2px 4px
//           rgba(
//             0,
//             0,
//             0,
//             0.4
//           );
//       }

//       .tk-level-name small {
//         display: block;

//         margin-top: 4px;

//         color:
//           #ffe37d;

//         font-size: 9px;

//         line-height: 1.2;

//         font-weight: 800;
//       }

//       .tk-level.is-current
//         .tk-level-name {
//         border-color:
//           rgba(
//             255,
//             221,
//             76,
//             0.72
//           );

//         background:
//           linear-gradient(
//             145deg,
//             rgba(
//               38,
//               42,
//               19,
//               0.95
//             ),
//             rgba(
//               12,
//               28,
//               18,
//               0.94
//             )
//           );

//         box-shadow:
//           0 7px 0
//             rgba(
//               83,
//               62,
//               15,
//               0.62
//             ),
//           0 0 22px
//             rgba(
//               255,
//               216,
//               62,
//               0.2
//             ),
//           0 15px 28px
//             rgba(
//               0,
//               0,
//               0,
//               0.33
//             );
//       }

//       .tk-level.is-locked
//         .tk-level-name {
//         opacity:
//           0.76;
//       }

//       /* =====================================================
//          STUDENT — FULL-BODY CHARACTER STANDING ON THE LAND
//       ===================================================== */

//       .tk-you-marker {
//         position: absolute;
//         z-index: 27;
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         transform:
//           translate(-50%, -100%)
//           translateZ(120px);
//         transform-origin: bottom center;
//         pointer-events: none;
//         filter: drop-shadow(0 11px 9px rgba(0,0,0,.34));
//       }

//       .tk-you-marker::after {
//         content: '';
//         position: absolute;
//         z-index: -1;
//         left: 50%;
//         bottom: 2px;
//         width: clamp(54px, 4.6vw, 78px);
//         height: 18px;
//         border-radius: 50%;
//         background: rgba(8, 24, 14, .40);
//         filter: blur(5px);
//         transform: translateX(-50%) scaleX(1.08);
//       }

//       .tk-you-character {
//         width: clamp(66px, 5.3vw, 96px);
//         height: clamp(112px, 16vh, 168px);
//         display: flex;
//         align-items: flex-end;
//         justify-content: center;
//       }

//       .tk-you-character-img {
//         display: block;
//         width: 100%;
//         height: 100%;
//         object-fit: contain;
//         object-position: bottom center;
//         transform-origin: bottom center;
//       }

//       .tk-you-marker > span {
//         position: absolute;
//         left: 50%;
//         bottom: -19px;
//         transform: translateX(-50%);
//         padding: 4px 8px;
//         border: 2px solid rgba(255,255,255,.60);
//         border-radius: 999px;
//         color: #172319;
//         background: #ffe263;
//         box-shadow: 0 4px 0 rgba(123,88,24,.72), 0 7px 13px rgba(0,0,0,.24);
//         font-size: 7px;
//         font-weight: 1000;
//         letter-spacing: .07em;
//         white-space: nowrap;
//       }

//       /* =====================================================
//          FULL MAP BUTTON
//       ===================================================== */

//       .tk-full-map-btn {
//         position: absolute;

//         z-index: 80;

//         top: 18px;
//         left: 18px;

//         min-height: 42px;

//         display: flex;

//         align-items:
//           center;

//         gap: 8px;

//         padding:
//           0 15px;

//         border:
//           1px solid
//           rgba(
//             255,
//             232,
//             164,
//             0.22
//           );

//         border-radius:
//           999px;

//         color:
//           #fff9dd;

//         background:
//           rgba(
//             8,
//             21,
//             14,
//             0.78
//           );

//         backdrop-filter:
//           blur(12px);

//         box-shadow:
//           0 10px 25px
//           rgba(
//             0,
//             0,
//             0,
//             0.26
//           );

//         font-size: 9px;

//         font-weight: 1000;

//         letter-spacing:
//           0.08em;

//         cursor: pointer;
//       }

//       /* =====================================================
//          JULIE
//       ===================================================== */

//       .tk-julie {
//         position: absolute;
//         z-index: 72;

//         /*
//          * Miss Julie stands directly under the wooden TALKORA board.
//          * Her feet visually land on the left jungle platform instead
//          * of floating in the air.
//          */
//         left: 7.2%;
//         bottom: 45.1%;

//         right: auto;
//         top: auto;

//         display: flex;
//         align-items: flex-end;
//         gap: 8px;

//         pointer-events: none;
//         transform-origin: bottom left;
//       }

//       .tk-julie::after {
//         content: '';
//         position: absolute;
//         z-index: -1;

//         left: clamp(62px, 6.8vw, 96px);
//         bottom: -3px;

//         width: clamp(96px, 8.5vw, 138px);
//         height: 24px;

//         border-radius: 50%;

//         background:
//           rgba(7, 24, 13, .38);

//         filter: blur(6px);

//         transform:
//           translateX(-50%)
//           scaleY(.62);
//       }

//       .tk-julie-character {
//         width: clamp(145px, 11vw, 205px);
//         height: clamp(235px, 31vh, 315px);

//         display: flex;
//         align-items: flex-end;
//         justify-content: center;

//         transform-origin: bottom center;
//       }

//       .tk-julie-img {
//         display: block;
//         width: 100%;
//         height: 100%;
//         object-fit: contain;
//         object-position: bottom center;
//         filter: drop-shadow(0 16px 13px rgba(0,0,0,.40));
//         transform-origin: bottom center;
//       }

//       .tk-julie-bubble {
//         position: relative;
//         width: clamp(260px, 24vw, 400px);
//         margin-bottom: clamp(76px, 11vh, 112px);
//         padding: 14px 15px;
//         border: 3px solid #e8c4c7;
//         border-radius: 19px 19px 19px 6px;
//         color: #21362a;
//         background: rgba(255,249,234,.97);
//         box-shadow: 0 9px 0 rgba(160,102,105,.18), 0 20px 35px rgba(0,0,0,.30);
//         pointer-events: auto;
//         backdrop-filter: blur(5px);
//         animation: tkBubbleIn .55s cubic-bezier(.34,1.56,.64,1);
//       }

//       @keyframes tkBubbleIn {
//         from { opacity: 0; transform: translate(-12px, 12px) scale(.9); }
//         to { opacity: 1; transform: translate(0,0) scale(1); }
//       }

//       .tk-julie-bubble::before {
//         content: '';
//         position: absolute;
//         left: -13px;
//         top: 34px;
//         width: 24px;
//         height: 24px;
//         background: #fff9ea;
//         border-left: 3px solid #e8c4c7;
//         border-bottom: 3px solid #e8c4c7;
//         transform: rotate(45deg);
//       }

//       .tk-julie-header {
//         position: relative;
//         z-index: 2;
//         display: flex;
//         align-items: center;
//         justify-content: space-between;
//       }

//       .tk-julie-header span {
//         color: #d75f7c;
//         font-size: 8px;
//         font-weight: 1000;
//         letter-spacing: .14em;
//       }

//       .tk-julie-header button {
//         width: 31px;
//         height: 31px;
//         display: grid;
//         place-items: center;
//         border: 0;
//         border-radius: 50%;
//         color: #26362a;
//         background: rgba(30,51,34,.08);
//         cursor: pointer;
//         transition: transform .2s ease, background .2s ease;
//       }

//       .tk-julie-header button:hover {
//         transform: scale(1.08);
//         background: rgba(30,51,34,.14);
//       }

//       .tk-julie-bubble p {
//         position: relative;
//         z-index: 2;
//         min-height: 38px;
//         margin: 8px 0 0;
//         font-size: 12px;
//         font-weight: 750;
//         line-height: 1.46;
//       }

//       .tk-julie-cursor {
//         display: inline-block;
//         margin-left: 1px;
//         color: #d75f7c;
//         animation: tkCursor .7s steps(1) infinite;
//       }

//       @keyframes tkCursor {
//         50% { opacity: 0; }
//       }

//       .tk-julie-bubble small {
//         display: block;
//         margin-top: 7px;
//         color: #967477;
//         font-size: 8px;
//       }

//       /* =====================================================
//          SOUND
//       ===================================================== */

//       .tk-sound-wave {
//         position: relative;

//         z-index: 2;

//         height: 16px;

//         margin-top: 7px;

//         display: flex;

//         align-items:
//           center;

//         gap: 3px;
//       }

//       .tk-sound-wave i {
//         width: 3px;
//         height: 6px;

//         border-radius:
//           999px;

//         background:
//           #d75f7c;

//         animation:
//           tkJulieWave
//           0.55s
//           ease-in-out
//           infinite;
//       }

//       .tk-sound-wave i:nth-child(2) {
//         animation-delay:
//           0.08s;
//       }

//       .tk-sound-wave i:nth-child(3) {
//         animation-delay:
//           0.16s;
//       }

//       .tk-sound-wave i:nth-child(4) {
//         animation-delay:
//           0.24s;
//       }

//       .tk-sound-wave i:nth-child(5) {
//         animation-delay:
//           0.32s;
//       }

//       @keyframes tkJulieWave {
//         50% {
//           height: 15px;
//         }
//       }

//       .tk-spin {
//         animation:
//           tkSpin
//           0.9s linear
//           infinite;
//       }

//       @keyframes tkSpin {
//         to {
//           transform:
//             rotate(
//               360deg
//             );
//         }
//       }

//       /* =====================================================
//          ENTERING
//       ===================================================== */

//       .tk-entering {
//         position: absolute;

//         inset: 0;

//         z-index: 150;

//         display: grid;

//         place-items:
//           center;

//         background:
//           radial-gradient(
//             circle at
//               center,
//             rgba(
//               63,
//               113,
//               70,
//               0.1
//             ),
//             rgba(
//               1,
//               9,
//               6,
//               0.78
//             )
//           );

//         backdrop-filter:
//           blur(3px);
//       }

//       .tk-entering > div {
//         display: flex;

//         flex-direction:
//           column;

//         align-items:
//           center;

//         color: white;

//         text-align: center;
//       }

//       .tk-entering svg {
//         color:
//           #ffe36a;
//       }

//       .tk-entering span {
//         margin-top: 10px;

//         color:
//           #a9e5b9;

//         font-size: 9px;

//         font-weight: 1000;

//         letter-spacing:
//           0.18em;
//       }

//       .tk-entering strong {
//         margin-top: 5px;

//         font-size: 31px;
//       }

//       /* =====================================================
//          TABLET
//       ===================================================== */

//       @media (
//         max-width: 950px
//       ) {
//         .tk-level-name {
//           min-width: 118px;

//           max-width: 150px;

//           padding:
//             7px 9px;
//         }

//         .tk-level-name strong {
//           font-size: 12px;
//         }

//         .tk-level-name small {
//           font-size: 7px;
//         }


//         .tk-julie {
//           top: 28%;
//           left: 14%;
//         }

//         .tk-julie-character {
//           width: 102px;
//           height: 172px;
//         }

//         .tk-julie-bubble {
//           width: 200px;
//           margin-top: 12px;
//           margin-bottom: 0;
//         }
//       }

//       /* =====================================================
//          MOBILE
//       ===================================================== */

//       @media (
//         max-width: 680px
//       ) {
//         .tk-map {
//           width: 100vw;
//           height: 100dvh;
//           min-height: 100dvh;
//         }

//         .tk-map-stage {
//           position: absolute;
//           inset: 0;
//           width: 100%;
//           height: 100%;
//           perspective: none;
//         }

//         .tk-world-camera {
//           inset: 0;

//           transform:
//             none !important;
//         }

//         .tk-world-bg {
//           transform: none;
//         }

//         .tk-world-bg-image {
//           object-position:
//             50% center;
//         }

//         .tk-level {
//           min-width: 90px;

//           transform:
//             translate(
//               -50%,
//               -50%
//             ) !important;
//         }

//         .tk-level-orb {
//           width: 42px;
//           height: 42px;

//           border-width: 3px;

//           font-size: 12px;
//         }

//         .tk-level.is-current
//           .tk-level-orb {
//           width: 52px;
//           height: 52px;
//         }

//         .tk-level.is-locked
//           .tk-level-orb {
//           width: 37px;
//           height: 37px;
//         }

//         .tk-level-name {
//           min-width: 84px;
//           max-width: 108px;

//           margin-top: 6px;

//           padding:
//             6px 7px;

//           border-radius:
//             9px;
//         }

//         .tk-level-name strong {
//           font-size: 9px;
//         }

//         .tk-level-name small {
//           font-size: 6px;
//         }

//         .tk-you-marker {
//           display: flex;
//           transform:
//             translate(-50%, -100%) !important;
//         }

//         .tk-you-character {
//           width: 54px;
//           height: 96px;
//         }

//         .tk-you-marker > span {
//           bottom: -16px;
//           padding: 3px 6px;
//           font-size: 6px;
//         }

//         .tk-julie {
//           top: 23%;
//           left: 58px;
//           right: auto;
//           bottom: auto;
//           align-items: flex-start;
//           transform: none !important;
//         }

//         .tk-julie-character {
//           width: 72px;
//           height: 124px;
//         }

//         .tk-julie::after {
//           left: 36px;
//           top: 112px;
//           width: 56px;
//           height: 15px;
//         }

//         .tk-julie-bubble {
//           width: min(58vw, 250px);
//           margin: 8px 0 0;
//           padding: 10px 11px;
//         }

//         .tk-julie-bubble::before {
//           top: 22px;

//           left: -9px;
//           bottom: auto;

//           width: 17px;
//           height: 17px;
//         }

//         .tk-julie-bubble p {
//           font-size: 10px;
//         }


//         .tk-full-map-btn {
//           top: 125px;
//           left: 10px;
//         }

//         .tk-mini-sidebar {
//           top: 8px;
//           left: 8px;
//           bottom: 8px;
//           width: 50px;
//           padding: 5px;
//           border-radius: 17px;
//         }

//         .tk-mini-sidebar:hover {
//           width: 168px;
//         }

//         .tk-mini-logo-art {
//           width: 38px;
//           min-width: 38px;
//           height: 38px;
//           border-radius: 12px;
//         }

//         .tk-mini-logo-image {
//           width: 33px;
//           max-width: 33px;
//         }

//         .tk-mini-nav {
//           margin-top: 16px;
//           gap: 4px;
//         }

//         .tk-mini-nav button,
//         .tk-mini-bottom button {
//           height: 41px;
//           padding: 0 9px;
//         }

//       }

//       /* =====================================================
//          ERROR
//       ===================================================== */

//       .tk-map-error {
//         min-height: 100dvh;

//         display: grid;

//         place-items:
//           center;

//         padding: 20px;

//         color: white;

//         background:
//           #101915;
//       }

//       .tk-map-error > div {
//         width:
//           min(
//             420px,
//             100%
//           );

//         padding: 28px;

//         border-radius: 22px;

//         background:
//           #17271d;

//         text-align: center;
//       }

//       .tk-map-error p {
//         color:
//           #bfd1c3;
//       }

//       .tk-map-error button {
//         min-height: 44px;

//         margin-top: 10px;

//         padding:
//           0 18px;

//         border: 0;

//         border-radius: 13px;

//         color:
//           #172019;

//         background:
//           #ffe05c;

//         font-weight: 900;

//         cursor: pointer;
//       }

//       @media (
//         prefers-reduced-motion:
//           reduce
//       ) {
//         *,
//         *::before,
//         *::after {
//           animation-duration:
//             0.01ms !important;

//           animation-iteration-count:
//             1 !important;

//           transition-duration:
//             0.01ms !important;
//         }
//       }
//     `}</style>
//   )
// }
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  AnimatePresence,
  motion,
} from 'framer-motion'

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Camera,
  HandHeart,
  Heart,
  Home,
  LoaderCircle,
  Lock,
  LogOut,
  Map,
  Mic2,
  Megaphone,
  Sparkles,
  Star,
  Trophy,
  User,
  UsersRound,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'

import {
  TalkoraLoader,
} from '@/components/student/talkora-loader'

import { KGAlphabetMap } from '@/components/student/kg/kg-alphabet-map'

import {
  TalkoraLogo,
} from '@/components/brand/talkora-logo'

import { useAuth } from '@/components/auth/auth-provider'

import {
  curriculumService,
  type StudentCurriculum,
} from '@/services/curriculum-service'

import {
  voiceService,
  type VoicePlaybackState,
} from '@/services/voice-service'

type MapStatus =
  | 'CURRENT'
  | 'COMPLETED'
  | 'LOCKED'
  | 'UPCOMING'

type World = {
  number: number
  id: string
  icon: LucideIcon
  name: string
  syllabus: string
  x: number
  y: number
  studentX: number
  studentY: number
}

type PointerState = {
  x: number
  y: number
}

type CameraState = {
  x: number
  y: number
  scale: number
}

/*
 * SAVE NEW IMAGE HERE:
 *
 * client/public/assets/levelmap.png
 */
const MAP_BACKGROUND =
  '/assets/levelmap.png'

const MISS_JULIE_IMAGE =
  '/miss-julie-welcome.png'

const BOY_STUDENT_IMAGE =
  '/talkora/characters/students/boy/canonical.png'

const GIRL_STUDENT_IMAGE =
  '/talkora/characters/students/girl/canonical.png'

/*
 * These positions are now arranged for the NEW jungle image.
 *
 * 1 = lower-left camp
 * 2 = left bridge/platform
 * 3 = centre bridge/path
 * 4 = upper treehouse
 * 5 = temple
 * 6 = right jungle bridge
 * 7 = lower-right stage
 * 8 = final lower-right area
 */
const WORLDS: World[] = [
  {
    number: 1,
    id: 'favourite-fair',
    icon: Heart,
    name: 'Favourite Fair',
    syllabus: 'My Favourite Things',
    // Bottom-left classroom camp stone.
    x: 25.5,
    y: 83.5,
    // Student feet sit on the same sandy island, beside the button.
    studentX: 20.4,
    studentY: 86.2,
  },
  {
    number: 2,
    id: 'friendship-garden',
    icon: UsersRound,
    name: 'Friendship Garden',
    syllabus: 'All About My Partner',
    // Centre-left landing after the rope bridge.
    x: 40.7,
    y: 58.1,
    studentX: 35.9,
    studentY: 64.7,
  },
  {
    number: 3,
    id: 'talkora-cafe',
    icon: UtensilsCrossed,
    name: 'Talkora Café',
    syllabus: 'Let’s Order',
    // First treehouse platform.
    x: 46.4,
    y: 32.8,
    studentX: 42.7,
    studentY: 40.8,
  },
  {
    number: 4,
    id: 'calendar-town',
    icon: CalendarDays,
    name: 'Calendar Town',
    syllabus: 'On My Calendar',
    // Second upper path stone.
    x: 55.3,
    y: 35.8,
    studentX: 51.4,
    studentY: 43.8,
  },
  {
    number: 5,
    id: 'helper-harbour',
    icon: HandHeart,
    name: 'Helper Harbour',
    syllabus: 'Let Me Help You',
    // Bridge-side stone leading towards the temple.
    x: 64.4,
    y: 40.1,
    studentX: 60.6,
    studentY: 47.5,
  },
  {
    number: 6,
    id: 'story-forest',
    icon: BookOpen,
    name: 'Story Forest',
    syllabus: 'Familiar Folk Tales',
    // Temple entrance stone.
    x: 76.1,
    y: 47.8,
    studentX: 72.1,
    studentY: 55.4,
  },
  {
    number: 7,
    id: 'special-moments-studio',
    icon: Camera,
    name: 'Memory Meadows',
    syllabus: 'My Special Moment',
    // Lower central path stone.
    x: 61.4,
    y: 75.6,
    studentX: 56.8,
    studentY: 82.5,
  },
  {
    number: 8,
    id: 'voices-for-good-theatre',
    icon: Megaphone,
    name: 'Voice Valley',
    syllabus: 'Using Our Voices for Good',
    // Final stage / learning tent stone.
    x: 89.2,
    y: 73.2,
    studentX: 84.8,
    studentY: 81.4,
  },
]

export default function AdventureMapPage() {
  const router =
    useRouter()

  const { session, logout } = useAuth()

  const greetedRef =
    useRef(false)

  const [
    curriculum,
    setCurriculum,
  ] =
    useState<StudentCurriculum | null>(
      null,
    )

  const [
    selected,
    setSelected,
  ] =
    useState(1)

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    julieMessage,
    setJulieMessage,
  ] =
    useState('')

  const [
    displayedJulieMessage,
    setDisplayedJulieMessage,
  ] = useState('')

  const [
    voiceState,
    setVoiceState,
  ] =
    useState<VoicePlaybackState>(
      'idle',
    )

  const [
    voiceError,
    setVoiceError,
  ] =
    useState('')

  const [
    pointer,
    setPointer,
  ] =
    useState<PointerState>({
      x: 0,
      y: 0,
    })

  const [
    camera,
    setCamera,
  ] =
    useState<CameraState>({
      x: 0,
      y: 0,
      scale: 1,
    })

  const [
    focusedWorld,
    setFocusedWorld,
  ] =
    useState<number | null>(
      null,
    )

  const [
    entering,
    setEntering,
  ] =
    useState(false)

  useEffect(() => {
    if (session?.student?.grade === 0) { setLoading(false); return }
    let alive = true

    async function load() {
      try {
        const data =
          await curriculumService.getMyCurriculum()

        if (!alive) {
          return
        }

        setCurriculum(data)
        setLoading(false)
      } catch (cause) {
        if (!alive) {
          return
        }

        console.error(
          '[TALKORA ADVENTURE]',
          cause,
        )

        setError(
          cause instanceof Error
            ? cause.message
            : 'Failed to load your adventure.',
        )

        setLoading(false)
      }
    }

    void load()

    return () => {
      alive = false

      voiceService.stop()

    }
  }, [router, session?.student?.grade])

  const student =
    session?.student

  const firstName =
    student?.fullName
      ?.trim()
      .split(/\s+/)[0] ||
    'Explorer'

  const studentCharacter =
    String(
      student?.avatarType ??
      '',
    ).toUpperCase() === 'GIRL'
      ? GIRL_STUDENT_IMAGE
      : BOY_STUDENT_IMAGE

  const currentUnit =
    useMemo(() => {
      return (
        Number(
          curriculum?.units.find(
            (unit) =>
              unit.status ===
              'CURRENT',
          )?.unitNumber,
        ) || 1
      )
    }, [curriculum])

  const currentWorld =
    WORLDS.find(
      (world) =>
        world.number ===
        currentUnit,
    ) || WORLDS[0]

  const selectedWorld =
    WORLDS.find(
      (world) =>
        world.number ===
        selected,
    ) || currentWorld

  function statusFor(
    number: number,
  ): MapStatus {
    const unit =
      curriculum?.units.find(
        (item) =>
          Number(
            item.unitNumber,
          ) === number,
      )

    return (
      (unit?.status as
        | MapStatus
        | undefined) ??
      'UPCOMING'
    )
  }

  useEffect(() => {
    setSelected(
      currentUnit,
    )
  }, [currentUnit])

  function handlePointerMove(
    event: MouseEvent<HTMLElement>,
  ) {
    if (
      focusedWorld !== null ||
      entering
    ) {
      return
    }

    if (
      typeof window !==
        'undefined' &&
      window.innerWidth < 850
    ) {
      return
    }

    const rect =
      event.currentTarget.getBoundingClientRect()

    const relativeX =
      (event.clientX -
        rect.left) /
      rect.width

    const relativeY =
      (event.clientY -
        rect.top) /
      rect.height

    setPointer({
      x:
        (relativeX - 0.5) *
        2,

      y:
        (relativeY - 0.5) *
        2,
    })
  }

  function resetPointer() {
    if (
      focusedWorld !== null ||
      entering
    ) {
      return
    }

    setPointer({
      x: 0,
      y: 0,
    })
  }

  /*
   * Camera moves scene in opposite direction
   * so the selected point comes toward the centre.
   */
  function focusCamera(
    world: World,
    scale = 1.16,
  ) {
    const x =
      (50 - world.x) *
      5.2

    const y =
      (50 - world.y) *
      3.5

    setFocusedWorld(
      world.number,
    )

    setPointer({
      x: 0,
      y: 0,
    })

    setCamera({
      x,
      y,
      scale,
    })
  }

  function showWholeWorld() {
    if (entering) {
      return
    }

    setFocusedWorld(
      null,
    )

    setPointer({
      x: 0,
      y: 0,
    })

    setCamera({
      x: 0,
      y: 0,
      scale: 1,
    })
  }

  async function speakJulie(
    message: string,
  ) {
    const cleaned =
      message.trim()

    if (!cleaned) {
      return
    }

    setVoiceError('')

    try {
      await voiceService.speak(
        cleaned,
        (
          state,
          messageText,
        ) => {
          setVoiceState(
            state,
          )

          if (
            state === 'error'
          ) {
            setVoiceError(
              messageText || 'Tap to listen to Miss Julie!',
            )
          }
        },
        'levels-page-guidance',
      )
    } catch {
      setVoiceState(
        'idle',
      )
    }
  }

  function stopJulie() {
    voiceService.stop()


    setVoiceState(
      'idle',
    )
  }

  /*
   * Miss Julie always starts the experience.
   */
  useEffect(() => {
    if (
      !curriculum ||
      !student ||
      student.grade === 0 ||
      greetedRef.current
    ) {
      return
    }

    greetedRef.current =
      true

    const greeting =
      `Hi ${firstName}! Welcome back to Talkora. ` +
      `Our jungle adventure is ready! ` +
      `Today we're continuing ${currentWorld.name}. ` +
      `Come with me — I'll guide you!`

    setJulieMessage(
      greeting,
    )

    const timer =
      window.setTimeout(
        () => {
          void speakJulie(
            greeting,
          )
        },
        650,
      )

    return () => {
      window.clearTimeout(
        timer,
      )
    }
  }, [
    curriculum,
    student,
    firstName,
    currentWorld,
  ])

  useEffect(() => {
    const message =
      julieMessage ||
      `Hi ${firstName}! Ready for today's adventure?`

    setDisplayedJulieMessage('')

    if (!message) {
      return
    }

    let index = 0

    const timer =
      window.setInterval(() => {
        index += 1
        setDisplayedJulieMessage(
          message.slice(0, index),
        )

        if (index >= message.length) {
          window.clearInterval(timer)
        }
      }, 20)

    return () => {
      window.clearInterval(timer)
    }
  }, [julieMessage, firstName])

  function beginWorld(
    world: World,
  ) {
    const status =
      statusFor(world.number)

    if (
      status !== 'CURRENT' &&
      status !== 'COMPLETED'
    ) {
      return
    }

    setEntering(true)
    setSelected(world.number)

    const message =
      status === 'COMPLETED'
        ? `Amazing ${firstName}! Let's visit ${world.name} again.`
        : `Come on ${firstName}! Let's begin ${world.name}!`

    setJulieMessage(message)
    void speakJulie(message)

    /*
     * IMPORTANT:
     * /api/v1/lessons/:id expects a MongoDB Lesson ObjectId.
     * The old map pushed the unit number (1, 2, 3...), which caused
     * Mongoose to try Lesson.findById('1') and throw a CastError.
     *
     * The student curriculum already contains the real lesson ids,
     * so enter the first unfinished lesson in this world. If the
     * world is complete, revisit its first lesson.
     */
    const unit =
      curriculum?.units.find(
        (item) =>
          Number(item.unitNumber) ===
          world.number,
      )

    const targetLesson =
      unit?.lessons.find(
        (lesson) =>
          !lesson.completed,
      ) ??
      unit?.lessons[0]

    if (!targetLesson?.id) {
      setEntering(false)

      const unavailableMessage =
        `${world.name} is ready on the map, but I could not find its lesson yet. ` +
        `Please refresh once and try again.`

      setJulieMessage(
        unavailableMessage,
      )

      void speakJulie(
        unavailableMessage,
      )

      return
    }

    focusCamera(world, 1.48)

    window.setTimeout(() => {
      router.push(
        `/student/lesson/${targetLesson.id}`,
      )
    }, 850)
  }

  function chooseWorld(
    world: World,
  ) {
    const status =
      statusFor(world.number)

    setSelected(world.number)

    if (
      status === 'CURRENT' ||
      status === 'COMPLETED'
    ) {
      beginWorld(world)
      return
    }

    focusCamera(world, 1.13)

    if (status === 'LOCKED') {
      const message =
        `${world.name} is still locked. Finish ${currentWorld.name} first and we'll open this path together.`

      setJulieMessage(message)
      void speakJulie(message)
      return
    }

    const message =
      `${world.name} is waiting further inside the jungle. We'll reach it soon!`

    setJulieMessage(message)
    void speakJulie(message)
  }

  // KG uses its own fast, server-authoritative alphabet map; do not wait for legacy curriculum.
  if (student?.grade === 0) return <KGAlphabetMap />

  if (loading) {
    return (
      <div className="tk-map-loader">
        <motion.div
          className="tk-map-loader-logo"
          initial={{
            opacity: 0,
            scale: 0.86,
            y: 8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            ease: 'easeOut',
          }}
        >
          <TalkoraLogo
            className="tk-map-loader-logo-img"
            priority
          />
        </motion.div>

        <TalkoraLoader
          compact
          message="Opening your English adventure..."
          worldSrc={MAP_BACKGROUND}
        />

        <AdventureStyles />
      </div>
    )
  }

  if (error) {
    return (
      <main className="tk-map-error">
        <div>
          <h1>
            Adventure paused
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try again
          </button>
        </div>

        <AdventureStyles />
      </main>
    )
  }

  return (
    <div className="tk-map">
      <motion.aside
        className="tk-mini-sidebar"
        initial={{
          opacity: 0,
          x: -28,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.55,
          ease: 'easeOut',
        }}
      >
        <button
          type="button"
          className="tk-mini-logo"
          onClick={() =>
            router.push('/student/home')
          }
          aria-label="Talkora dashboard"
        >
          <span className="tk-mini-logo-art">
            <TalkoraLogo
              className="tk-mini-logo-image"
              priority
            />
          </span>

          <span className="tk-mini-label">
            TALKORA
          </span>
        </button>

        <nav className="tk-mini-nav">
          <button
            type="button"
            onClick={() =>
              router.push('/student/home')
            }
          >
            <Home size={20} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className="active"
          >
            <Map size={20} />
            <span>Adventures</span>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/student/practice')
            }
          >
            <Mic2 size={20} />
            <span>Practice</span>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/student/rewards')
            }
          >
            <Trophy size={20} />
            <span>Rewards</span>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/student/progress')
            }
          >
            <BarChart3 size={20} />
            <span>Progress</span>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push('/student/profile')
            }
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>

        <div className="tk-mini-bottom">
          <button
            type="button"
            onClick={async () => {
              await logout()
              router.replace('/login/student')
            }}
          >
            <LogOut size={20} />
            <span>Exit</span>
          </button>
        </div>
      </motion.aside>
      <section
        className="tk-map-stage"
        onMouseMove={
          handlePointerMove
        }
        onMouseLeave={
          resetPointer
        }
      >
        {/* ====================================================
            WORLD CAMERA
        ==================================================== */}

        <motion.div
          className="tk-world-camera"
          animate={{
            x:
              camera.x +
              pointer.x *
                -18,

            y:
              camera.y +
              pointer.y *
                -11,

            scale:
              camera.scale,

            rotateY:
              focusedWorld === null
                ? pointer.x *
                  1.5
                : 0,

            rotateX:
              focusedWorld === null
                ? pointer.y *
                  -0.9
                : 0,
          }}
          transition={{
            type: 'spring',
            stiffness:
              focusedWorld === null
                ? 42
                : 58,
            damping:
              focusedWorld === null
                ? 26
                : 20,
            mass: 0.72,
          }}
        >
          {/* NEW JUNGLE IMAGE */}

          <div className="tk-world-bg">
            <Image
              src={
                MAP_BACKGROUND
              }
              alt="Talkora jungle English adventure map"
              fill
              priority
              sizes="100vw"
              className="tk-world-bg-image"
            />

            <div className="tk-world-depth-overlay" />
          </div>

          {/* ==================================================
              LEVEL DESTINATIONS

              NO YELLOW RAIL.
              NO SVG ROUTE.
              THE IMAGE ITSELF HAS REAL PATHS + BRIDGES.
          ================================================== */}

          <div className="tk-level-layer">
            {WORLDS.map(
              (
                world,
                index,
              ) => {
                const status =
                  statusFor(
                    world.number,
                  )

                const current =
                  status ===
                  'CURRENT'

                const completed =
                  status ===
                  'COMPLETED'

                const locked =
                  status ===
                    'LOCKED' ||
                  status ===
                    'UPCOMING'

                const isSelected =
                  selected ===
                  world.number

                return (
                  <motion.button
                    key={
                      world.id
                    }
                    type="button"
                    className={[
                      'tk-level',

                      current
                        ? 'is-current'
                        : '',

                      completed
                        ? 'is-completed'
                        : '',

                      locked
                        ? 'is-locked'
                        : '',

                      isSelected
                        ? 'is-selected'
                        : '',
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(' ')}
                    style={{
                      left: `${world.x}%`,
                      top: `${world.y}%`,
                    }}
                    initial={{
                      opacity: 0,
                      scale:
                        0.72,
                      y: 22,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.065,

                      duration:
                        0.42,
                    }}
                    whileHover={{
                      y: -8,
                      scale: 1.07,
                    }}
                    whileTap={{
                      scale:
                        0.96,
                    }}
                    onClick={() =>
                      chooseWorld(
                        world,
                      )
                    }
                  >
                    <span className="tk-level-ground-shadow" />

                    {current ? (
                      <>
                        <motion.span
                          className="tk-level-pulse pulse-a"
                          animate={{
                            scale: [
                              0.8,
                              1.6,
                            ],

                            opacity: [
                              0.7,
                              0,
                            ],
                          }}
                          transition={{
                            duration:
                              2,

                            repeat:
                              Infinity,
                          }}
                        />

                        <motion.span
                          className="tk-level-pulse pulse-b"
                          animate={{
                            scale: [
                              0.8,
                              1.6,
                            ],

                            opacity: [
                              0.7,
                              0,
                            ],
                          }}
                          transition={{
                            duration:
                              2,

                            delay: 1,

                            repeat:
                              Infinity,
                          }}
                        />
                      </>
                    ) : null}

                    <span className="tk-level-orb">
                      <world.icon size={23} strokeWidth={2.5} aria-hidden="true" />
                      {completed ? <Star size={11} fill="currentColor" style={{ position: 'absolute', right: -2, bottom: -2 }} aria-hidden="true" /> : null}
                      {locked ? <Lock size={11} style={{ position: 'absolute', right: -2, bottom: -2 }} aria-hidden="true" /> : null}
                    </span>

                    {/* BIGGER / READABLE LEVEL NAMES */}

                    <span className="tk-level-name">
                      <strong>
                        {world.name}
                      </strong>

                      <small>
                        {world.number}.
                        {' '}
                        {
                          world.syllabus
                        }
                      </small>
                    </span>
                  </motion.button>
                )
              },
            )}
          </div>

          {/* ==================================================
              STUDENT MARKER
          ================================================== */}

          <motion.div
            className="tk-you-marker"
            style={{
              left: `${currentWorld.studentX}%`,
              top: `${currentWorld.studentY}%`,
            }}
            animate={{
              y: [
                0,
                -7,
                0,
              ],
            }}
            transition={{
              duration:
                2.4,

              repeat:
                Infinity,

              ease:
                'easeInOut',
            }}
          >
            <div className="tk-you-character">
              <Image
                src={studentCharacter}
                alt={`${firstName} student character`}
                width={180}
                height={260}
                loading="eager"
                className="tk-you-character-img"
              />
            </div>

            <span>
              YOU
            </span>
          </motion.div>
        </motion.div>

        {/* ====================================================
            RETURN TO FULL WORLD
        ==================================================== */}

        <AnimatePresence>
          {focusedWorld !==
            null &&
          !entering ? (
            <motion.button
              type="button"
              className="tk-full-map-btn"
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={
                showWholeWorld
              }
            >
              <span>
                ←
              </span>

              FULL MAP
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* ====================================================
            MISS JULIE

            Foreground guide.
        ==================================================== */}

        <motion.aside
          className="tk-julie"
          initial={{
            opacity: 0,
            x: 30,
          }}
          animate={{
            opacity: 1,

            x:
              focusedWorld === null
                ? pointer.x *
                  8
                : 0,

            y:
              focusedWorld === null
                ? pointer.y *
                  4
                : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 55,
            damping: 20,
          }}
        >
          <motion.div
            className="tk-julie-character"
            animate={{
              y: [
                0,
                -5,
                0,
              ],
            }}
            transition={{
              duration: 4,
              repeat:
                Infinity,
              ease:
                'easeInOut',
            }}
          >
            <Image
              src={MISS_JULIE_IMAGE}
              alt="Miss Julie"
              width={250}
              height={330}
              priority
              className="tk-julie-img"
            />
          </motion.div>

          <div className="tk-julie-bubble">
            <div className="tk-julie-header">
              <span>
                MISS JULIE
              </span>

              <button
                type="button"
                aria-label={
                  voiceState ===
                  'speaking'
                    ? 'Stop Miss Julie'
                    : 'Hear Miss Julie'
                }
                onClick={() => {
                  if (
                    voiceState ===
                    'speaking'
                  ) {
                    stopJulie()

                    return
                  }

                  void speakJulie(
                    julieMessage,
                  )
                }}
              >
                {voiceState ===
                'loading' ? (
                  <LoaderCircle
                    size={16}
                    className="tk-spin"
                  />
                ) : voiceState ===
                  'speaking' ? (
                  <VolumeX
                    size={16}
                  />
                ) : (
                  <Volume2
                    size={16}
                  />
                )}
              </button>
            </div>

            <p>
              {displayedJulieMessage}
              <span className="tk-julie-cursor">|</span>
            </p>

            {voiceState ===
            'speaking' ? (
              <div className="tk-sound-wave">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            ) : null}

            {voiceError ? (
              <small>
                Tap the speaker to
                hear me.
              </small>
            ) : null}
          </div>
        </motion.aside>

        {/* ====================================================
            ENTER WORLD CINEMATIC
        ==================================================== */}

        <AnimatePresence>
          {entering ? (
            <motion.div
              className="tk-entering"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.65,
              }}
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
              >
                <Sparkles
                  size={23}
                />

                <span>
                  ENTERING
                </span>

                <strong>
                  {
                    selectedWorld.name
                  }
                </strong>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <AdventureStyles />
    </div>
  )
}

function AdventureStyles() {
  return (
    <style jsx global>{`
      .tk-map-loader {
        position: fixed;
        inset: 0;
        z-index: 10050;
        width: 100vw;
        height: 100dvh;
        overflow: hidden;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 50% 42%, rgba(31, 92, 70, .30), transparent 34%),
          linear-gradient(180deg, #0a251d 0%, #071b18 58%, #061512 100%);
        isolation: isolate;
      }

      .tk-map-loader > * {
        position: relative;
        z-index: 2;
      }

      .tk-map-loader-logo {
        position: absolute;
        z-index: 5;
        top: clamp(22px, 5vh, 52px);
        left: 50%;
        width: clamp(130px, 14vw, 205px);
        transform: translateX(-50%);
        pointer-events: none;
        filter: drop-shadow(0 12px 18px rgba(0, 0, 0, .28));
      }

      .tk-map-loader-logo-img {
        display: block;
        width: 100%;
        height: auto;
      }

      .tk-map {
        position: fixed;
        inset: 0;
        z-index: 9999;
        width: 100vw;
        height: 100dvh;
        min-height: 100dvh;
        overflow: hidden;
        background: #101915;
        isolation: isolate;
      }

      .tk-map-stage {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        perspective: 1500px;
        background: #101915;
      }

      /* =====================================================
         MINI HOVER DASHBOARD
      ===================================================== */

      .tk-mini-sidebar {
        position: fixed;
        z-index: 5000;
        top: 16px;
        left: 16px;
        bottom: 16px;
        width: 58px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 20px;
        background: rgba(4,19,24,.72);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 16px 40px rgba(0,0,0,.30);
        transition: width .36s cubic-bezier(.22,1,.36,1), background .28s ease, box-shadow .28s ease;
      }

      .tk-mini-sidebar:hover {
        width: 194px;
        background: rgba(4,19,24,.94);
        box-shadow: 0 20px 56px rgba(0,0,0,.42);
      }

      .tk-mini-logo {
        width: 100%;
        min-height: 43px;
        padding: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 0;
        background: transparent;
        color: white;
        cursor: pointer;
      }

      .tk-mini-logo-art {
        width: 41px;
        min-width: 41px;
        height: 41px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.20);
        border-radius: 13px;
        background: rgba(5, 20, 24, .64);
        box-shadow:
          0 8px 18px rgba(0,0,0,.28),
          inset 0 1px 0 rgba(255,255,255,.08);
      }

      .tk-mini-logo-image {
        display: block;
        width: 36px;
        max-width: 36px;
        height: auto;
        object-fit: contain;
      }

      .tk-mini-label,
      .tk-mini-nav button span,
      .tk-mini-bottom button span {
        opacity: 0;
        white-space: nowrap;
        transform: translateX(-8px);
        transition: opacity .22s ease, transform .3s ease;
      }

      .tk-mini-label {
        color: #fff5b8;
        font-size: 12px;
        font-weight: 1000;
        letter-spacing: .08em;
      }

      .tk-mini-sidebar:hover .tk-mini-label,
      .tk-mini-sidebar:hover .tk-mini-nav button span,
      .tk-mini-sidebar:hover .tk-mini-bottom button span {
        opacity: 1;
        transform: translateX(0);
      }

      .tk-mini-nav {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 24px;
      }

      .tk-mini-bottom {
        margin-top: auto;
      }

      .tk-mini-nav button,
      .tk-mini-bottom button {
        width: 100%;
        height: 45px;
        padding: 0 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        overflow: hidden;
        border: 1px solid transparent;
        border-radius: 14px;
        color: rgba(255,255,255,.72);
        background: transparent;
        cursor: pointer;
        transition: transform .2s ease, color .2s ease, background .2s ease, border-color .2s ease;
      }

      .tk-mini-nav button > svg,
      .tk-mini-bottom button > svg {
        display: block;
        flex: 0 0 20px;
        width: 20px;
        height: 20px;
      }

      .tk-mini-nav button:hover,
      .tk-mini-bottom button:hover {
        color: white;
        background: rgba(255,255,255,.10);
        transform: translateX(2px);
      }

      .tk-mini-nav button.active {
        color: #7ce3ff;
        border-color: rgba(83,215,255,.36);
        background: rgba(15,146,202,.20);
      }

      .tk-mini-nav button span,
      .tk-mini-bottom button span {
        font-size: 11px;
        font-weight: 850;
      }

      /* =====================================================
         CAMERA
      ===================================================== */

      .tk-world-camera {
        position: absolute;
        inset: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        transform-origin: center;
        will-change: transform;
      }

      .tk-world-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform: translateZ(-40px) scale(1.025);
      }

      .tk-world-bg-image {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        object-position: center center;
        filter: saturate(1.04) contrast(1.025) brightness(0.97);
      }

      .tk-world-depth-overlay {
        position: absolute;

        inset: 0;

        z-index: 2;

        pointer-events: none;

        background:
          linear-gradient(
            180deg,
            rgba(
              5,
              14,
              13,
              0.06
            ),
            transparent
              42%,
            rgba(
              3,
              10,
              9,
              0.18
            )
          ),
          radial-gradient(
            ellipse at
              center,
            transparent
              48%,
            rgba(
              2,
              9,
              8,
              0.16
            )
          );
      }

      /* =====================================================
         NODES
      ===================================================== */

      .tk-level-layer {
        position: absolute;

        inset: 0;

        z-index: 10;

        transform-style:
          preserve-3d;
      }

      .tk-level {
        position: absolute;

        min-width: 150px;

        padding: 0;

        display: flex;

        flex-direction:
          column;

        align-items:
          center;

        border: 0;

        color: white;

        background:
          transparent;

        cursor: pointer;

        transform:
          translate(
            -50%,
            -50%
          )
          translateZ(
            75px
          );

        transform-style:
          preserve-3d;
      }

      .tk-level-ground-shadow {
        position: absolute;

        top: 42px;
        left: 50%;

        z-index: -1;

        width: 76px;
        height: 27px;

        border-radius: 50%;

        background:
          rgba(
            1,
            7,
            5,
            0.46
          );

        filter:
          blur(5px);

        transform:
          translateX(-50%)
          rotateX(66deg);
      }

      .tk-level-orb {
        position: relative;

        z-index: 4;

        width: 58px;
        height: 58px;

        display: grid;

        place-items:
          center;

        border:
          4px solid
          rgba(
            255,
            248,
            211,
            0.95
          );

        border-radius:
          50%;

        color:
          #273522;

        background:
          radial-gradient(
            circle at
              34% 27%,
            #fff4a5,
            #ffd953
              47%,
            #e7a320
              100%
          );

        box-shadow:
          0 8px 0
            #8b641d,
          0 13px 25px
            rgba(
              0,
              0,
              0,
              0.34
            ),
          inset
            4px 5px 8px
            rgba(
              255,
              255,
              255,
              0.52
            );

        font-size: 17px;

        font-weight: 1000;
      }

      .tk-level.is-current
        .tk-level-orb {
        width: 72px;
        height: 72px;

        background:
          radial-gradient(
            circle at
              34% 27%,
            #fffbd2,
            #ffe15c
              48%,
            #f4ac26
              100%
          );

        box-shadow:
          0 9px 0
            #8c641b,
          0 0 0 9px
            rgba(
              255,
              221,
              76,
              0.16
            ),
          0 0 34px
            rgba(
              255,
              213,
              52,
              0.48
            ),
          0 16px 30px
            rgba(
              0,
              0,
              0,
              0.34
            );
      }

      .tk-level.is-completed
        .tk-level-orb {
        color: #153921;

        background:
          radial-gradient(
            circle at
              34% 27%,
            #d7ffcc,
            #6fd07e
          );

        box-shadow:
          0 8px 0
            #346d39,
          0 14px 24px
            rgba(
              0,
              0,
              0,
              0.3
            );
      }

      .tk-level.is-locked
        .tk-level-orb {
        width: 51px;
        height: 51px;

        color:
          #d7e2d9;

        border-color:
          rgba(
            220,
            231,
            217,
            0.72
          );

        background:
          radial-gradient(
            circle at
              34% 28%,
            #607064,
            #344238
          );

        box-shadow:
          0 7px 0
            #1b261d,
          0 12px 22px
            rgba(
              0,
              0,
              0,
              0.34
            );
      }

      .tk-level-pulse {
        position: absolute;

        top: -10px;
        left: 50%;

        z-index: 1;

        width: 92px;
        height: 92px;

        border:
          3px solid
          rgba(
            255,
            221,
            75,
            0.9
          );

        border-radius:
          50%;

        transform:
          translateX(-50%);

        pointer-events:
          none;
      }

      /* =====================================================
         BIGGER LEVEL NAMES
      ===================================================== */

      .tk-level-name {
        position: relative;

        z-index: 5;

        min-width: 145px;
        max-width: 210px;

        margin-top: 10px;

        padding:
          9px 13px;

        border:
          1px solid
          rgba(
            255,
            235,
            176,
            0.24
          );

        border-radius:
          14px;

        color:
          #fffdf2;

        background:
          linear-gradient(
            145deg,
            rgba(
              16,
              28,
              20,
              0.92
            ),
            rgba(
              7,
              19,
              14,
              0.86
            )
          );

        backdrop-filter:
          blur(10px);

        box-shadow:
          0 7px 0
            rgba(
              0,
              0,
              0,
              0.2
            ),
          0 13px 25px
            rgba(
              0,
              0,
              0,
              0.28
            );

        text-align:
          center;
      }

      .tk-level-name strong {
        display: block;

        color:
          #ffffff;

        font-size: 15px;

        line-height: 1.05;

        font-weight: 1000;

        letter-spacing:
          -0.02em;

        text-shadow:
          0 2px 4px
          rgba(
            0,
            0,
            0,
            0.4
          );
      }

      .tk-level-name small {
        display: block;

        margin-top: 4px;

        color:
          #ffe37d;

        font-size: 9px;

        line-height: 1.2;

        font-weight: 800;
      }

      .tk-level.is-current
        .tk-level-name {
        border-color:
          rgba(
            255,
            221,
            76,
            0.72
          );

        background:
          linear-gradient(
            145deg,
            rgba(
              38,
              42,
              19,
              0.95
            ),
            rgba(
              12,
              28,
              18,
              0.94
            )
          );

        box-shadow:
          0 7px 0
            rgba(
              83,
              62,
              15,
              0.62
            ),
          0 0 22px
            rgba(
              255,
              216,
              62,
              0.2
            ),
          0 15px 28px
            rgba(
              0,
              0,
              0,
              0.33
            );
      }

      .tk-level.is-locked
        .tk-level-name {
        opacity:
          0.76;
      }

      /* =====================================================
         STUDENT — FULL-BODY CHARACTER STANDING ON THE LAND
      ===================================================== */

      .tk-you-marker {
        position: absolute;
        z-index: 27;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform:
          translate(-50%, -100%)
          translateZ(120px);
        transform-origin: bottom center;
        pointer-events: none;
        filter: drop-shadow(0 11px 9px rgba(0,0,0,.34));
      }

      .tk-you-marker::after {
        content: '';
        position: absolute;
        z-index: -1;
        left: 50%;
        bottom: 2px;
        width: clamp(54px, 4.6vw, 78px);
        height: 18px;
        border-radius: 50%;
        background: rgba(8, 24, 14, .40);
        filter: blur(5px);
        transform: translateX(-50%) scaleX(1.08);
      }

      .tk-you-character {
        width: clamp(128px, 10vw, 195px);
        height: clamp(195px, 29vh, 300px);
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .tk-you-character-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: bottom center;
        transform-origin: bottom center;
      }

      .tk-you-marker > span {
        position: absolute;
        left: 50%;
        bottom: -19px;
        transform: translateX(-50%);
        padding: 4px 8px;
        border: 2px solid rgba(255,255,255,.60);
        border-radius: 999px;
        color: #172319;
        background: #ffe263;
        box-shadow: 0 4px 0 rgba(123,88,24,.72), 0 7px 13px rgba(0,0,0,.24);
        font-size: 7px;
        font-weight: 1000;
        letter-spacing: .07em;
        white-space: nowrap;
      }

      /* =====================================================
         FULL MAP BUTTON
      ===================================================== */

      .tk-full-map-btn {
        position: absolute;

        z-index: 80;

        top: 18px;
        left: 18px;

        min-height: 42px;

        display: flex;

        align-items:
          center;

        gap: 8px;

        padding:
          0 15px;

        border:
          1px solid
          rgba(
            255,
            232,
            164,
            0.22
          );

        border-radius:
          999px;

        color:
          #fff9dd;

        background:
          rgba(
            8,
            21,
            14,
            0.78
          );

        backdrop-filter:
          blur(12px);

        box-shadow:
          0 10px 25px
          rgba(
            0,
            0,
            0,
            0.26
          );

        font-size: 9px;

        font-weight: 1000;

        letter-spacing:
          0.08em;

        cursor: pointer;
      }

      /* =====================================================
         JULIE
      ===================================================== */

      .tk-julie {
        position: absolute;
        z-index: 72;

        /*
         * Miss Julie stands directly under the wooden TALKORA board.
         * Her feet visually land on the left jungle platform instead
         * of floating in the air.
         */
        left: 7.2%;
        bottom: 45.1%;

        right: auto;
        top: auto;

        display: flex;
        align-items: flex-end;
        gap: 8px;

        pointer-events: none;
        transform-origin: bottom left;
      }

      .tk-julie::after {
        content: '';
        position: absolute;
        z-index: -1;

        left: clamp(62px, 6.8vw, 96px);
        bottom: -3px;

        width: clamp(96px, 8.5vw, 138px);
        height: 24px;

        border-radius: 50%;

        background:
          rgba(7, 24, 13, .38);

        filter: blur(6px);

        transform:
          translateX(-50%)
          scaleY(.62);
      }

      .tk-julie-character {
        width: clamp(145px, 11vw, 205px);
        height: clamp(235px, 31vh, 315px);

        display: flex;
        align-items: flex-end;
        justify-content: center;

        transform-origin: bottom center;
      }

      .tk-julie-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: bottom center;
        filter: drop-shadow(0 16px 13px rgba(0,0,0,.40));
        transform-origin: bottom center;
      }

      .tk-julie-bubble {
        position: relative;
        width: clamp(260px, 24vw, 400px);
        margin-bottom: clamp(76px, 11vh, 112px);
        padding: 14px 15px;
        border: 3px solid #e8c4c7;
        border-radius: 19px 19px 19px 6px;
        color: #21362a;
        background: rgba(255,249,234,.97);
        box-shadow: 0 9px 0 rgba(160,102,105,.18), 0 20px 35px rgba(0,0,0,.30);
        pointer-events: auto;
        backdrop-filter: blur(5px);
        animation: tkBubbleIn .55s cubic-bezier(.34,1.56,.64,1);
      }

      @keyframes tkBubbleIn {
        from { opacity: 0; transform: translate(-12px, 12px) scale(.9); }
        to { opacity: 1; transform: translate(0,0) scale(1); }
      }

      .tk-julie-bubble::before {
        content: '';
        position: absolute;
        left: -13px;
        top: 34px;
        width: 24px;
        height: 24px;
        background: #fff9ea;
        border-left: 3px solid #e8c4c7;
        border-bottom: 3px solid #e8c4c7;
        transform: rotate(45deg);
      }

      .tk-julie-header {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .tk-julie-header span {
        color: #d75f7c;
        font-size: 8px;
        font-weight: 1000;
        letter-spacing: .14em;
      }

      .tk-julie-header button {
        width: 31px;
        height: 31px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 50%;
        color: #26362a;
        background: rgba(30,51,34,.08);
        cursor: pointer;
        transition: transform .2s ease, background .2s ease;
      }

      .tk-julie-header button:hover {
        transform: scale(1.08);
        background: rgba(30,51,34,.14);
      }

      .tk-julie-bubble p {
        position: relative;
        z-index: 2;
        min-height: 38px;
        margin: 8px 0 0;
        font-size: 12px;
        font-weight: 750;
        line-height: 1.46;
      }

      .tk-julie-cursor {
        display: inline-block;
        margin-left: 1px;
        color: #d75f7c;
        animation: tkCursor .7s steps(1) infinite;
      }

      @keyframes tkCursor {
        50% { opacity: 0; }
      }

      .tk-julie-bubble small {
        display: block;
        margin-top: 7px;
        color: #967477;
        font-size: 8px;
      }

      /* =====================================================
         SOUND
      ===================================================== */

      .tk-sound-wave {
        position: relative;

        z-index: 2;

        height: 16px;

        margin-top: 7px;

        display: flex;

        align-items:
          center;

        gap: 3px;
      }

      .tk-sound-wave i {
        width: 3px;
        height: 6px;

        border-radius:
          999px;

        background:
          #d75f7c;

        animation:
          tkJulieWave
          0.55s
          ease-in-out
          infinite;
      }

      .tk-sound-wave i:nth-child(2) {
        animation-delay:
          0.08s;
      }

      .tk-sound-wave i:nth-child(3) {
        animation-delay:
          0.16s;
      }

      .tk-sound-wave i:nth-child(4) {
        animation-delay:
          0.24s;
      }

      .tk-sound-wave i:nth-child(5) {
        animation-delay:
          0.32s;
      }

      @keyframes tkJulieWave {
        50% {
          height: 15px;
        }
      }

      .tk-spin {
        animation:
          tkSpin
          0.9s linear
          infinite;
      }

      @keyframes tkSpin {
        to {
          transform:
            rotate(
              360deg
            );
        }
      }

      /* =====================================================
         ENTERING
      ===================================================== */

      .tk-entering {
        position: absolute;

        inset: 0;

        z-index: 150;

        display: grid;

        place-items:
          center;

        background:
          radial-gradient(
            circle at
              center,
            rgba(
              63,
              113,
              70,
              0.1
            ),
            rgba(
              1,
              9,
              6,
              0.78
            )
          );

        backdrop-filter:
          blur(3px);
      }

      .tk-entering > div {
        display: flex;

        flex-direction:
          column;

        align-items:
          center;

        color: white;

        text-align: center;
      }

      .tk-entering svg {
        color:
          #ffe36a;
      }

      .tk-entering span {
        margin-top: 10px;

        color:
          #a9e5b9;

        font-size: 9px;

        font-weight: 1000;

        letter-spacing:
          0.18em;
      }

      .tk-entering strong {
        margin-top: 5px;

        font-size: 31px;
      }

      /* =====================================================
         TABLET
      ===================================================== */

      @media (
        max-width: 950px
      ) {
        .tk-level-name {
          min-width: 118px;

          max-width: 150px;

          padding:
            7px 9px;
        }

        .tk-level-name strong {
          font-size: 12px;
        }

        .tk-level-name small {
          font-size: 7px;
        }


        .tk-julie {
          top: 28%;
          left: 14%;
        }

        .tk-julie-character {
          width: 102px;
          height: 172px;
        }

        .tk-julie-bubble {
          width: 200px;
          margin-top: 12px;
          margin-bottom: 0;
        }
      }

      /* =====================================================
         MOBILE
      ===================================================== */

      @media (
        max-width: 680px
      ) {
        .tk-map {
          width: 100vw;
          height: 100dvh;
          min-height: 100dvh;
        }

        .tk-map-stage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          perspective: none;
        }

        .tk-world-camera {
          inset: 0;

          transform:
            none !important;
        }

        .tk-world-bg {
          transform: none;
        }

        .tk-world-bg-image {
          object-position:
            50% center;
        }

        .tk-level {
          min-width: 90px;

          transform:
            translate(
              -50%,
              -50%
            ) !important;
        }

        .tk-level-orb {
          width: 42px;
          height: 42px;

          border-width: 3px;

          font-size: 12px;
        }

        .tk-level.is-current
          .tk-level-orb {
          width: 52px;
          height: 52px;
        }

        .tk-level.is-locked
          .tk-level-orb {
          width: 37px;
          height: 37px;
        }

        .tk-level-name {
          min-width: 84px;
          max-width: 108px;

          margin-top: 6px;

          padding:
            6px 7px;

          border-radius:
            9px;
        }

        .tk-level-name strong {
          font-size: 9px;
        }

        .tk-level-name small {
          font-size: 6px;
        }

        .tk-you-marker {
          display: flex;
          transform:
            translate(-50%, -100%) !important;
        }

        .tk-you-character {
          width: 96px;
          height: 160px;
        }

        .tk-you-marker > span {
          bottom: -16px;
          padding: 3px 6px;
          font-size: 6px;
        }

        .tk-julie {
          top: 23%;
          left: 58px;
          right: auto;
          bottom: auto;
          align-items: flex-start;
          transform: none !important;
        }

        .tk-julie-character {
          width: 72px;
          height: 124px;
        }

        .tk-julie::after {
          left: 36px;
          top: 112px;
          width: 56px;
          height: 15px;
        }

        .tk-julie-bubble {
          width: min(58vw, 250px);
          margin: 8px 0 0;
          padding: 10px 11px;
        }

        .tk-julie-bubble::before {
          top: 22px;

          left: -9px;
          bottom: auto;

          width: 17px;
          height: 17px;
        }

        .tk-julie-bubble p {
          font-size: 10px;
        }


        .tk-full-map-btn {
          top: 125px;
          left: 10px;
        }

        .tk-mini-sidebar {
          top: 8px;
          left: 8px;
          bottom: 8px;
          width: 50px;
          padding: 5px;
          border-radius: 17px;
        }

        .tk-mini-sidebar:hover {
          width: 168px;
        }

        .tk-mini-logo-art {
          width: 38px;
          min-width: 38px;
          height: 38px;
          border-radius: 12px;
        }

        .tk-mini-logo-image {
          width: 33px;
          max-width: 33px;
        }

        .tk-mini-nav {
          margin-top: 16px;
          gap: 4px;
        }

        .tk-mini-nav button,
        .tk-mini-bottom button {
          height: 41px;
          padding: 0 9px;
        }

      }

      /* =====================================================
         ERROR
      ===================================================== */

      .tk-map-error {
        min-height: 100dvh;

        display: grid;

        place-items:
          center;

        padding: 20px;

        color: white;

        background:
          #101915;
      }

      .tk-map-error > div {
        width:
          min(
            420px,
            100%
          );

        padding: 28px;

        border-radius: 22px;

        background:
          #17271d;

        text-align: center;
      }

      .tk-map-error p {
        color:
          #bfd1c3;
      }

      .tk-map-error button {
        min-height: 44px;

        margin-top: 10px;

        padding:
          0 18px;

        border: 0;

        border-radius: 13px;

        color:
          #172019;

        background:
          #ffe05c;

        font-weight: 900;

        cursor: pointer;
      }

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
  )
}
