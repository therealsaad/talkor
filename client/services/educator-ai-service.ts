import { apiClient } from '@/lib/api-client'

export interface EducatorAIResponse {
  summary: string
  insights: Array<{ title: string; detail: string; type: 'PROGRESS' | 'ATTENTION' | 'ENGAGEMENT' | 'SKILL' }>
  actions: Array<{ label: string; reason: string }>
  followUpSuggestions: string[]
}

export const educatorAIService = {
  ask(message: string): Promise<EducatorAIResponse> {
    return apiClient<EducatorAIResponse>('/educator/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: message.trim(), contextType: 'DASHBOARD' }),
    })
  },
}
