import { apiClient } from '@/lib/api-client'

export interface MistakeItem { id?: string; _id?: string; skill: string; expected: string; actual: string; attemptCount: number; lastOccurredAt: string }

export const practiceService = {
  getMistakes() { return apiClient<MistakeItem[]>('/mistakes/mine') },
}
