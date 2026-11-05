/**
 * One server-owned multilingual coaching contract for KG 1–10.
 *
 * Live KG1 and KG2–5 pilots can call this without changing their existing
 * authoritative graders, signed audio receipts or Mongo progress cursors.
 * Level 2 teaches LETTERS E–J (no approved word/picture pairing exists yet).
 * Levels 6–10 are editorial word inventories, never student unlocks.
 */
import { LEVEL3_WORDS } from '../kg/level3-content'
import { LEVEL4_WORDS } from '../kg/level4-content'
import { continuationLesson } from '../kg/student-continuation-catalog'
import { env } from '../config/env'

export type KGTeachingLocale = 'en-IN' | 'hi-IN' | 'mr-IN'
export type KGTurnKind = 'correct_english' | 'correct_letter' | 'translation_hi_mr' |
  'wrong_word' | 'silence_or_noise' | 'question_or_offtopic'
export type KGTeacherOutcome = 'correct' | 'incorrect' | 'unclear' | 'supported'

type Translation = { display: string; variants: readonly string[] }
type WordBridge = { hi?: Translation; mr?: Translation }
export type KGTeachingWord = {
  level: number
  letter?: string
  targetEn: string
  hindi: readonly string[]
  marathi: readonly string[]
  approvedForStudent: boolean
}

/** Editorial lexicon only: a teacher must approve variants and media before rollout. */
const WORDS: Record<string, WordBridge> = {
  apple: { hi: { display: 'सेब', variants: ['seb', 'seib', 'सेब'] }, mr: { display: 'सफरचंद', variants: ['safarchand', 'सफरचंद'] } },
  ball: { hi: { display: 'गेंद', variants: ['gend', 'genda', 'गेंद'] }, mr: { display: 'चेंडू', variants: ['chendu', 'चेंडू'] } },
  cat: { hi: { display: 'बिल्ली', variants: ['billi', 'billy', 'बिल्ली'] }, mr: { display: 'मांजर', variants: ['manjar', 'maanjar', 'मांजर'] } },
  dog: { hi: { display: 'कुत्ता', variants: ['kutta', 'kuta', 'कुत्ता'] }, mr: { display: 'कुत्रा', variants: ['kutra', 'kutraa', 'कुत्रा'] } },
  kite: { hi: { display: 'पतंग', variants: ['patang', 'पतंग'] }, mr: { display: 'पतंग', variants: ['patang', 'पतंग'] } },
  lion: { hi: { display: 'शेर', variants: ['sher', 'शेर'] }, mr: { display: 'सिंह', variants: ['sinh', 'सिंह'] } },
  monkey: { hi: { display: 'बंदर', variants: ['bandar', 'बंदर'] }, mr: { display: 'माकड', variants: ['makad', 'माकड'] } },
  nest: { hi: { display: 'घोंसला', variants: ['ghonsla', 'घोंसला'] }, mr: { display: 'घरटे', variants: ['gharate', 'घरटे'] } },
  orange: { hi: { display: 'संतरा', variants: ['santra', 'संतरा'] }, mr: { display: 'संत्रे', variants: ['santre', 'संत्रे'] } },
  parrot: { hi: { display: 'तोता', variants: ['tota', 'तोता'] }, mr: { display: 'पोपट', variants: ['popat', 'पोपट'] } },
  queen: { hi: { display: 'रानी', variants: ['rani', 'रानी'] }, mr: { display: 'राणी', variants: ['rani', 'राणी'] } },
  rabbit: { hi: { display: 'खरगोश', variants: ['khargosh', 'khargoshh', 'खरगोश'] }, mr: { display: 'ससा', variants: ['sasa', 'ससा'] } },
  sun: { hi: { display: 'सूरज', variants: ['suraj', 'sooraj', 'सूरज'] }, mr: { display: 'सूर्य', variants: ['surya', 'सूर्य'] } },
  tiger: { hi: { display: 'बाघ', variants: ['bagh', 'baagh', 'बाघ'] }, mr: { display: 'वाघ', variants: ['wagh', 'वाघ'] } },
  umbrella: { hi: { display: 'छाता', variants: ['chhata', 'chata', 'छाता'] }, mr: { display: 'छत्री', variants: ['chatri', 'chhatri', 'छत्री'] } },
  van: { hi: { display: 'वैन', variants: ['van', 'वैन'] }, mr: { display: 'व्हॅन', variants: ['vhan', 'व्हॅन'] } },
  wolf: { hi: { display: 'भेड़िया', variants: ['bhediya', 'भेड़िया'] }, mr: { display: 'लांडगा', variants: ['landga', 'लांडगा'] } },
  xylophone: {},
  yak: {},
  zebra: {},
}

