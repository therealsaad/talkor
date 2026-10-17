import type { KGCurriculumUnit, KGActivityPlan, KGVocabularyWord, StarterUnit } from '../types'

const CURRICULUM_VERSION = 'talkora-kg-foundation-pilot-v1' as const
const PILOT_LABEL = 'Talkora KG foundation pilot; not school-syllabus-approved'
const MISS_JULIE_GUIDANCE = {
  character: 'Miss Julie uses Talkora’s approved neutral character identity.',
  beginnerSupport: 'The child may listen first or answer with one English word or a very short phrase.',
  correctionStyle: 'Praise the attempt. Correct only one clear language error, model one short sentence, and invite an optional repeat.',
  homeLanguageSupport: 'Use a brief Hindi word hint only when it helps; never shame Hindi or another home language.',
  followUpStyle: 'Ask one short question about the current lesson. Never require a long or personal answer.',
}

interface LessonDraft {
  title: string
  subtitle: string
  objectives: string[]
  newWords: string[]
  modelSentence: string
  conversationQuestion: string
  conversationModel: string
  homework: string
}

interface UnitDraft extends StarterUnit {
  number: number
  term: 1 | 2
  learningObjectives: string[]
  vocabulary: Array<[word: string, hindi: string]>
  /** Words encountered in earlier units and deliberately brought back here. */
  reviewWords: string[]
  lessons: [LessonDraft, LessonDraft, LessonDraft]
  introStoryboard: string[]
}

type ActivityDetails = Pick<KGActivityPlan, 'type' | 'stage' | 'title' | 'prompt' | 'difficulty' | 'estimatedSeconds'> &
  Partial<Pick<KGActivityPlan,
    'instruction' | 'target' | 'teacherPrompt' | 'modelSentence' | 'hint' | 'content' | 'choices' | 'answer' |
    'allowMic' | 'allowOptions' | 'conversationGoal'>> &
  { metadata?: Record<string, unknown> }

