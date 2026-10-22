'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { loadWorkspace,type LevelWorkspace } from '@/features/lessons/registry'
import { gradeLevelMapService, type EditorMappedLevel } from '@/services/grade-level-map'

export default function CurriculumStudioPage() {
 const params=useParams(); const {session}=useAuth()
 const grade=Number(params?.grade); const level=Number(params?.level)
 const [module,setModule]=useState<LevelWorkspace|null>(null)
 const [actual,setActual]=useState<EditorMappedLevel|null>(null)
 const [error,setError]=useState(''); const [loading,setLoading]=useState(true)
 useEffect(()=>{
  let live=true;setLoading(true);setModule(null);setError('');setActual(null)
  const entry=loadWorkspace(grade,level)
  if(!entry) {setError('Invalid grade or level.');setLoading(false);return}
  // School-layout enforces staff roles; the API independently authenticates editor map requests.
  Promise.all([entry,gradeLevelMapService.level(grade,level),gradeLevelMapService.studio(grade,level)])
   .then(([workspace,levelStatus,serverDesign])=>{if(!live)return
    if(workspace.config.id!==serverDesign.id || workspace.config.experience.themeId!==serverDesign.designTheme) throw new Error('Backend/frontend level design catalog mismatch. Ask the lead to synchronize the manifests.')
    setModule(workspace);setActual(levelStatus)})
   .catch((e:unknown)=>{if(live)setError(e instanceof Error?e.message:'Could not verify staff curriculum access')})
   .finally(()=>{if(live)setLoading(false)})
  return ()=>{live=false}
 },[grade,level])
 return <SchoolShell title="Lesson Design Studio" subtitle="110 independent level workspaces · staff preview only">
   <p><Link href="/school/curriculum-map">← Back to curriculum map</Link></p>
   {loading?<p role="status">Loading staff design workspace…</p>:null}
   {error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:null}
   {module&&actual?<>
    <div style={{padding:16,borderRadius:12,background:'#fff8e8',marginBottom:16,border:'1px solid #ecc78e'}}>
     <strong>Editorial workspace — not student playable.</strong> MongoDB status: <b>{actual.status}</b>. Actual publishing remains in the existing secured backend curriculum workflow. Never use this design preview to record student progress.
    </div>
    <module.LevelExperience preview />
    <p style={{color:'#475569',fontSize:13,marginTop:20}}>Edit <code>client/features/lessons/grades/{grade===0?'kg':`class-${String(grade).padStart(2,'0')}`}/level-{String(level).padStart(2,'0')}/</code> in your teammate's branch.</p>
   </>:null}
 </SchoolShell>
}