/** No guessed E–J picture words: currently KG2 is a letter-name pilot. */
const LIVE_WORDS: Record<number, Record<string, string>> = {
  1: { A: 'apple', B: 'ball', C: 'cat', D: 'dog' },
  3: LEVEL3_WORDS,
  4: LEVEL4_WORDS,
  5: continuationLesson(5).words,
}

/** Mirrors existing unpublished KG6–10 staff draft targets only. */
export const KG_UNPUBLISHED_WORD_DRAFTS: Readonly<Record<number, readonly string[]>> = {
  6: ['family', 'parent', 'baby', 'grandparent'],
  7: ['book', 'pencil', 'bag', 'chair', 'desk', 'board'],
  8: ['happy', 'sad', 'hello', 'goodbye', 'please', 'thank you'],
  9: ['big', 'small', 'up', 'down', 'left', 'right'],
  10: ['cat', 'ball', 'book', 'sun'],
}

export function kgTeachingWord(level: number, letter: string): KGTeachingWord | null {
  const word = LIVE_WORDS[level]?.[letter.toUpperCase()]
  if (!word) return null
  const translations = WORDS[word] || {}
  return {
    level, letter: letter.toUpperCase(), targetEn: word,
    hindi: translations.hi?.variants || [],
    marathi: translations.mr?.variants || [],
    approvedForStudent: level <= 5,
  }
}

export function kgDraftTeachingWord(level: number, targetEn: string): KGTeachingWord | null {
  if (!KG_UNPUBLISHED_WORD_DRAFTS[level]?.includes(targetEn)) return null
  const translations = WORDS[targetEn] || {}
  return {
    level, targetEn, hindi: translations.hi?.variants || [],
    marathi: translations.mr?.variants || [],
    approvedForStudent: false,
  }
}

const REJECTED = /\b(no|not|never|dont|don't|isn't|wrong)\b|नहीं|नाही/i
const QUESTION = /[?？]|\b(what|why|how|who|where|meaning|mean|explain|tell|matlab|kya|kaise|kay|kaay|samjha|samjhao|help)\b|क्या|क्यों|कैसे|मतलब|काय|कसे|समज|समझ/i
const NOISE = /^(?:uh+|um+|hmm+|hm+|ah+|erm+|\.\.\.)$/i
const SUPPORT_REQUEST = /\b(please repeat|once again|one more time|i don't understand|i dont understand|i want|i need|can you|mujhe|mala|samajh nahi|samjat nahi|help me)\b|मुझे समझ|मला समज|समजत नाही|समझ नहीं/i
const PRIVATE_SPEECH = /\b(phone|mobile number|password|address|roll number|my name is|i live at|my school is|number is)\b|\b\d{3,}\b|@/i
const FILLER = new Set(['ye', 'yeh', 'ye', 'hai', 'he', 'ha', 'h', 'to', 'isko', 'ise', 'usko',
  'ka', 'ki', 'ko', 'a', 'the', 'is', 'it', 'this', 'that', 'i', 'said', 'say', 'bol', 'bolo',
  'अरे', 'ये', 'यह', 'है', 'को', 'इसको', 'इसे', 'का', 'की', 'तो', 'हा', 'आहे', 'हे'])

function tokens(raw: string): string[] {
  return (raw.slice(0, 240).normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}]+/gu) || [])
}