const unitDrafts: UnitDraft[] = [
  {
    number: 1,
    term: 1,
    title: 'Look, Touch & Say',
    world: 'Picture Garden',
    description: 'Listen, notice, and name familiar things with Miss Julie.',
    words: ['Apple', 'Cat', 'Dog', 'Ball'],
    sentence: 'This is an apple.',
    question: 'What do you see?',
    example: 'I see an apple.',
    homework: 'I see a cat.',
    learningObjectives: [
      'Notice and identify four familiar pictures.',
      'Listen to and say a familiar English word.',
      'Try the frame “I see a ___.” with a picture.',
    ],
    vocabulary: [['Apple', 'सेब'], ['Cat', 'बिल्ली'], ['Dog', 'कुत्ता'], ['Ball', 'गेंद']],
    reviewWords: [],
    lessons: [
      { title: 'Hello, Apple and Cat', subtitle: 'First listen, then try one word.', objectives: ['Recognise apple and cat.', 'Listen and repeat one familiar word.'], newWords: ['Apple', 'Cat'], modelSentence: 'Apple.', conversationQuestion: 'What do you see?', conversationModel: 'Apple.', homework: 'Say “apple” or “cat” to someone at home.' },
      { title: 'Dog and Ball', subtitle: 'Find two more pictures and try a short sentence.', objectives: ['Recognise dog and ball.', 'Say “I see a dog” or “I see a ball.”'], newWords: ['Dog', 'Ball'], modelSentence: 'I see a dog.', conversationQuestion: 'What do you see?', conversationModel: 'I see a ball.', homework: 'Say “I see a dog” when you see a dog picture or toy.' },
      { title: 'My Picture Garden Review', subtitle: 'Remember the pictures and tell Miss Julie what you see.', objectives: ['Recall the four unit words.', 'Use a word or the frame “I see a ___.”'], newWords: [], modelSentence: 'I see a cat.', conversationQuestion: 'Can you tell me one thing you see?', conversationModel: 'I see a cat.', homework: 'Choose one picture and say “I see a ___.”' },
    ],
    introStoryboard: ['Miss Julie welcomes the child with a calm wave.', 'Show one clear apple picture, then one cat, dog, and ball picture.', 'Miss Julie models “Apple” and “I see an apple.” with a patient pause.', 'Invite the child to point, listen, or say one word; finish with a warm smile.'],
  },
  {
    number: 2,
    term: 1,
    title: 'More Things Around Me',
    world: 'Discovery Room',
    description: 'Recognise everyday things and say a short sentence about them.',
    words: ['Banana', 'Car', 'Sun', 'Book'],
    sentence: 'This is a book.',
    question: 'What is this?',
    example: 'This is a book.',
    homework: 'This is a banana.',
    learningObjectives: ['Identify everyday pictures.', 'Use “This is a ___.” with a picture or object.', 'Recall familiar words from Unit 1.'],
    vocabulary: [['Banana', 'केला'], ['Car', 'गाड़ी'], ['Sun', 'सूरज'], ['Book', 'किताब'], ['Cup', 'कप'], ['Chair', 'कुर्सी']],
    reviewWords: ['Apple', 'Cat'],
    lessons: [
      { title: 'Banana and Car', subtitle: 'Listen for a familiar word, then find a new picture.', objectives: ['Recognise banana and car.', 'Recall apple or cat from Unit 1.'], newWords: ['Banana', 'Car'], modelSentence: 'Banana.', conversationQuestion: 'What do you see?', conversationModel: 'I see a car.', homework: 'Find a banana picture or fruit and say “banana.”' },
      { title: 'Sun and Book', subtitle: 'Name a picture and try “This is a ___.”', objectives: ['Recognise sun and book.', 'Say one short “This is a ___” sentence.'], newWords: ['Sun', 'Book'], modelSentence: 'This is a book.', conversationQuestion: 'What is this?', conversationModel: 'This is a book.', homework: 'Hold or point to a book and say “This is a book.”' },
      { title: 'Cup, Chair, and Review', subtitle: 'Meet two more things and revisit earlier words.', objectives: ['Recognise cup and chair.', 'Review words from Units 1 and 2.'], newWords: ['Cup', 'Chair'], modelSentence: 'This is a cup.', conversationQuestion: 'What can you see in the room?', conversationModel: 'I see a chair.', homework: 'Point to a cup or chair and say its name.' },
    ],
    introStoryboard: ['Miss Julie opens a bright discovery room.', 'Reveal a banana, car, sun, book, cup, and chair one at a time.', 'Connect a few pictures to Unit 1 with “Do you remember apple?”', 'Model “This is a book.” and leave a quiet turn for the child.'],
  },
  {
    number: 3,
    term: 1,
    title: 'My School Things',
    world: 'School Corner',
    description: 'Name familiar school things and say what you have or see.',
    words: ['Book', 'Pencil', 'Bag', 'Ruler'],
    sentence: 'This is my book.',
    question: 'What is in your bag?',
    example: 'I have a book.',
    homework: 'This is my bag.',
    learningObjectives: ['Identify common school objects.', 'Use “my” with a familiar object.', 'Answer with one word or a short “I have a ___” sentence.'],
    vocabulary: [['Book', 'किताब'], ['Pencil', 'पेंसिल'], ['Bag', 'बैग'], ['Ruler', 'स्केल'], ['Crayon', 'रंगीन पेंसिल'], ['Desk', 'मेज़']],
    reviewWords: ['Banana', 'Book'],
    lessons: [
      { title: 'Book and Pencil', subtitle: 'Look at school things and listen for their names.', objectives: ['Recognise book and pencil.', 'Recall one familiar object from Unit 2.'], newWords: ['Book', 'Pencil'], modelSentence: 'Book. Pencil.', conversationQuestion: 'What do you see?', conversationModel: 'A book.', homework: 'Point to a book or pencil and say its name.' },
      { title: 'My Bag and Ruler', subtitle: 'Say the name, then add “my.”', objectives: ['Recognise bag and ruler.', 'Try “my bag” or “my book.”'], newWords: ['Bag', 'Ruler'], modelSentence: 'This is my bag.', conversationQuestion: 'What is in your bag?', conversationModel: 'My book.', homework: 'Show or imagine your bag and say “my bag.”' },
      { title: 'Crayon, Desk, and Review', subtitle: 'Review our school words in a little talk.', objectives: ['Recognise crayon and desk.', 'Recall school things and earlier familiar words.'], newWords: ['Crayon', 'Desk'], modelSentence: 'I have a pencil.', conversationQuestion: 'What school thing do you have?', conversationModel: 'I have a pencil.', homework: 'Choose one school thing and say “I have a ___.”' },
    ],
    introStoryboard: ['Miss Julie waves beside a tidy school corner.', 'Show one school object at a time with space around it.', 'Model “book,” “pencil,” and “my bag”; briefly recall banana or book.', 'Pause after each model so a beginner can listen or try.'],
  },
  {
    number: 4,
    term: 1,
    title: 'Colors & Shapes',
    world: 'Color Meadow',
    description: 'Notice simple colors and shapes and describe one picture.',
    words: ['Red', 'Blue', 'Circle', 'Square'],
    sentence: 'It is red.',
    question: 'What color do you see?',
    example: 'I see a red circle.',
    homework: 'I see a red thing.',
    learningObjectives: ['Recognise four common colors and shapes.', 'Listen for color and shape words.', 'Use a short color or shape phrase.'],
    vocabulary: [['Red', 'लाल'], ['Blue', 'नीला'], ['Yellow', 'पीला'], ['Green', 'हरा'], ['Circle', 'गोला'], ['Square', 'चौकोर'], ['Star', 'तारा'], ['Triangle', 'त्रिकोण']],
    reviewWords: ['Book', 'Pencil'],
    lessons: [
      { title: 'Red, Blue, and Yellow', subtitle: 'Listen to a color word and find its bright picture.', objectives: ['Recognise red, blue, and yellow.', 'Recall a familiar school word.'], newWords: ['Red', 'Blue', 'Yellow'], modelSentence: 'Red. Blue.', conversationQuestion: 'What color do you see?', conversationModel: 'Red.', homework: 'Find one color around you and say its name.' },
      { title: 'Circle, Square, and Star', subtitle: 'Look at the shape and say its name.', objectives: ['Recognise circle, square, and star.', 'Join one color and shape word.'], newWords: ['Circle', 'Square', 'Star'], modelSentence: 'A red circle.', conversationQuestion: 'Which shape can you see?', conversationModel: 'A circle.', homework: 'Draw or imagine a circle and say “circle.”' },
      { title: 'Green Triangle Review', subtitle: 'Mix colors and shapes you have already learned.', objectives: ['Recognise green and triangle.', 'Recall colors, shapes, and earlier unit words.'], newWords: ['Green', 'Triangle'], modelSentence: 'I see a blue circle.', conversationQuestion: 'What color or shape do you see?', conversationModel: 'I see a star.', homework: 'Find or draw one shape and name its color.' },
    ],
    introStoryboard: ['Miss Julie greets the child in a bright, calm meadow.', 'Show large single-color shapes against a plain background.', 'Model “red,” “circle,” and “a red circle” with a short pause.', 'Invite one word or a short phrase; close with a gentle celebration.'],
  },
  {
    number: 5,
    term: 2,
    title: 'Animals & Actions',
    world: 'Animal Friends',
    description: 'Name familiar animals and connect them to simple actions.',
    words: ['Bird', 'Fish', 'Cat', 'Dog'],
    sentence: 'A bird can fly.',
    question: 'What can a bird do?',
    example: 'A bird can fly.',
    homework: 'A fish can swim.',
    learningObjectives: ['Identify familiar animals and actions.', 'Listen to action words.', 'Use “A ___ can ___.” with a familiar animal.'],
    vocabulary: [['Bird', 'चिड़िया'], ['Fish', 'मछली'], ['Cat', 'बिल्ली'], ['Dog', 'कुत्ता'], ['Run', 'दौड़ना'], ['Jump', 'कूदना'], ['Fly', 'उड़ना'], ['Swim', 'तैरना']],
    reviewWords: ['Red', 'Circle'],
    lessons: [
      { title: 'Bird and Fish', subtitle: 'Meet two animal friends and listen to their names.', objectives: ['Recognise bird and fish.', 'Recall a color or shape from Unit 4.'], newWords: ['Bird', 'Fish'], modelSentence: 'Bird. Fish.', conversationQuestion: 'What animal do you see?', conversationModel: 'A bird.', homework: 'Say “bird” or “fish” when you see a picture.' },
      { title: 'Run, Jump, and Fly', subtitle: 'Match an animal to an action.', objectives: ['Recognise run, jump, and fly.', 'Try “A bird can fly.”'], newWords: ['Run', 'Jump', 'Fly'], modelSentence: 'A bird can fly.', conversationQuestion: 'What can a bird do?', conversationModel: 'A bird can fly.', homework: 'Say “A bird can fly.” and move your hands like wings.' },
      { title: 'Cat, Dog, and Swim', subtitle: 'Review animals and actions with one short answer.', objectives: ['Recognise cat, dog, and swim.', 'Recall an animal, action, color, or shape.'], newWords: ['Cat', 'Dog', 'Swim'], modelSentence: 'A fish can swim.', conversationQuestion: 'What can a fish do?', conversationModel: 'A fish can swim.', homework: 'Say “A fish can swim” or name one animal you like.' },
    ],
    introStoryboard: ['Miss Julie welcomes the child to meet gentle animal friends.', 'Show one clear animal picture at a time, with no busy background.', 'Model “bird,” then “A bird can fly”; animate only the matching action.', 'Give a pause to listen, repeat, or answer with one word.'],
  },
  {
    number: 6,
    term: 2,
    title: 'Food I Like',
    world: 'Little Food Market',
    description: 'Name familiar foods and share a simple personal choice.',
    words: ['Apple', 'Banana', 'Mango', 'Rice'],
    sentence: 'I like mango.',
    question: 'What food do you like?',
    example: 'I like mango.',
    homework: 'I like rice.',
    learningObjectives: ['Identify familiar foods.', 'Use “I like ___.” to share a choice.', 'Respect that different people like different foods.'],
    vocabulary: [['Apple', 'सेब'], ['Banana', 'केला'], ['Mango', 'आम'], ['Rice', 'चावल'], ['Roti', 'रोटी'], ['Milk', 'दूध'], ['Water', 'पानी']],
    reviewWords: ['Bird', 'Fish'],
    lessons: [
      { title: 'Apple, Banana, Mango', subtitle: 'Look, listen, and name familiar fruit.', objectives: ['Recognise apple, banana, and mango.', 'Recall an animal word from Unit 5.'], newWords: ['Apple', 'Banana', 'Mango'], modelSentence: 'Mango.', conversationQuestion: 'What food do you see?', conversationModel: 'Mango.', homework: 'Name one fruit you know.' },
      { title: 'Rice, Roti, and Milk', subtitle: 'Find foods and try saying what you like.', objectives: ['Recognise rice, roti, and milk.', 'Try “I like ___.” with any food choice.'], newWords: ['Rice', 'Roti', 'Milk'], modelSentence: 'I like rice.', conversationQuestion: 'What food do you like?', conversationModel: 'I like rice.', homework: 'Say “I like ___” with a food you choose.' },
      { title: 'Water and Food Review', subtitle: 'Revisit favorite food words and listen once more.', objectives: ['Recognise water.', 'Review food, animal, and earlier words.'], newWords: ['Water'], modelSentence: 'I like mango.', conversationQuestion: 'Which food would you choose?', conversationModel: 'I like mango.', homework: 'Tell someone one food you like, using “I like ___.”' },
    ],
    introStoryboard: ['Miss Julie greets the child at a colorful, uncluttered food market.', 'Show familiar fruit and everyday foods separately, never implying every child eats the same food.', 'Model “mango” and “I like mango”; allow any food choice.', 'End with Miss Julie listening kindly to the child’s own answer.'],
  },
  {
    number: 7,
    term: 2,
    title: 'People Who Help Us',
    world: 'Helpful Neighbors',
    description: 'Recognise community helpers and say one way they help.',
    words: ['Teacher', 'Doctor', 'Farmer', 'Baker'],
    sentence: 'A teacher helps us.',
    question: 'Who helps us at school?',
    example: 'A teacher helps us.',
    homework: 'A teacher helps us.',
    learningObjectives: ['Name familiar people who help in a community.', 'Connect a helper with one simple action.', 'Answer with a word or short sentence.'],
    vocabulary: [['Teacher', 'शिक्षक'], ['Doctor', 'डॉक्टर'], ['Farmer', 'किसान'], ['Baker', 'बेकर'], ['Nurse', 'नर्स'], ['Police officer', 'पुलिस अधिकारी']],
    reviewWords: ['Mango', 'Rice'],
    lessons: [
      { title: 'Teacher and Doctor', subtitle: 'Notice two helpers and listen to their names.', objectives: ['Recognise teacher and doctor.', 'Recall a food word from Unit 6.'], newWords: ['Teacher', 'Doctor'], modelSentence: 'Teacher. Doctor.', conversationQuestion: 'Who helps us at school?', conversationModel: 'A teacher.', homework: 'Say “teacher” or “doctor” after talking about a helper with your family.' },
      { title: 'Farmer and Baker', subtitle: 'Meet more helpers and say a short helpful sentence.', objectives: ['Recognise farmer and baker.', 'Try “A ___ helps us.”'], newWords: ['Farmer', 'Baker'], modelSentence: 'A farmer helps us.', conversationQuestion: 'Who helps grow food?', conversationModel: 'A farmer helps us.', homework: 'Say one helper word and “helps us.”' },
      { title: 'Nurse, Police Officer, and Review', subtitle: 'Remember helpers and thank them with a kind sentence.', objectives: ['Recognise nurse and police officer.', 'Recall one helper and one earlier familiar word.'], newWords: ['Nurse', 'Police officer'], modelSentence: 'A doctor helps us.', conversationQuestion: 'Can you name one helper?', conversationModel: 'A doctor helps us.', homework: 'Choose one helper and say “A ___ helps us.”' },
    ],
    introStoryboard: ['Miss Julie welcomes the child to meet helpful community members.', 'Show respectful, friendly portraits of a teacher, doctor, farmer, baker, nurse, and police officer.', 'Model each role name and one short “helps us” phrase.', 'Invite the child to answer with one role name; avoid stereotypes or uniforms tied to a specific school.'],
  },
  {
    number: 8,
    term: 2,
    title: 'My Day & Review',
    world: 'Daytime Path',
    description: 'Name familiar daily actions, put two in order, and review the pilot words.',
    words: ['Wake up', 'Wash', 'Eat', 'Play'],
    sentence: 'I wake up. Then I eat.',
    question: 'What do you do first?',
    example: 'I wake up.',
    homework: 'I play.',
    learningObjectives: ['Recognise common daily actions.', 'Use “I ___.” with an action.', 'Try “First I ___. Then I ___.” and revisit earlier vocabulary.'],
    vocabulary: [['Wake up', 'उठना'], ['Wash', 'धोना'], ['Eat', 'खाना'], ['Play', 'खेलना'], ['Read', 'पढ़ना'], ['Sleep', 'सोना']],
    reviewWords: ['Teacher', 'Doctor'],
    lessons: [
      { title: 'Wake Up and Wash', subtitle: 'Listen to two daily action words and try one.', objectives: ['Recognise wake up and wash.', 'Recall a helper word from Unit 7.'], newWords: ['Wake up', 'Wash'], modelSentence: 'Wake up. Wash.', conversationQuestion: 'What do you do first?', conversationModel: 'I wake up.', homework: 'Say “I wake up” or “I wash.”' },
      { title: 'Eat, Play, and Read', subtitle: 'Say one thing you do during your day.', objectives: ['Recognise eat, play, and read.', 'Use “I ___.” with one action.'], newWords: ['Eat', 'Play', 'Read'], modelSentence: 'I eat. I play.', conversationQuestion: 'What do you like to do?', conversationModel: 'I play.', homework: 'Choose an action and say “I ___.”' },
      { title: 'Sleep and My Day Review', subtitle: 'Put two actions in order and celebrate all the words you know.', objectives: ['Recognise sleep.', 'Try “First I ___. Then I ___.”', 'Review words from all eight units.'], newWords: ['Sleep'], modelSentence: 'First I wake up. Then I eat.', conversationQuestion: 'What do you do first?', conversationModel: 'First I wake up. Then I eat.', homework: 'Tell someone two things you do: “First I ___. Then I ___.”' },
    ],
    introStoryboard: ['Miss Julie welcomes the child to a peaceful day path.', 'Show everyday action pictures one at a time with no assumptions about a child’s schedule.', 'Model “I wake up” and “First I wake up. Then I eat.”', 'Finish with a gentle celebration and a quick revisit of pictures from earlier units.'],
  },
]

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function slug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function activity(
  unit: UnitDraft,
  lessonOrder: number,
  order: number,
  lessonWords: string[],
  details: ActivityDetails,
): KGActivityPlan {
  const keywords = unique(lessonWords.map((word) => word.toLowerCase()))
  const metadata = {
    pilotStatus: 'PILOT_UNAPPROVED',
    schoolSyllabusApproved: false,
    julieProfile: MISS_JULIE_GUIDANCE,
    encouragement: 'Thank the child for trying. Keep praise specific, calm, and varied.',
    gentleCorrection: 'If there is a clear English error, offer one short model without requiring a retry.',
    ...(details.metadata || {}),
  }
  const {
    metadata: _metadata,
    allowMic: _allowMic,
    allowOptions: _allowOptions,
    conversationGoal: _conversationGoal,
    ...activityDetails
  } = details
  return {
    activityKey: `kg-g0-u${unit.number}-l${lessonOrder}-a${order}`,
    curriculumVersion: CURRICULUM_VERSION,
    grade: 0,
    term: unit.term,
    unitNumber: unit.number,
    ...activityDetails,
    core: true,
    required: true,
    order,
    expectedPatterns: details.modelSentence ? [details.modelSentence] : details.answer ? [details.answer] : [],
    keywords,
    xp: order === 7 ? 4 : order === 5 ? 8 : 6,
    voiceEnabled: details.allowMic ?? true,
    aiEnabled: details.type === 'OPEN_CONVERSATION',
    allowMic: details.allowMic ?? true,
    allowOptions: details.allowOptions ?? details.type === 'PICTURE_CHOICE',
    repeatRequired: false,
    maxConversationTurns: details.type === 'OPEN_CONVERSATION' ? 2 : 1,
    ...(details.conversationGoal ? { conversationGoal: details.conversationGoal } : {}),
    source: { sourceType: 'ENRICHMENT', label: PILOT_LABEL },
    metadata,
    status: 'draft',
  }
}

