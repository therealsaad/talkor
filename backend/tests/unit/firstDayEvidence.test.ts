import { firstDaySceneSkills } from '../../src/services/first-day-evidence'

describe('First Day conversational mastery evidence', () => {
  it.each([
    ['hello-school', 'school'], ['skip-bunny', 'skip'],
    ['skip-bunny', 'I am skipping'], ['run-race', 'I can run'],
    ['run-race', 'running'], ['walk-school', 'I walk to school'],
    ['big-grin', 'I smile'], ['school-bell', 'I hear a bell'],
    ['jump-frog', 'I can jump'], ['play-friends', 'play'],
    ['enter-class', 'classroom'], ['grade-one', 'I am in Grade One'],
  ])('accepts a new, relevant English attempt for %s: %s', (scene, utterance) => {
    expect(firstDaySceneSkills(scene, utterance)).toEqual(['first_day_english_attempt'])
  })
  it.each([
    ['skip-bunny', 'billi'], ['skip-bunny', 'बिल्ली'],
    ['skip-bunny', 'jump'], ['skip-bunny', 'What does skip mean?'],
    ['skip-bunny', 'skip?'], ['skip-bunny', "I don't know skip"],
    ['skip-bunny', 'please repeat skip'],
    ['run-race', 'no idea'], ['school-bell', 'what is a bell?'],
    ['jump-frog', 'काय jump म्हणजे'], ['grade-one', 'मदद school'],
    ['skip-bunny', ''], ['skip-bunny', 'cat'],
  ])('keeps the scene active for an unclear/help/unrelated attempt %s: %s', (scene, utterance) => {
    expect(firstDaySceneSkills(scene, utterance)).toEqual([])
  })
  it('does not treat grade or other scenes as permission to advance', () => {
    expect(firstDaySceneSkills('run-race', 'I can skip')).toEqual([])
    expect(firstDaySceneSkills('unapproved', 'skip')).toEqual([])
  })
})