function localeOfWord(text: string, word: KGTeachingWord): KGTeachingLocale | undefined {
  if (REJECTED.test(text) || QUESTION.test(text)) return undefined
  const terms = tokens(text)
  if (!terms.length || terms.length > 8) return undefined
  // Exact vocabulary variants only. No unsafe edit-distance pass on short words.
  const matches = (variants: readonly string[]) => terms.some((term) => variants.includes(term)) &&
    terms.every((term) => variants.includes(term) || FILLER.has(term))
  if (matches(word.marathi)) return 'mr-IN'
  if (matches(word.hindi)) return 'hi-IN'
  return undefined
}

export type KGTeachingClassification = { kind: KGTurnKind; language: KGTeachingLocale; word: KGTeachingWord | null }
export function classifyKGTeachingTurn(input: {
  level: number; letter: string; transcript?: string; outcome: KGTeacherOutcome
  detectedLanguage?: KGTeachingLocale; noSpeech?: boolean; uncertain?: boolean
}): KGTeachingClassification {
  const word = kgTeachingWord(input.level, input.letter)
  const text = (input.transcript || '').trim()
  const detected = input.detectedLanguage || 'en-IN'
  if (input.noSpeech || input.uncertain || !text || NOISE.test(text))
    return { kind: 'silence_or_noise', language: detected, word }
  if (input.outcome === 'correct')
    return { kind: input.level === 1 ? 'correct_english' : 'correct_letter', language: detected, word }
  const translation = word ? localeOfWord(text, word) : undefined
  if (translation) return { kind: 'translation_hi_mr', language: translation, word }
  if (QUESTION.test(text) || SUPPORT_REQUEST.test(text) || tokens(text).length >= 4)
    return { kind: 'question_or_offtopic', language: detected, word }
  if (word && tokens(text).includes(word.targetEn.toLowerCase()))
    return { kind: 'correct_english', language: detected, word }
  return { kind: 'wrong_word', language: detected, word }
}

function fallbackText(input: KGTeachingClassification, letter: string): string {
  const { kind, language, word } = input
  const target = word?.targetEn
  // KG1 teaches an English PICTURE WORD; KG2–5 teach letter names.
  const letterModel = word?.level === 1 && target
    ? 'Say ' + target + '.' : 'Say ' + letter.toUpperCase() + '.'
  const englishModel = target ? ' Say ' + target + '. ' : ' '
  if (kind === 'correct_letter' || (kind === 'correct_english' && input.word?.level === 1)) {
    return language === 'hi-IN' ? 'शाबाश! बहुत अच्छा!' :
      language === 'mr-IN' ? 'छान! शाब्बास!' : 'Wonderful! You said it!'
  }
  if (kind === 'translation_hi_mr' && target) {
    const translation = WORDS[target]?.[language === 'hi-IN' ? 'hi' : 'mr']?.display || ''
    const intro = language === 'hi-IN'
      ? translation + ', अच्छा बेटा! अंग्रेज़ी में इसे ' + target + ' कहते हैं। '
      : translation + ', छान बाळा! इंग्रजीत याला ' + target + ' म्हणतात। '
    // Always teach and ask for the translated English WORD first. Higher KG
    // letter exercises then separately require their original letter target.
    return intro + 'Say ' + target + '.'
  }
  if (kind === 'correct_english' && target) {
    return 'Great! ' + target + ' is an English word. Now say the letter ' + letter.toUpperCase() + '.'
  }
  if (language === 'hi-IN') {
    if (kind === 'silence_or_noise') return 'मैं सुन रही हूँ। आराम से बोलो। ' + letterModel
    if (kind === 'question_or_offtopic') return 'अच्छा सवाल! हम अभी अक्षर ' + letter.toUpperCase() + ' सीख रहे हैं। ' + letterModel
    return 'अच्छी कोशिश! मेरी बात सुनो। ' + letterModel
  }
  if (language === 'mr-IN') {
    if (kind === 'silence_or_noise') return 'मी ऐकते आहे। हळू बोल। ' + letterModel
    if (kind === 'question_or_offtopic') return 'छान प्रश्न! आपण आता अक्षर ' + letter.toUpperCase() + ' शिकतोय। ' + letterModel
    return 'छान प्रयत्न! माझ्यासोबत म्हण। ' + letterModel
  }
  if (kind === 'silence_or_noise') return 'I am listening! Take your time. ' + letterModel
  if (kind === 'question_or_offtopic') return 'Good question! Let us learn this letter first. ' + letterModel
  return 'Good try! Listen once more. ' + letterModel
}