function pictureChoices(
  unit: UnitDraft,
  lessonOrder: number,
  activityOrder: number,
  word: string,
  knownWords: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  stage: 'WARM_UP' | 'PRACTICE_ZONE',
  promptTitle: string,
): KGActivityPlan {
  const choiceCount = lessonOrder === 1 ? 2 : 3
  const choices = unique([word, ...knownWords.filter((candidate) => candidate !== word)]).slice(0, choiceCount)
  const assetKey = pictureAssetKeyForWord(unit, word)
  const pictureOptions = choices.map((choice) => {
    return { word: choice, assetKey: pictureAssetKeyForWord(unit, choice), status: 'MISSING' as const }
  })
  const hindiHint = stage === 'WARM_UP' ? 'सुनो और सही तस्वीर चुनो।' : 'पहचानी हुई तस्वीर फिर से ढूँढो।'
  return activity(unit, lessonOrder, activityOrder, knownWords, {
    type: 'PICTURE_CHOICE',
    stage,
    title: promptTitle,
    prompt: `Listen, then find the ${word.toLowerCase()} picture.`,
    instruction: 'You can say the word or tap a picture. Listening first is okay.',
    target: word,
    choices,
    answer: word,
    hint: `${word} means ${unit.vocabulary.find((item) => item[0] === word)?.[1] || 'this word'}.`,
    difficulty,
    estimatedSeconds: 20,
    allowMic: true,
    allowOptions: true,
    content: {
      pictureMode: true,
      pictureWord: word,
      pictureAsset: { assetKey, status: 'MISSING' },
      pictureOptions,
      languageHint: hindiHint,
    },
    metadata: {
      visualAsset: { assetKey, status: 'MISSING' },
      feedback: {
        correct: `You found ${word.toLowerCase()}! Let’s say it together.`,
        retry: `Nice try. Listen for ${word.toLowerCase()}, then choose again.`,
      },
    },
  })
}

