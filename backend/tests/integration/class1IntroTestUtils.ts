import request from 'supertest'
import type { Express } from 'express'
import { Class1IntroVisit } from '../../src/models/Class1IntroVisit'

/** Real intro endpoints; advance only the server's clock in disposable Mongo. */
export async function watchFirstDayIntro(app: Express, headers: Record<string, string>, studentId: string, lessonId: string) {
  const started = await request(app).post('/api/voice/first-day/intro/start').set(headers).send({ lessonId }).expect(200)
  const playbackId: string = started.body.data.playbackId
  const visit = await Class1IntroVisit.findOne({ studentId, lessonId }).sort({ authVersion: -1 })
  if (!visit) throw Error('Synthetic intro visit missing')
  await Class1IntroVisit.updateOne({ _id: visit._id }, { $set: { startedAt: new Date(Date.now() - 91_000) } })
  await request(app).post('/api/voice/first-day/intro/complete').set(headers)
    .send({ lessonId, playbackId, videoEnded: true }).expect(200)
  return playbackId
}
