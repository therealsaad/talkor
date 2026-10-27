/** Editorial 110-level PLAN, not a claim that 110 runtime lessons are published.
 * Publishers must separately attach syllabus-verified content/activities. */
export interface RoadmapLevel { id: string; grade: number; level: number; title: string; status: 'IMPLEMENTED' | 'PLANNED'; objective: string; skills: string[]; teacherReviewRequired: boolean }
const topics: Record<number, readonly string[]> = {
  0: ["ABCD Picture Garden", "Letters E to J", "My Body and Actions", "Animal Sounds", "Food and Fruits", "Family Words", "My Classroom", "Feelings and Greetings", "Opposites and Directions", "Mini Story and Revision"],
  1: ["Little Words & My First Day", "My School", "People and Family", "Colours and Counting", "Things I Like", "Animals Around Us", "Action Words", "Simple Questions", "My Day", "Story Time"],
  2: ["Introduce Myself", "My Favourite Things", "Places Around Me", "Describing People", "Days and Weather", "Asking for Help", "Present Tense", "Sentence Building", "Simple Conversations", "Story Retelling"],
  3: ["Greetings with Details", "My Daily Routine", "People and Places", "Questions and Answers", "Descriptions", "Short Narratives", "Likes and Reasons", "Listening for Details", "Retell a Story", "Mini Presentation"],
  4: ["Favourite Things", "Listening and Speaking", "Family and Friends", "Daily Conversations", "Questions and Answers", "Describing Experiences", "Past and Present", "Story Conversation", "Speaking with Confidence", "End-of-Term Reflection"],
  5: ["Daily Life and Routines", "Descriptive Vocabulary", "Past Experiences", "Giving Directions", "Opinions and Reasons", "Asking Follow-up Questions", "Role-play", "Story Sequencing", "Listening for Meaning", "Personal Presentation"],
  6: ["Express Opinions", "Explain a Process", "Listening Comprehension", "Descriptive Speech", "Grammar in Conversation", "Storytelling", "Making Requests", "Comparing Choices", "Short Debates", "Confident Presentation"],
  7: ["Narrative Storytelling", "Sequence and Time", "Giving Clear Instructions", "Summarising Text", "People and Culture", "Role-play Dialogues", "Persuasive Reasons", "Question Handling", "Collaborative Discussion", "Story Reflection"],
  8: ["Polite Real-Life Conversations", "Travel and Directions", "Explaining Ideas", "Reading Comprehension", "Listening and Inference", "Everyday Problem Solving", "Group Discussion", "Argument with Reasons", "Informal Presentation", "Communication Review"],
  9: ["Discussion and Evidence", "Narrative Development", "Comparing Arguments", "Presentation Planning", "Grammar in Context", "Formal and Informal Speech", "Comprehension and Inference", "Interview Practice", "Structured Speaking", "Reflective Conversation"],
  10: ["Introductions and Interviews", "Expressing an Opinion", "Explaining Evidence", "Formal Presentations", "Comprehension and Summary", "Persuasive Speaking", "Collaborative Discussions", "Debate and Rebuttal", "Communication for Careers", "Final Speaking Portfolio"],
}
export const GRADE_ROADMAP: readonly RoadmapLevel[] = Object.entries(topics).flatMap(([gradeText, titles]) => {
  const grade = Number(gradeText)
  return titles.map((title, index) => ({
    id: `g${String(grade).padStart(2, '0')}-l${String(index + 1).padStart(2, '0')}`,
    grade, level: index + 1, title,
    status: grade === 0 && index === 0 ? 'IMPLEMENTED' as const : 'PLANNED' as const,
    objective: grade <= 2 ? `Recognise, listen and say language about ${title.toLowerCase()}.` :
      `Understand, practise and speak confidently about ${title.toLowerCase()}.`,
    skills: grade <= 2 ? ['listening', 'speaking', 'picture recognition'] : ['listening', 'speaking', 'reading', 'writing'],
    teacherReviewRequired: !(grade === 0 && index === 0),
  }))
})
if (GRADE_ROADMAP.length !== 110 || new Set(GRADE_ROADMAP.map((item) => item.id)).size !== 110) {
  throw new Error('110-level roadmap must contain 10 unique entries for each of the 11 grades')
}
export function roadmapForGrade(grade: number) {
  if (!Number.isInteger(grade) || grade < 0 || grade > 10) return null
  return GRADE_ROADMAP.filter((entry) => entry.grade === grade)
}