function pictureAssetKeyForWord(unit: UnitDraft, word: string): string {
  const owner = unit.vocabulary.some(([known]) => known === word)
    ? unit
    : unitDrafts.slice(0, unit.number - 1).reverse().find((candidate) => candidate.vocabulary.some(([known]) => known === word))
  return `kg-g0-u${owner?.number ?? unit.number}-${slug(word)}`
}

function buildLesson(unit: UnitDraft, draft: LessonDraft, lessonOrder: number, knownBefore: string[]): KGCurriculumUnit['lessons'][number] {
  const difficulty = lessonOrder === 1 ? 'easy' : lessonOrder === 2 ? 'easy' : 'medium'
  const reviewWords = unique([...unit.reviewWords, ...knownBefore, ...draft.newWords]).slice(0, 6)
  const newWords = [...draft.newWords]
  const activityWords = newWords.length ? newWords : unique([...knownBefore, ...unit.words]).slice(0, 4)
  const knownWords = unique([...unit.reviewWords, ...knownBefore, ...activityWords])
  const firstPicture = activityWords[0] || unit.words[0]
  const secondPicture = activityWords.find((word) => word !== firstPicture) || unit.words.find((word) => word !== firstPicture) || firstPicture
  const reviewWord = reviewWords.find((word) => word !== firstPicture) || reviewWords[0] || firstPicture
  const lastWord = activityWords[activityWords.length - 1] || firstPicture
  const pictureActivities = [
    pictureChoices(unit, lessonOrder, 1, firstPicture, knownWords, difficulty, 'WARM_UP', 'Listen and find'),
    pictureChoices(unit, lessonOrder, 2, secondPicture, knownWords, difficulty, 'PRACTICE_ZONE', 'Look again'),
  ]
  const listenAndRepeat = activity(unit, lessonOrder, 3, knownWords, {
    type: 'SPEAK_PROMPT',
    stage: 'LISTEN_REPEAT',
    title: 'Listen to Miss Julie',
    prompt: `Listen to Miss Julie, then say: “${draft.modelSentence}”`,
    instruction: 'You can listen again. One word is a lovely first try.',
    target: draft.modelSentence,
    modelSentence: draft.modelSentence,
    difficulty,
    estimatedSeconds: 25,
    allowMic: true,
    allowOptions: false,
    content: { languageHint: 'सुनो, फिर बोलने की कोशिश करो।', speechAudio: { delivery: 'RUNTIME_TTS', prerecordedStatus: 'NOT_CREATED' } },
    metadata: { audioDelivery: 'RUNTIME_TTS', responseExpectations: 'Accept a single target word for a beginner; celebrate an understandable attempt.' },
  })
  const promptedSpeak = activity(unit, lessonOrder, 4, knownWords, {
    type: 'SPEAK_PROMPT',
    stage: 'SPEAK',
    title: 'Your turn to speak',
    prompt: `Your turn! Say “${draft.modelSentence}” or try one of the words you know.`,
    instruction: 'Miss Julie will listen. You may say just one word.',
    target: draft.modelSentence,
    modelSentence: draft.modelSentence,
    difficulty,
    estimatedSeconds: 30,
    allowMic: true,
    allowOptions: false,
    metadata: { audioDelivery: 'RUNTIME_TTS', responseExpectations: 'A word, short phrase, or the model sentence is a successful beginner response.' },
  })
  const conversation = activity(unit, lessonOrder, 5, knownWords, {
    type: 'OPEN_CONVERSATION',
    stage: 'INTERACT',
    title: 'Talk with Miss Julie',
    prompt: draft.conversationQuestion,
    teacherPrompt: draft.conversationQuestion,
    target: draft.conversationQuestion,
    modelSentence: draft.conversationModel,
    difficulty,
    estimatedSeconds: 45,
    allowMic: true,
    allowOptions: true,
    conversationGoal: { requiredConcepts: [], minTurns: 1, maxTurns: 2 },
    metadata: {
      conversationMode: 'OPEN',
      maxTurns: 2,
      audioDelivery: 'RUNTIME_TTS',
      julieProfile: {
        ...MISS_JULIE_GUIDANCE,
        optionalModelAnswer: draft.conversationModel,
      },
      allowedVocabulary: unique([...activityWords, ...reviewWords]),
      reviewWords,
      responseExpectations: 'Accept a single familiar English word, a short phrase, or a complete model sentence.',
      gentleCorrectionExample: `“Good try! We can say: ${draft.conversationModel}”`,
    },
  })
  const review = pictureChoices(unit, lessonOrder, 6, reviewWord, knownWords, difficulty, 'PRACTICE_ZONE', 'Remember and find')
  review.metadata = {
    ...review.metadata,
    reviewActivity: true,
    reviewWords,
    feedback: {
      correct: `You remembered ${reviewWord.toLowerCase()}! Lovely looking.`,
      retry: `Good trying. Let’s listen for ${reviewWord.toLowerCase()} one more time.`,
    },
  }
  const homework = activity(unit, lessonOrder, 7, knownWords, {
    type: 'SPEAK_PROMPT',
    stage: 'HOME_PRACTICE',
    title: 'A little speaking at home',
    prompt: `When you have time, say: “${draft.homework}”`,
    instruction: 'This is just for speaking practice. No recording or adult submission is needed.',
    target: draft.homework,
    modelSentence: draft.homework,
    difficulty,
    estimatedSeconds: 20,
    allowMic: true,
    allowOptions: false,
    content: { isHomework: true, parentSubmissionRequired: false, uploadRequired: false, speechAudio: { delivery: 'RUNTIME_TTS', prerecordedStatus: 'NOT_CREATED' } },
    metadata: { homePractice: { offlineFriendly: true, recordingRequired: false, adultSubmissionRequired: false } },
  })

  return {
    lessonKey: `kg-g0-u${unit.number}-l${lessonOrder}`,
    status: 'draft',
    title: draft.title,
    subtitle: draft.subtitle,
    order: lessonOrder,
    difficulty,
    estimatedMinutes: 4,
    teacherIntroduction: `Hello! Let’s explore ${unit.title}. You can listen first or try one word with Miss Julie.`,
    learningObjectives: draft.objectives,
    newWords,
    reviewWords,
    modelSentence: draft.modelSentence,
    conversationQuestion: draft.conversationQuestion,
    conversationModel: draft.conversationModel,
    homework: draft.homework,
    activities: [...pictureActivities, listenAndRepeat, promptedSpeak, conversation, review, homework],
    settings: {
      foundation: true,
      languageSupport: 'hi-en',
      pilotStatus: 'PILOT_UNAPPROVED',
      schoolSyllabusApproved: false,
      visualAssetStatus: 'MISSING',
      introVideoStatus: 'NOT_CREATED',
      learningObjectives: draft.objectives,
    },
  }
}

