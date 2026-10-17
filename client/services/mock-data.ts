export type Student = {
  id: string
  fullName: string
  className: string
  rollNo: string
  studentCode: string
  progress: number
  learningTime: string
  levelsCompleted: number
  accuracy: number
  speakingScore: number
  vocabularyScore: number
  grammarScore: number
  initials: string
}

export const school = { name: 'Sunrise Public School', location: 'Pune, Maharashtra' }
export const teacher = { name: 'Ananya Sharma', role: 'English teacher' }
export const students: Student[] = [
  { id: 'aanya', fullName: 'Aanya Kapoor', className: 'Class 4A', rollNo: '04', studentCode: 'AAN4', progress: 78, learningTime: '8h 24m', levelsCompleted: 7, accuracy: 91, speakingScore: 86, vocabularyScore: 94, grammarScore: 88, initials: 'AK' },
  { id: 'vihaan', fullName: 'Vihaan Mehta', className: 'Class 4A', rollNo: '07', studentCode: 'VII7', progress: 63, learningTime: '6h 12m', levelsCompleted: 5, accuracy: 82, speakingScore: 74, vocabularyScore: 86, grammarScore: 80, initials: 'VM' },
  { id: 'zoya', fullName: 'Zoya Khan', className: 'Class 4B', rollNo: '12', studentCode: 'ZOY2', progress: 46, learningTime: '4h 08m', levelsCompleted: 3, accuracy: 76, speakingScore: 69, vocabularyScore: 79, grammarScore: 72, initials: 'ZK' },
  { id: 'arjun', fullName: 'Arjun Rao', className: 'Class 4A', rollNo: '18', studentCode: 'ARJ8', progress: 88, learningTime: '10h 45m', levelsCompleted: 9, accuracy: 95, speakingScore: 92, vocabularyScore: 93, grammarScore: 90, initials: 'AR' },
]
export const levels = [
  ['Three Letter Words', 'Classroom', 'completed'], ['Basic Vocabulary', 'School Garden', 'completed'], ['Word Combinations', 'Playground', 'completed'], ['Simple Sentences', 'Ice Cream Shop', 'completed'], ['Short Sentences', 'Home', 'current'], ['Questions', 'Supermarket', 'unlocked'], ['Conversation', 'School Bus', 'unlocked'], ['Story', 'City', 'locked'], ['Speaking Challenge', 'Beach', 'locked'], ['Final Assessment', 'Talkora Festival', 'locked'],
].map(([title, place, status], index) => ({ id: index + 1, title, place, status: status as 'completed' | 'current' | 'unlocked' | 'locked' }))
export const activities = ['Aanya completed Level 4', 'Vihaan practiced speaking', 'Zoya unlocked a new badge']
export const rewards = [{ label: 'XP', value: '1,240' }, { label: 'Stars', value: '28' }, { label: 'Coins', value: '560' }]
export const currentStudent = students[0]
