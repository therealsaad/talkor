import type { LearningMode, LevelActivity, SuggestedActivity } from '../../types'

/** English Balbharati Standard One, first edition 2025 / reprint 2026.
 *  Official source: https://ebooks.ebalbharati.in/pdfs/103050001.pdf
 *  Page numbers are the printed textbook pages, not PDF viewer page indices.
 *  Chapter names are bibliographic references only. All Talkora activities
 *  below are ORIGINAL prompts, not transcribed textbook passages or artwork.
 *  This is an editorial DRAFT; educator approval and student trials are pending.
 */
export const CLASS1_BALBHARATI_SOURCE = 'English Balbharati Standard One (2025; 2026 reprint)'

type DraftExercise = {
  chapter: string
  name: string
  page: number
  mode: LearningMode
  prompt: string
  evidence: string
}

type Class1LevelDraft = {
  level: number
  title: string
  goal: string
  scene: string
  exercises: readonly DraftExercise[]
}

/** One original voice-first activity for EACH of the 44 real textbook lessons.
 *  The ten Talkora levels group related chapters, not entire unit recitations.
 */
export const CLASS1_BALBHARATI_DRAFTS: readonly Class1LevelDraft[] = [
  { level: 1, title: 'Little Words & My First Day', goal: 'Use beginner school words in a first-day conversation.', scene: 'First Day Word Meadow', exercises: [
    { chapter:'1.1', name:'My First Day', page:1, mode:'guided-dialogue', prompt:'Miss Julie is at school. Say one English word about your school.', evidence:'Learner tries a relevant English school word or requests a model.' },
  ] },
  { level: 2, title: 'Action Beats & Rainbow Words', goal: 'Listen, act and connect letters with familiar words.', scene: 'Rainbow Sound Garden', exercises: [
    { chapter:'1.2', name:'Clap your hands.', page:2, mode:'repeat-after-julie', prompt:'Clap two times. Now say clap with Miss Julie.', evidence:'Learner attempts the action word after modeling.' },
    { chapter:'1.3', name:'I know my alphabet.', page:3, mode:'listen-and-find', prompt:'Listen to the letter B. Find B from A, B and D.', evidence:'Learner distinguishes the named letter from distractors.' },
    { chapter:'1.4', name:'Let us read.', page:5, mode:'word-builder', prompt:'Put c, a and t together. What word did we make?', evidence:'Learner builds cat and attempts to say it.' },
    { chapter:'1.5', name:'Fun with Special Letters', page:7, mode:'repeat-after-julie', prompt:'Listen to sh in ship. Can you try the sound sh?', evidence:'Learner attempts an English letter combination without an accent score.' },
    { chapter:'1.6', name:'The Rainbow', page:8, mode:'picture-choice', prompt:'Look at three colour cards. Which one is red?', evidence:'Learner selects or names a presented colour.' },
  ] },
  { level: 3, title: 'My Family & My Day', goal: 'Name familiar people and say one short daily-routine sentence.', scene: 'Happy Home Lane', exercises: [
    { chapter:'1.7', name:'Meet my family.', page:10, mode:'picture-choice', prompt:'Find the picture of a family. Say family with Miss Julie.', evidence:'Learner identifies family and repeats the English noun.' },
    { chapter:'1.8', name:'Let us know each other.', page:11, mode:'role-play', prompt:'Miss Julie says hello. Reply with hello or hi.', evidence:'Learner participates in a greeting without sharing personal details.' },
    { chapter:'1.9', name:'Everybody has a name.', page:14, mode:'guided-dialogue', prompt:'Meet our toy bear, Coco. What is the bear called?', evidence:'Learner uses the fictional character name in a short answer.' },
    { chapter:'1.10', name:'My Daily Routine', page:16, mode:'sentence-builder', prompt:'It is morning. Finish the sentence: I wash my ___.', evidence:'Learner attempts an everyday English action sentence.' },
  ] },
  { level: 4, title: 'Play, Park & Home', goal: 'Use place words and polite action sentences in familiar spaces.', scene: 'Playful Park', exercises: [
    { chapter:'2.1', name:'It’s Time to Play', page:18, mode:'guided-dialogue', prompt:'Imagine a ball on the grass. Tell Miss Julie: I play with a ___.', evidence:'Learner fills the model with ball or requests a hint.' },
    { chapter:'2.2', name:'Avni’s Visit to a Park', page:19, mode:'picture-choice', prompt:'Find the tree in our park scene. Say tree.', evidence:'Learner recognizes a simple park object.' },
    { chapter:'2.3', name:'In the Classroom', page:21, mode:'listen-and-find', prompt:'Miss Julie says desk. Find the desk on our classroom board.', evidence:'Learner recognizes an authored classroom object.' },
    { chapter:'2.4', name:'My House', page:23, mode:'sentence-builder', prompt:'Look at our little house. Complete: This is my ___.', evidence:'Learner attempts house in an English sentence.' },
  ] },
  { level: 5, title: 'Weather & Magic Words', goal: 'Speak politely, name weather and talk about books and everyday actions.', scene: 'Sunny Reading Corner', exercises: [
    { chapter:'2.5', name:'Weather', page:26, mode:'picture-choice', prompt:'Which picture shows rain? Say rain with Miss Julie.', evidence:'Learner identifies a simple weather picture and word.' },
    { chapter:'2.6', name:'Magic Words', page:27, mode:'role-play', prompt:'Miss Julie gives you a pencil. What polite English word can you say?', evidence:'Learner tries thank you with a gentle model if needed.' },
    { chapter:'2.7', name:'Things I Do', page:28, mode:'repeat-after-julie', prompt:'Miss Julie draws a sun. Say: I draw.', evidence:'Learner uses a present-tense first-person action pattern.' },
    { chapter:'2.8', name:'Classroom Library', page:31, mode:'guided-dialogue', prompt:'Imagine you want a book. Ask: May I have a book?', evidence:'Learner attempts a polite request without forced fluency grading.' },
  ] },
  { level: 6, title: 'Around My Colourful World', goal: 'Identify transport, plants and celebrations with simple descriptive English.', scene: 'Festival Flower Trail', exercises: [
    { chapter:'2.9', name:'Our Vehicles', page:33, mode:'listen-and-find', prompt:'Hear the word bus. Which of these vehicles is a bus?', evidence:'Learner identifies the named vehicle.' },
    { chapter:'2.10', name:'Himani and the Ladybug', page:35, mode:'picture-choice', prompt:'Find the tiny red-and-black ladybug in our garden scene.', evidence:'Learner recognizes a ladybug without using textbook illustrations.' },
    { chapter:'2.11', name:'My Flower', page:37, mode:'sentence-builder', prompt:'Our flower is yellow. Finish: The flower is ___.', evidence:'Learner attempts a simple colour description.' },
    { chapter:'2.12', name:'Festivals', page:38, mode:'guided-dialogue', prompt:'Let us imagine a celebration. Say: We are happy.', evidence:'Learner participates in an inclusive celebration conversation.' },
  ] },
  { level: 7, title: 'Friends, Opposites & Books', goal: 'Compare opposites and tell one short original friendship or book story.', scene: 'Book Tree Village', exercises: [
    { chapter:'3.1', name:'Opposites', page:41, mode:'picture-choice', prompt:'This ball is big. Find the small ball.', evidence:'Learner distinguishes a basic pair of opposites.' },
    { chapter:'3.2', name:'Suyog makes friends.', page:42, mode:'role-play', prompt:'A new friend joins our game. Say: Come and play!', evidence:'Learner uses a welcoming English invitation.' },
    { chapter:'3.3', name:'The Fox and the Crow', page:44, mode:'guided-dialogue', prompt:'Our puppet fox asks for help. Should we use kind words?', evidence:'Learner gives a brief supported response about kindness.' },
    { chapter:'3.4', name:'Books are my best friends.', page:45, mode:'listen-and-answer', prompt:'Miss Julie holds a storybook. What do we do with a book?', evidence:'Learner attempts read or a modeled reading phrase.' },
    { chapter:'3.5', name:'Open a book.', page:46, mode:'repeat-after-julie', prompt:'Pretend to open a book. Say: Open the book.', evidence:'Learner connects a spoken instruction to an action.' },
  ] },
  { level: 8, title: 'Market, Animals & Kindness', goal: 'Name daily-life items and talk about helping others.', scene: 'Kindness Market', exercises: [
    { chapter:'3.6', name:'Raghu goes to the market.', page:48, mode:'role-play', prompt:'Our pretend shop sells apples. Ask: One apple, please.', evidence:'Learner uses a small polite buying phrase.' },
    { chapter:'3.7', name:'The Squirrel', page:51, mode:'picture-choice', prompt:'Find the squirrel hiding near our tree.', evidence:'Learner identifies a familiar animal.' },
    { chapter:'3.8', name:'Alia falls sick.', page:52, mode:'guided-dialogue', prompt:'Our toy bunny feels unwell. Say: Get well soon.', evidence:'Learner uses an empathetic English phrase.' },
    { chapter:'3.9', name:'The Ant and the Grasshopper', page:55, mode:'picture-choice', prompt:'Which insect is small: the ant or the grasshopper?', evidence:'Learner identifies the ant in an original visual comparison.' },
    { chapter:'3.10', name:'Minku, the Monkey', page:57, mode:'repeat-after-julie', prompt:'Our monkey puppet jumps. Say: The monkey can jump.', evidence:'Learner attempts a simple can + verb sentence.' },
    { chapter:'3.11', name:'My Kitty Cat', page:59, mode:'sentence-builder', prompt:'Our cat is sleepy. Complete: The cat is ___.', evidence:'Learner supplies a simple descriptive word.' },
  ] },
  { level: 9, title: 'Nature, Music & Imagination', goal: 'Speak about movement, animals, music and an imaginary journey.', scene: 'Nature & Space Explorers', exercises: [
    { chapter:'4.1', name:'A boy went walking', page:61, mode:'repeat-after-julie', prompt:'Our explorer walks slowly. Say: I can walk.', evidence:'Learner uses a familiar movement action.' },
    { chapter:'4.2', name:'Harry, the Hippo', page:63, mode:'picture-choice', prompt:'Find the big hippo beside our river.', evidence:'Learner names or selects the hippo.' },
    { chapter:'4.3', name:'Singing is Fun!', page:65, mode:'guided-dialogue', prompt:'Can you sing? Tell Miss Julie: Yes, I can or Not yet.', evidence:'Learner attempts an affirmative or gentle negative response.' },
    { chapter:'4.4', name:'A Walk in Nature', page:66, mode:'listen-and-find', prompt:'Hear bird. Find the bird in our forest scene.', evidence:'Learner recognizes the spoken nature word.' },
    { chapter:'4.5', name:'The Elephant and the Ants', page:67, mode:'picture-choice', prompt:'Find the big elephant and a tiny ant.', evidence:'Learner distinguishes elephant and ant visually.' },
    { chapter:'4.6', name:'Off to Mars!', page:69, mode:'role-play', prompt:'Our pretend rocket goes up. Say: Up, up, rocket!', evidence:'Learner joins an original imaginary space conversation.' },
  ] },
  { level: 10, title: 'Good Choices & My Happy Holidays', goal: 'Use kind English in simple stories, home routines and holiday talk.', scene: 'Celebration Story Studio', exercises: [
    { chapter:'4.7', name:'Honest Abhi', page:71, mode:'scenario-decision', prompt:'You found a lost pencil. Should you return it? Say: Here you go.', evidence:'Learner chooses a kind response in an original situation.' },
    { chapter:'4.8', name:'A Joyful Day', page:73, mode:'guided-dialogue', prompt:'We had a fun day in the park. Say: I am happy.', evidence:'Learner makes a short feeling sentence.' },
    { chapter:'4.9', name:'A Gift for Mother', page:75, mode:'role-play', prompt:'Imagine giving a handmade card to someone at home. Say: For you!', evidence:'Learner expresses kindness without asking for personal details.' },
    { chapter:'4.10', name:'Cookout', page:77, mode:'listen-and-answer', prompt:'We pretend to make fruit salad. Say: I like fruit.', evidence:'Learner joins an original food conversation.' },
    { chapter:'4.11', name:'Summer Holidays', page:78, mode:'speaking-reflection', prompt:'Imagine one fun holiday. Say: I want to play.', evidence:'Learner offers a short supported future plan.' },
  ] },
]

export function class1DraftActivities(level: number): LevelActivity[] {
  const draft = CLASS1_BALBHARATI_DRAFTS.find((item) => item.level === level)
  if (!draft) return []
  return draft.exercises.map((item) => ({
    id: `class1-l${String(level).padStart(2, '0')}-${item.chapter.replace('.', '-')}`,
    type: item.mode,
    prompt: item.prompt,
    successCriteria: item.evidence,
    difficulty: level < 4 ? 1 : level < 8 ? 2 : 3,
    approved: false,
  }))
}

export function class1DraftSuggestions(level: number): SuggestedActivity[] {
  const draft = CLASS1_BALBHARATI_DRAFTS.find((item) => item.level === level)
  if (!draft) return []
  return draft.exercises.map((item) => ({
    label: `${item.chapter} ${item.name} (p. ${item.page})`,
    mode: item.mode,
    educatorNote: `Original Talkora prompt: ${item.prompt} Review target, visuals, optional Hindi/Marathi scaffolds, transcripts, audio and evidence rubric: ${item.evidence}. No textbook reproduction. Teacher sign-off required.`,
  }))
}