/** Untrusted model may only supply lesson-bounded wording, never progress/mastery. */
async function boundedQuestion(input: KGTeachingClassification, letter: string, spoken: string): Promise<string | null> {
  // Never forward likely identifying details to the AI bridge; stay with a
  // short fixed teacher reply and invite a safe return to the lesson.
  if (PRIVATE_SPEECH.test(spoken)) return null
  const key = env.talkoraServiceKey.trim()
  if (env.isProd && key.length < 32) return null
  const word = input.word?.targetEn
  const endpoint = (process.env.TALKORA_KG1_AI_URL || 'http://127.0.0.1:8002').replace(/\/$/, '') + '/v1/brain/respond'
  const lessonTarget = input.word?.level === 1 && word
    ? 'the English word ' + word : 'the letter ' + letter
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { 'X-Talkora-Service-Key': key } : {}) },
      signal: AbortSignal.timeout(1800),
      body: JSON.stringify({
        grade: 0, levelId: 'g00-l' + String(input.word?.level || 2).padStart(2, '0'),
        studentName: 'Learner', activityTitle: 'Letter ' + letter,
        currentQuestion: 'Say ' + lessonTarget, allowedVocabulary: [letter, ...(word ? [word] : [])],
        learningObjectives: ['Briefly answer the question, then model ' + lessonTarget],
        preferredExplanationLanguage: input.language === 'hi-IN' ? 'Hindi' :
          input.language === 'mr-IN' ? 'Marathi' : 'English',
        recentMistakes: [], conversationHistory: [], waitingForRetry: true,
        hintLevel: 1, studentMessage: spoken.slice(0, 160),
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { message?: unknown; followUpQuestion?: unknown }
    const reply = [data.message, data.followUpQuestion].filter((v) => typeof v === 'string')
      .join(' ').replace(/\s+/g, ' ').trim()
    if (reply.length < 12 || reply.length > 180 || /[<>\[\]{}]|https?:|www\.|password|phone|address|secret/i.test(reply)) return null
    if (/\b(perfect|correct answer|you got it|exactly right)\b/i.test(reply)) return null
    // In KG1 insist on an English word model; a bare letter is not the goal.
    const required = input.word?.level === 1 && word ? word : letter
    if (!new RegExp('\\b' + required + '\\b', 'i').test(reply)) return null
    if (input.language !== 'en-IN' && !/[\u0900-\u097f]/.test(reply)) return null
    return reply
  } catch { return null }
}

/** Shared response builder; returns the unchanged authoritative assessment verdict. */
export async function composeKGTeachingTurn(input: {
  level: number; letter: string; transcript?: string; outcome: KGTeacherOutcome
  detectedLanguage?: KGTeachingLocale; noSpeech?: boolean; uncertain?: boolean
  existingFeedbackText?: string
}): Promise<{ kind: KGTurnKind; feedbackText: string; languageCode: KGTeachingLocale; source: 'guided' | 'qwen-8002' }> {
  const turn = classifyKGTeachingTurn(input)
  const reply = turn.kind === 'question_or_offtopic'
    ? await boundedQuestion(turn, input.letter, input.transcript || '')
    : null
  // Keep the original, already-shipped English coaching lines unchanged for
  // ordinary grades. Only the multilingual or contextual cases get new wording.
  const keepLegacy = turn.language === 'en-IN' && input.existingFeedbackText &&
    ['correct_letter', 'wrong_word', 'silence_or_noise'].includes(turn.kind)
  return { kind: turn.kind, feedbackText: reply || (keepLegacy ? input.existingFeedbackText! : fallbackText(turn, input.letter)),
    // Once the child independently speaks the English PICTURE word in higher KG,
    // praise and model the remaining letter with an English voice (not the
    // prior native explanation voice). This is still not letter mastery.
    languageCode: turn.kind === 'correct_english' && input.level > 1 ? 'en-IN' : turn.language,
    source: reply ? 'qwen-8002' : 'guided' }

}
