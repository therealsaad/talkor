export const KG_SESSION_END_EVENT = 'talkora:kg-session-end'

/** Close late permission grants after cancellation, navigation, or a permission timeout. */
export async function requestKGMicrophone(signal: AbortSignal, timeoutMs = 20000): Promise<MediaStream> {
  signal.throwIfAborted()
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw Object.assign(new Error('This browser does not support recording'), { name: 'NotSupportedError' })
  }
  return new Promise((resolve, reject) => {
    let finished = false
    const clean = () => { clearTimeout(timer); signal.removeEventListener('abort', abort) }
    const fail = (error: unknown) => { if (finished) return; finished = true; clean(); reject(error) }
    const abort = () => fail(signal.reason || new DOMException('Cancelled', 'AbortError'))
    const timer = setTimeout(() => fail(new DOMException('Microphone permission timed out', 'TimeoutError')), timeoutMs)
    signal.addEventListener('abort', abort, { once: true })
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
      .then((stream) => {
        if (finished || signal.aborted) { stream.getTracks().forEach((track) => track.stop()); return }
        finished = true; clean(); resolve(stream)
      }, fail)
  })
}
