export type TeachingPhase =
  | 'ready'
  | 'model'
  | 'listen'
  | 'support'
  | 'success'
  | 'practice'
  | 'practice-listen'
  | 'gate'
  | 'complete'
export interface TeachingState {
  phase: TeachingPhase
  feedback: 'help' | 'silence' | null
  practice: boolean
}
export type TeachingEvent =
  | 'START'
  | 'OPEN_TURN'
  | 'EXPECTED'
  | 'HELP'
  | 'SILENCE'
  | 'RETRY'
  | 'CONTINUE'
  | 'SIGN_OFF'
  | 'RESET'
export const initialTeachingState: TeachingState = {
  phase: 'ready',
  feedback: null,
  practice: false,
}
/** Staff chooses simulated outcomes. This is not speech recognition, grading, or student mastery. */
export function teachingTransition(
  state: TeachingState,
  event: TeachingEvent
): TeachingState {
  if (event === 'RESET') return { ...initialTeachingState }
  if (state.phase === 'ready' && event === 'START')
    return { ...state, phase: 'model' }
  if (state.phase === 'model' && event === 'OPEN_TURN')
    return { ...state, phase: 'listen' }
  if (state.phase === 'practice' && event === 'OPEN_TURN')
    return { ...state, phase: 'practice-listen', practice: true }
  if (['listen', 'practice-listen'].includes(state.phase)) {
    if (event === 'EXPECTED')
      return {
        ...state,
        phase: state.practice ? 'gate' : 'success',
        feedback: null,
      }
    if (event === 'HELP' || event === 'SILENCE')
      return {
        ...state,
        phase: 'support',
        feedback: event === 'HELP' ? 'help' : 'silence',
      }
  }
  if (state.phase === 'support' && event === 'RETRY')
    return { ...state, phase: state.practice ? 'practice-listen' : 'listen' }
  if (state.phase === 'success' && event === 'CONTINUE')
    return { ...state, phase: 'practice' }
  if (state.phase === 'gate' && event === 'SIGN_OFF')
    return { ...state, phase: 'complete' }
  return state
}