function buildUnit(draft: UnitDraft): KGCurriculumUnit {
  const vocabulary: KGVocabularyWord[] = draft.vocabulary.map(([word, hindi]) => ({
    word,
    hindi,
    assetKey: `kg-g0-u${draft.number}-${slug(word)}`,
    audio: { delivery: 'RUNTIME_TTS', prerecordedStatus: 'NOT_CREATED' },
  }))
  const builtLessons: KGCurriculumUnit['lessons'] = []
  let previouslyLearned: string[] = []
  for (const [index, lessonDraft] of draft.lessons.entries()) {
    builtLessons.push(buildLesson(draft, lessonDraft, index + 1, previouslyLearned))
    previouslyLearned = unique([...previouslyLearned, ...lessonDraft.newWords])
  }

  return {
    grade: 0,
    term: draft.term,
    unitNumber: draft.number,
    curriculumVersion: CURRICULUM_VERSION,
    pilotStatus: 'PILOT_UNAPPROVED',
    schoolSyllabusApproved: false,
    publication: { availability: 'UPCOMING', status: 'draft' },
    title: draft.title,
    world: draft.world,
    description: draft.description,
    words: draft.words,
    sentence: draft.sentence,
    question: draft.question,
    example: draft.example,
    homework: draft.homework,
    learningObjectives: draft.learningObjectives,
    vocabulary,
    reviewWords: draft.reviewWords,
    lessons: builtLessons,
    visualAssets: vocabulary.map((item) => ({
      assetKey: item.assetKey,
      kind: 'PICTURE_ILLUSTRATION',
      altText: `Child-friendly picture of ${item.word.toLowerCase()}`,
      status: 'MISSING',
    })),
    introVideo: {
      status: 'NOT_CREATED',
      plannedDurationSeconds: 20,
      approvedCharacter: 'MISS_JULIE_NEUTRAL',
      characterReference: 'talkora-client/public/miss-julie/miss-julie-character-sheet.png',
      storyboard: draft.introStoryboard,
    },
  }
}

