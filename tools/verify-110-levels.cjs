/** Dependency-free structural verification, not a production acceptance test. */
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('backend/src/curriculum/level-design-manifest.json'));
assert.equal(catalog.length,110);assert.equal(new Set(catalog.map(x=>x.id)).size,110);
const registry=read('client/features/lessons/registry.ts');
const roadmap=read('backend/src/curriculum/roadmap.ts');
const studio=read('client/app/school/curriculum-studio/[grade]/[level]/page.tsx');
const controller=read('backend/src/controllers/level-map.controller.ts');
const routes=read('backend/src/routes/level-map.routes.ts');
const schoolLayout=read('client/app/school/layout.tsx');
assert.match(routes,/authenticate.*requireRole\('SCHOOL_ADMIN', 'TEACHER'\)/);
assert.match(routes,/LevelMapController\.studio/);
assert.match(controller,/checkKGTeacher\(req, grade\)/);
assert.match(schoolLayout,/isEducator/);assert.match(studio,/gradeLevelMapService\.level\(grade,level\)/);assert.match(studio,/gradeLevelMapService\.studio\(grade,level\)/);
assert.match(roadmap,/GRADE_ROADMAP\.length !== 110/);
const configRegex=/export const config = (\{[\s\S]*\}) as const satisfies LevelDesignConfig\s*$/;
const uniqueThemes=new Set(); const uniquePalettes=new Set(); let count=0;
for(let grade=0;grade<=10;grade++){
 const slug=grade===0?'kg':`class-${String(grade).padStart(2,'0')}`;
 for(let level=1;level<=10;level++){
  const id=`g${String(grade).padStart(2,'0')}-l${String(level).padStart(2,'0')}`;
  const dir=`client/features/lessons/grades/${slug}/level-${String(level).padStart(2,'0')}`;
  for(const name of ['LevelExperience.tsx','config.ts','activities.ts','interactions.ts','index.ts','assets.json','README.md']) assert.ok(fs.existsSync(path.join(root,dir,name)),`Missing ${dir}/${name}`);
  const result=configRegex.exec(read(`${dir}/config.ts`));assert.ok(result,`Could not parse ${id}`);
  const config=JSON.parse(result[1]);assert.equal(config.id,id);assert.equal(config.grade,grade);assert.equal(config.level,level);
  assert.ok(config.learningPolicy.autoResume);assert.ok(config.learningPolicy.voiceFirst);assert.ok(config.learningPolicy.homeworkRequired);
  assert.ok(config.learningPolicy.invisibleAdaptive);assert.equal(config.staffOnlyPreview,true);
  assert.equal(config.studentPlayable,false,'Draft preview cannot publish a level');
  assert.equal(config.learningPolicy.introRequired,grade===0&&level===1);
  assert.ok(config.experience.minTouchTargetPx>=44);
  assert.equal(config.experience.useReducedMotionFallback,true);
  const activities=read(`${dir}/activities.ts`);
  assert.match(activities,/export const activities: LevelActivity\[\] = \[\]/,'New activities require independent approval');
  assert.match(registry,new RegExp(`'${id}': \\(\\) => import\\('\\./grades/${slug}/level-${String(level).padStart(2,'0')}'\\)`));
  assert.ok(fs.existsSync(path.join(root,`client/public/lessons/${slug}/level-${String(level).padStart(2,'0')}/.gitkeep`)));
  const matching=catalog.find(x=>x.id===id);assert.ok(matching);
  assert.equal(matching.title,config.title);assert.equal(matching.designTheme,config.experience.themeId);
  assert.equal(matching.readyForPublication,false);
  uniqueThemes.add(config.experience.themeId);uniquePalettes.add(config.experience.palette.background);
  count++;
 }
}
assert.equal(count,110);assert.equal(uniqueThemes.size,110);assert.equal(uniquePalettes.size,110);
assert.match(read('client/app/student/kg/page.tsx'),/const INTRO_VIDEO = '\/kg\/videos\/fullkg.mp4'/);
assert.match(read('client/app/student/kg/page.tsx'),/kgAlphabetService\.introSeen\(\)/);
assert.match(read('backend/src/controllers/kg-alphabet.controller.ts'),/INTRO_MINIMUM_MS = 59_000/);
assert.ok(fs.existsSync(path.join(root,'client/public/kg/videos/fullkg.mp4')));
for (const pose of ['idle','speaking','listening','thinking','pointing','encouraging','celebrating']) assert.ok(fs.existsSync(path.join(root,`client/public/miss-julie-animations/${pose}.webm`)));
assert.ok(fs.existsSync(path.join(root,'client/public/kg/audio/garden-ambience-v1.mp3')));
assert.match(read('client/app/student/lesson/[id]/page.tsx'),/ActivityEngine/);
assert.match(read('backend/src/models/Level.ts'),/levelSchema\.index\(\{ classId: 1, number: 1 \}, \{ unique: true \}/);
console.log(`OK: ${count}/110 workspaces; 110 distinct palettes/themes; 110 lazy registry entries; draft protection, KG intro, media and existing player confirmed`);
