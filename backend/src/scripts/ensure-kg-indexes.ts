import { connectDatabase, disconnectDatabase } from '../config/db'
import { KGAlphabetAttempt } from '../models/KGAlphabetAttempt'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGAlphabetSubmission } from '../models/KGAlphabetSubmission'
import { KGIntroPlayback } from '../models/KGIntroPlayback'

async function main() {
  await connectDatabase()
  try {
    for (const model of [KGAlphabetAttempt, KGAlphabetProgress, KGAlphabetSubmission, KGIntroPlayback]) {
      await model.createIndexes()
      console.info(`Ensured KG indexes for ${model.modelName}`)
    }
  } finally { await disconnectDatabase() }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'KG index creation failed'); process.exitCode = 1 })
