import manifest from './level-design-manifest.json'
import { GRADE_ROADMAP } from './roadmap'
/** Staff editorial designs are metadata, NEVER publish or unlock student levels. */
const catalog = new Map(manifest.map((item) => [item.id, item]))
if (catalog.size !== 110 || GRADE_ROADMAP.length !== 110 ||
 GRADE_ROADMAP.some((entry)=>catalog.get(entry.id)?.title !== entry.title)) {
 throw new Error('110-level design catalog is out of sync with the curriculum roadmap')
}
export function studioDesignForLevel(grade:number,level:number) {
 if (!Number.isInteger(grade)||grade<0||grade>10||!Number.isInteger(level)||level<1||level>10) return null
 return catalog.get(`g${String(grade).padStart(2,'0')}-l${String(level).padStart(2,'0')}`) || null
}
