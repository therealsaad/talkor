import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { firstUnfinishedActivity, isOpenLessonConversation, personalizeLessonText, shouldUseLessonVoice } from './lesson-progress'

test('resumes after completed activities and permits replay after full completion', () => {
  const ids = ['warmup', 'model', 'repeat']
  assert.equal(firstUnfinishedActivity(ids, new Set(['warmup', 'model'])), 2)
  assert.equal(firstUnfinishedActivity(ids, new Set(ids)), 0)
})

test('resumes at the next playable activity without recording unavailable KG pictures as progress', () => {
  const ids = ['missing-picture-1', 'completed-model', 'next-speak', 'missing-picture-2']
  const unavailable = new Set(['missing-picture-1', 'missing-picture-2'])
  assert.equal(firstUnfinishedActivity(ids, new Set(['completed-model']), unavailable), 2)
})

test('uses the current learner name in legacy model lines', () => {
  assert.equal(personalizeLessonText('Hello Aarav! My name is Aarav.', 'Shaikh'), 'Hello Shaikh! My name is Shaikh.')
})

test('detects syllabus open conversation steps including follow-up and warm-up AI', () => {
  assert.equal(isOpenLessonConversation({ type: 'FOLLOW_UP_CONVERSATION', stage: 'FOLLOW_UP', metadata: { conversationMode: 'OPEN' } }), true)
  assert.equal(isOpenLessonConversation({ type: 'LIKE_DISLIKE', stage: 'WARM_UP', aiEnabled: true, metadata: { digitalType: 'VISUAL_WARM_UP' } }), true)
  assert.equal(isOpenLessonConversation({ type: 'REPEAT_SENTENCE', stage: 'LISTEN_REPEAT' }), false)
})

test('plays voice for listening activities and spoken conversations', () => {
  assert.equal(shouldUseLessonVoice({ type: 'LIKE_DISLIKE', stage: 'WARM_UP' }), true)
  assert.equal(shouldUseLessonVoice({ type: 'LISTEN_MODEL', stage: 'LISTEN_REPEAT' }), true)
  assert.equal(shouldUseLessonVoice({ type: 'REPEAT_SENTENCE', stage: 'LISTEN_REPEAT' }), true)
  assert.equal(shouldUseLessonVoice({ type: 'OPEN_CONVERSATION', stage: 'INTERACT' }), true)
  assert.equal(shouldUseLessonVoice({ type: 'PICTURE_CHOICE', stage: 'REWARD' }), false)
})
