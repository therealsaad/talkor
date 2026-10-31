const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const classes = await db.collection('curriculumclasses').find({}).toArray();
  const classMap = new Map(classes.map(c => [String(c._id), c]));
  const levels = await db.collection('levels').find({}).toArray();
  const lessons = await db.collection('lessons').find({}).toArray();
  const activities = await db.collection('activities').find({}).toArray();

  console.log(`Summary: ${classes.length} classes, ${levels.length} levels, ${lessons.length} lessons, ${activities.length} activities.`);

  const byGrade = {};
  for (const l of levels) {
    const c = classMap.get(String(l.classId));
    const grade = c !== undefined ? c.grade : 'unknown';
    byGrade[grade] = byGrade[grade] || [];
    byGrade[grade].push(l);
  }

  for (const [grade, levs] of Object.entries(byGrade)) {
    console.log(`Grade ${grade}: ${levs.length} levels. Numbers: ${levs.map(l => l.number).join(', ')}`);
    for (const l of levs) {
      const ls = lessons.filter(x => String(x.levelId) === String(l._id));
      const lsIds = ls.map(x => String(x._id));
      const acts = activities.filter(x => lsIds.includes(String(x.lessonId)));
      const activeActs = acts.filter(x => x.status === 'active');
      const draftActs = acts.filter(x => x.status === 'draft');
      console.log(`  Level ${l.number} ("${l.title}") [status=${l.status}, avail=${l.availability}]: ${ls.length} lessons, ${acts.length} activities (${activeActs.length} active, ${draftActs.length} draft)`);
    }
  }

  // Also check if any lessons or activities exist without a level
  const orphanLessons = lessons.filter(ls => !levels.some(l => String(l._id) === String(ls.levelId)));
  console.log(`\nOrphan lessons: ${orphanLessons.length}`);
  for (const ol of orphanLessons) {
    console.log(`  Orphan lesson: ${ol.title}, id=${ol._id}, levelId=${ol.levelId}`);
  }

  await mongoose.disconnect();
})().catch(console.error);
