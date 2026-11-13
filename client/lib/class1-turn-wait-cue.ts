/** Immediate, non-evaluative visual feedback for a real Class 1 voice turn.
 * No timers, network calls, student data, success claims, speech or progress.
 * A label changes only when the existing authoritative UI phase changes.
 */
export type Class1TurnWaitCue = {
  label: string
  invitation: string
}

export function class1TurnWaitCue(phase: string): Class1TurnWaitCue | null {
  switch (phase) {
    case 'julie_preparing':
      return {
        label: 'Opening our next little lesson…',
        invitation: 'Look at the picture while Miss Julie gets ready.',
      }
    case 'transcribing':
      return {
        label: 'Working out your words…',
        invitation: 'Look at the highlighted word. You can take your time.',
      }
    case 'student_submitted':
    case 'julie_thinking':
      return {
        label: 'Choosing your next little step…',
        invitation: 'Every try helps us learn.',
      }
    case 'julie_text_ready':
    case 'julie_audio_pending':
      return {
        label: 'Getting Miss Julie’s voice ready…',
        invitation: 'You can look at the picture while her voice loads.',
      }
    default:
      return null
  }
}
