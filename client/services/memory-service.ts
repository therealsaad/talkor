import { apiClient } from '@/lib/api-client'

export interface StudentMemoryItem {
  id: string
  _id?: string
  studentId: string
  key?: string
  value?: string
  category: 'preference' | 'vocabulary' | 'grammar' | 'pronunciation' | 'speaking' | 'behavior'
  fact: string
  confidence: number
  lastReinforcedAt: string | Date
  source: 'ai' | 'system' | 'teacher'
}

export const memoryService = {
  async getMyMemories(): Promise<StudentMemoryItem[]> {
    try {
      const res = await apiClient<StudentMemoryItem[]>('/memory/mine', { method: 'GET' })
      return Array.isArray(res) ? res : []
    } catch {
      return []
    }
  },
}
