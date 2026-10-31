const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri);

  // We can require the transpiled or load via LevelMapService
  const { LevelMapService } = require('../services/level-map.service');

  console.log('--- LevelMapService.grade(1) ---');
  const g1 = await LevelMapService.grade(1);
  console.log('Class 1 summary:', {
    grade: g1.grade,
    name: g1.name,
    classId: g1.classId,
    classStatus: g1.classStatus,
    mappedCount: g1.mappedCount,
    publishedCount: g1.publishedCount,
  });
  console.log('Level 1 for Class 1:');
  console.log(JSON.stringify(g1.levels[0], null, 2));

  console.log('\n--- LevelMapService.grade(0) ---');
  const g0 = await LevelMapService.grade(0);
  console.log('KG summary:', {
    grade: g0.grade,
    name: g0.name,
    classId: g0.classId,
    classStatus: g0.classStatus,
    mappedCount: g0.mappedCount,
    publishedCount: g0.publishedCount,
  });
  console.log('Level 1 for KG:');
  console.log(JSON.stringify(g0.levels[0], null, 2));

  await mongoose.disconnect();
})().catch(console.error);

