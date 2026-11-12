/** Playable zero-amplitude PCM, not a zero-length WAV header.
 * Use from an explicit teacher/video-start gesture to unlock later speech.
 * A 250ms silent PCM clip does not produce sound or contact speech vendors.
 */
export function createSilentUnlockWav(): Blob {
  const rate = 8000
  const samples = rate / 4
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  const word = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i))
  }
  word(0, 'RIFF')
  view.setUint32(4, buffer.byteLength - 8, true)
  word(8, 'WAVE')
  word(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  word(36, 'data')
  view.setUint32(40, samples * 2, true)
  return new Blob([buffer], { type: 'audio/wav' })
}
