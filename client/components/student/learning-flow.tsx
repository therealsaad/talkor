import { ClassWorld, CompletionWorld, LessonWorld, LevelWorld } from '@/components/student/world-scenes'
import { AdventureLevelDetail } from '@/components/student/adventure-level-detail'
export function ClassSelection(){return <ClassWorld />}
export function LevelMap(){return <ClassWorld />}
export function LevelDetail({id}:{id:string}){return <AdventureLevelDetail id={id} />}
export function Lesson({id}:{id:string}){return <LessonWorld id={id} />}
export function Completion(){return <CompletionWorld />}