/** Complete, source-only Grade 0 pilot. Nothing here connects to or writes to a database. */
export const lessons: KGCurriculumUnit[] = unitDrafts.map(buildUnit)

export interface KGCurriculumValidation {
  valid: boolean
  unitCount: number
  lessonCount: number
  activityCount: number
  errors: string[]
}

/** Pure validation used by tests and review tools; no model or database imports at runtime. */
export function validateKGCurriculum(units: readonly KGCurriculumUnit[] = lessons): KGCurriculumValidation {
  const errors: string[] = []
  const expectedTitles = [
    'Look, Touch & Say', 'More Things Around Me', 'My School Things', 'Colors & Shapes',
    'Animals & Actions', 'Food I Like', 'People Who Help Us', 'My Day & Review',
  ]
  if (units.length !== expectedTitles.length) errors.push(`Expected 8 units; received ${units.length}.`)
  const lessonKeys = new Set<string>()
  const activityKeys = new Set<string>()
  let lessonCount = 0
  let activityCount = 0

  for (const [unitIndex, unit] of units.entries()) {
    if (unit.title !== expectedTitles[unitIndex]) errors.push(`Unit ${unitIndex + 1} has an unexpected title.`)
    if (unit.grade !== 0 || unit.pilotStatus !== 'PILOT_UNAPPROVED' || unit.schoolSyllabusApproved) {
      errors.push(`${unit.title} must remain a Grade 0 unapproved pilot.`)
    }
    if (unit.publication.availability !== 'UPCOMING' || unit.publication.status !== 'draft') {
      errors.push(`${unit.title} must remain unavailable for publication.`)
    }
    if (unit.lessons.length !== 3) errors.push(`${unit.title} must contain the three progressive pilot lessons.`)
    if (unit.learningObjectives.length === 0 || unit.vocabulary.length < 4) errors.push(`${unit.title} is missing objectives or vocabulary.`)
    if (unit.introVideo.status !== 'NOT_CREATED') errors.push(`${unit.title} must not claim to have a video.`)
    if (unit.visualAssets.some((asset) => asset.status !== 'MISSING' || 'url' in asset)) {
      errors.push(`${unit.title} contains a visual asset that is not explicitly missing.`)
    }
    const taughtWords = new Set(unit.lessons.flatMap((lesson) => lesson.newWords))
    for (const item of unit.vocabulary) {
      if (!taughtWords.has(item.word)) errors.push(`${unit.title} never introduces ${item.word}.`)
      if (item.audio.delivery !== 'RUNTIME_TTS' || item.audio.prerecordedStatus !== 'NOT_CREATED') {
        errors.push(`${unit.title} misstates the audio availability for ${item.word}.`)
      }
    }

    for (const lesson of unit.lessons) {
      lessonCount += 1
      if (lessonKeys.has(lesson.lessonKey)) errors.push(`Duplicate lesson key: ${lesson.lessonKey}.`)
      lessonKeys.add(lesson.lessonKey)
      const types = lesson.activities.map((item) => `${item.type}:${item.stage}`)
      if (lesson.status !== 'draft' || lesson.learningObjectives.length === 0 || lesson.activities.length !== 7) {
        errors.push(`${lesson.lessonKey} is incomplete or not a draft.`)
      }
      if (!types.some((value) => value === 'PICTURE_CHOICE:WARM_UP') || !types.some((value) => value === 'PICTURE_CHOICE:PRACTICE_ZONE')) {
        errors.push(`${lesson.lessonKey} needs picture identification and choice activities.`)
      }
      if (!types.includes('SPEAK_PROMPT:LISTEN_REPEAT')) errors.push(`${lesson.lessonKey} needs a listen-and-repeat activity.`)
      if (!types.includes('OPEN_CONVERSATION:INTERACT')) errors.push(`${lesson.lessonKey} needs a Miss Julie conversation.`)
      if (!types.includes('SPEAK_PROMPT:HOME_PRACTICE')) errors.push(`${lesson.lessonKey} needs spoken homework.`)
      if (!lesson.reviewWords.length || !lesson.activities.some((item) => item.metadata.reviewActivity === true)) {
        errors.push(`${lesson.lessonKey} needs a review activity using learned words.`)
      }
      if (lesson.settings.pilotStatus !== 'PILOT_UNAPPROVED' || lesson.settings.schoolSyllabusApproved) {
        errors.push(`${lesson.lessonKey} must remain an unapproved pilot.`)
      }

      for (const item of lesson.activities) {
        activityCount += 1
        if (activityKeys.has(item.activityKey)) errors.push(`Duplicate activity key: ${item.activityKey}.`)
        activityKeys.add(item.activityKey)
        if (item.status !== 'draft' || item.metadata.pilotStatus !== 'PILOT_UNAPPROVED' || item.metadata.schoolSyllabusApproved) {
          errors.push(`${item.activityKey} must remain a draft pilot activity.`)
        }
        const serialized = JSON.stringify(item)
        if (/https?:\/\//i.test(serialized)) errors.push(`${item.activityKey} contains an unverified URL.`)
        if (item.type === 'PICTURE_CHOICE' && item.content?.pictureAsset &&
          (item.content.pictureAsset as { status?: string }).status !== 'MISSING') {
          errors.push(`${item.activityKey} has a picture asset that is not marked missing.`)
        }
        if (item.type === 'OPEN_CONVERSATION' &&
          (!item.teacherPrompt || typeof item.metadata.gentleCorrectionExample !== 'string' ||
            !Array.isArray(item.metadata.allowedVocabulary))) {
          errors.push(`${item.activityKey} is missing child-safe Miss Julie conversation guidance.`)
        }
      }
    }
  }

  return { valid: errors.length === 0, unitCount: units.length, lessonCount, activityCount, errors }
}
