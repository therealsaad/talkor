/** A claimed audio MIME type is not proof that the bytes are playable.
 * Pure format sniff used by supervised (paid, explicitly opted in) voice smoke.
 */
export function hasExpectedAudioHeader(audio: Buffer, contentType: string): boolean {
  if (audio.length < 256) return false
  if (/audio\/(?:mpeg|mp3)/i.test(contentType)) {
    return audio.subarray(0, 3).toString('ascii') === 'ID3' ||
      (audio[0] === 0xff && ((audio[1] ?? 0) & 0xe0) === 0xe0)
  }
  if (/audio\/(?:wav|wave|x-wav)/i.test(contentType)) {
    return audio.subarray(0, 4).toString('ascii') === 'RIFF' &&
      audio.subarray(8, 12).toString('ascii') === 'WAVE'
  }
  return false
}
