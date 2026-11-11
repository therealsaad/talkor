/** Source: user-provided English Balbharati Grade One (2025), printed p.1,
 * 1.1 My First Day. Text for this classroom teaching adaptation.
 */
export const FIRST_DAY_POEM_STANZAS = [
  ['See me skip', 'See me run', 'I’m going to school like everyone.'],
  ['See me walk', 'See me grin', 'When the bell rings, I go in.'],
  ['See me jump', 'See me play', 'I’m in Grade One!', 'Hip hip hurray!'],
] as const
export const FIRST_DAY_POEM_LINES = FIRST_DAY_POEM_STANZAS.flat()
export const FIRST_DAY_POEM_FULL = FIRST_DAY_POEM_STANZAS.map(stanza=>stanza.join('\n')).join('\n\n')
/** Poem evidence rules live alongside their authored two-line scenes.
 * Recognition is textual with bounded STT tolerance, not pronunciation scoring.
 * These rules must never be serialized to Python or used to publish content.
 */
export const FIRST_DAY_POEM_STEPS = [
  { key:'poem-pair-1', start:0, end:2, title:'Poem lines 1–2: skip and run', target:'skip', hintHi:'Skip यानी उछलकर चलना, run यानी दौड़ना।', hintMr:'Skip म्हणजे उड्या मारत चालणे, run म्हणजे धावणे.', expectedLinePatterns: [/\bsee\s+me\s+skip(?:ping)?\b/, /\bsee\s+me\s+run(?:ning)?\b/], },
  { key:'poem-pair-2', start:2, end:4, title:'Poem lines 3–4: school and walk', target:'school', hintHi:'School यानी स्कूल और walk यानी चलना।', hintMr:'School म्हणजे शाळा, walk म्हणजे चालणे.', expectedLinePatterns: [/\bgoing\s+to\s+school\b/, /\bsee\s+me\s+walk(?:ing)?\b/], },
  { key:'poem-pair-3', start:4, end:6, title:'Poem lines 5–6: grin and bell', target:'grin', hintHi:'Grin यानी मुस्कान, bell यानी घंटी।', hintMr:'Grin म्हणजे हसू, bell म्हणजे घंटा.', expectedLinePatterns: [/\bsee\s+me\s+(?:grin|smile|smiling)\b/, /\bbell\s+(?:rings?|ringing)\b[\s\S]*\b(?:go\s+in|go\s+inside)\b/], },
  { key:'poem-pair-4', start:6, end:8, title:'Poem lines 7–8: jump and play', target:'jump', hintHi:'Jump यानी कूदना, play यानी खेलना।', hintMr:'Jump म्हणजे उडी मारणे, play म्हणजे खेळणे.', expectedLinePatterns: [/\bsee\s+me\s+jump(?:ing)?\b/, /\bsee\s+me\s+play(?:ing)?\b/], },
  { key:'poem-pair-5', start:8, end:10, title:'Poem lines 9–10: Grade One and hurray', target:'grade one', hintHi:'Grade One यानी पहली कक्षा। Hurray खुशी का जयकारा है।', hintMr:'Grade One म्हणजे पहिली इयत्ता. Hurray म्हणजे आनंदाचा जयघोष.', expectedLinePatterns: [/\b(?:i['’]?m|i\s+am)\s+in\s+grade\s+(?:one|1)\b/, /\b(?:hurray|hooray)\b/], },
  { key:'poem-full', start:0, end:10, title:'Poem finale: recite My First Day', target:'school', hintHi:'धीरे धीरे पूरी कविता बोलो। मैं सुन रही हूँ।', hintMr:'हळूहळू पूर्ण कविता म्हण. मी ऐकत आहे.', recital: { minWords:20, minThemes:4, themes: [
    /\bskip\b.*\brun\b/s, /\bwalk\b.*\bgrin\b/s,
    /\bbell\b.*\bin\b/s, /\bjump\b.*\bplay\b/s,
    /\bgrade\s+(?:one|1)\b.*\b(?:hurray|hooray)\b/s,
  ] }, }
] as const
export const FIRST_DAY_POEM_WORD_BANK = ['see','skip','school','everyone','walk','grin','bell','rings','jump','play','Grade','hurray'] as const
