import type { ComponentType } from 'react'
import type { LevelDesignConfig } from './types'

export interface LevelExperienceProps {
  preview?: boolean
  previewStartIndex?: number
  previewStartLetter?: 'K' | 'L' | 'M' | 'N' | 'O' | 'P'
  previewStartLevel5Letter?: 'W' | 'X' | 'Y' | 'Z'
  onPreviewBack?: () => void
}
export interface LevelWorkspace { config:LevelDesignConfig; LevelExperience:ComponentType<LevelExperienceProps> }
/** Literal lazy imports guarantee per-level code splitting and independent authoring. */
const workspaces:Record<string, () => Promise<LevelWorkspace>> = {
  'g00-l01': () => import('./grades/kg/level-01'),
  'g00-l02': () => import('./grades/kg/level-02'),
  'g00-l03': () => import('./grades/kg/level-03'),
  'g00-l04': () => import('./grades/kg/level-04'),
  'g00-l05': () => import('./grades/kg/level-05'),
  'g00-l06': () => import('./grades/kg/level-06'),
  'g00-l07': () => import('./grades/kg/level-07'),
  'g00-l08': () => import('./grades/kg/level-08'),
  'g00-l09': () => import('./grades/kg/level-09'),
  'g00-l10': () => import('./grades/kg/level-10'),
  'g01-l01': () => import('./grades/class-01/level-01'),
  'g01-l02': () => import('./grades/class-01/level-02'),
  'g01-l03': () => import('./grades/class-01/level-03'),
  'g01-l04': () => import('./grades/class-01/level-04'),
  'g01-l05': () => import('./grades/class-01/level-05'),
  'g01-l06': () => import('./grades/class-01/level-06'),
  'g01-l07': () => import('./grades/class-01/level-07'),
  'g01-l08': () => import('./grades/class-01/level-08'),
  'g01-l09': () => import('./grades/class-01/level-09'),
  'g01-l10': () => import('./grades/class-01/level-10'),
  'g02-l01': () => import('./grades/class-02/level-01'),
  'g02-l02': () => import('./grades/class-02/level-02'),
  'g02-l03': () => import('./grades/class-02/level-03'),
  'g02-l04': () => import('./grades/class-02/level-04'),
  'g02-l05': () => import('./grades/class-02/level-05'),
  'g02-l06': () => import('./grades/class-02/level-06'),
  'g02-l07': () => import('./grades/class-02/level-07'),
  'g02-l08': () => import('./grades/class-02/level-08'),
  'g02-l09': () => import('./grades/class-02/level-09'),
  'g02-l10': () => import('./grades/class-02/level-10'),
  'g03-l01': () => import('./grades/class-03/level-01'),
  'g03-l02': () => import('./grades/class-03/level-02'),
  'g03-l03': () => import('./grades/class-03/level-03'),
  'g03-l04': () => import('./grades/class-03/level-04'),
  'g03-l05': () => import('./grades/class-03/level-05'),
  'g03-l06': () => import('./grades/class-03/level-06'),
  'g03-l07': () => import('./grades/class-03/level-07'),
  'g03-l08': () => import('./grades/class-03/level-08'),
  'g03-l09': () => import('./grades/class-03/level-09'),
  'g03-l10': () => import('./grades/class-03/level-10'),
  'g04-l01': () => import('./grades/class-04/level-01'),
  'g04-l02': () => import('./grades/class-04/level-02'),
  'g04-l03': () => import('./grades/class-04/level-03'),
  'g04-l04': () => import('./grades/class-04/level-04'),
  'g04-l05': () => import('./grades/class-04/level-05'),
  'g04-l06': () => import('./grades/class-04/level-06'),
  'g04-l07': () => import('./grades/class-04/level-07'),
  'g04-l08': () => import('./grades/class-04/level-08'),
  'g04-l09': () => import('./grades/class-04/level-09'),
  'g04-l10': () => import('./grades/class-04/level-10'),
  'g05-l01': () => import('./grades/class-05/level-01'),
  'g05-l02': () => import('./grades/class-05/level-02'),
  'g05-l03': () => import('./grades/class-05/level-03'),
  'g05-l04': () => import('./grades/class-05/level-04'),
  'g05-l05': () => import('./grades/class-05/level-05'),
  'g05-l06': () => import('./grades/class-05/level-06'),
  'g05-l07': () => import('./grades/class-05/level-07'),
  'g05-l08': () => import('./grades/class-05/level-08'),
  'g05-l09': () => import('./grades/class-05/level-09'),
  'g05-l10': () => import('./grades/class-05/level-10'),
  'g06-l01': () => import('./grades/class-06/level-01'),
  'g06-l02': () => import('./grades/class-06/level-02'),
  'g06-l03': () => import('./grades/class-06/level-03'),
  'g06-l04': () => import('./grades/class-06/level-04'),
  'g06-l05': () => import('./grades/class-06/level-05'),
  'g06-l06': () => import('./grades/class-06/level-06'),
  'g06-l07': () => import('./grades/class-06/level-07'),
  'g06-l08': () => import('./grades/class-06/level-08'),
  'g06-l09': () => import('./grades/class-06/level-09'),
  'g06-l10': () => import('./grades/class-06/level-10'),
  'g07-l01': () => import('./grades/class-07/level-01'),
  'g07-l02': () => import('./grades/class-07/level-02'),
  'g07-l03': () => import('./grades/class-07/level-03'),
  'g07-l04': () => import('./grades/class-07/level-04'),
  'g07-l05': () => import('./grades/class-07/level-05'),
  'g07-l06': () => import('./grades/class-07/level-06'),
  'g07-l07': () => import('./grades/class-07/level-07'),
  'g07-l08': () => import('./grades/class-07/level-08'),
  'g07-l09': () => import('./grades/class-07/level-09'),
  'g07-l10': () => import('./grades/class-07/level-10'),
  'g08-l01': () => import('./grades/class-08/level-01'),
  'g08-l02': () => import('./grades/class-08/level-02'),
  'g08-l03': () => import('./grades/class-08/level-03'),
  'g08-l04': () => import('./grades/class-08/level-04'),
  'g08-l05': () => import('./grades/class-08/level-05'),
  'g08-l06': () => import('./grades/class-08/level-06'),
  'g08-l07': () => import('./grades/class-08/level-07'),
  'g08-l08': () => import('./grades/class-08/level-08'),
  'g08-l09': () => import('./grades/class-08/level-09'),
  'g08-l10': () => import('./grades/class-08/level-10'),
  'g09-l01': () => import('./grades/class-09/level-01'),
  'g09-l02': () => import('./grades/class-09/level-02'),
  'g09-l03': () => import('./grades/class-09/level-03'),
  'g09-l04': () => import('./grades/class-09/level-04'),
  'g09-l05': () => import('./grades/class-09/level-05'),
  'g09-l06': () => import('./grades/class-09/level-06'),
  'g09-l07': () => import('./grades/class-09/level-07'),
  'g09-l08': () => import('./grades/class-09/level-08'),
  'g09-l09': () => import('./grades/class-09/level-09'),
  'g09-l10': () => import('./grades/class-09/level-10'),
  'g10-l01': () => import('./grades/class-10/level-01'),
  'g10-l02': () => import('./grades/class-10/level-02'),
  'g10-l03': () => import('./grades/class-10/level-03'),
  'g10-l04': () => import('./grades/class-10/level-04'),
  'g10-l05': () => import('./grades/class-10/level-05'),
  'g10-l06': () => import('./grades/class-10/level-06'),
  'g10-l07': () => import('./grades/class-10/level-07'),
  'g10-l08': () => import('./grades/class-10/level-08'),
  'g10-l09': () => import('./grades/class-10/level-09'),
  'g10-l10': () => import('./grades/class-10/level-10'),
}
export function workspaceId(grade:number,level:number):string|null {
 if(!Number.isInteger(grade)||grade<0||grade>10||!Number.isInteger(level)||level<1||level>10) return null
 return `g${String(grade).padStart(2,'0')}-l${String(level).padStart(2,'0')}`
}
export const WORKSPACE_ADDRESSES=Object.freeze(Object.keys(workspaces))
export function loadWorkspace(grade:number,level:number):Promise<LevelWorkspace>|null {
 const id=workspaceId(grade,level)
 return id&&workspaces[id] ? workspaces[id]() : null
}

/** Student resolver: draft workspaces stay addressable to staff but never become playable. */
export async function loadStudentWorkspace(grade:number,level:number):Promise<LevelWorkspace> {
 const id=workspaceId(grade,level)
 const entry=loadWorkspace(grade,level)
 if(!id||!entry) throw new Error('Curriculum address does not exist')
 const workspace=await entry
 if(workspace.config.id!==id||workspace.config.grade!==grade||workspace.config.level!==level) {
  throw new Error(`Curriculum workspace metadata mismatch for ${id}`)
 }
 if(!workspace.config.studentPlayable||workspace.config.editorialStatus!=='existing-runtime'||workspace.config.staffOnlyPreview) {
  throw new Error(`Curriculum workspace ${id} is not available to students`)
 }
 return workspace
}
