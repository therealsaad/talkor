import { apiClient } from '@/lib/api-client'

export interface MissJulieAIResponse {
  message: string
  emotion:
    | 'greeting'
    | 'welcome'
    | 'curious'
    | 'listening'
    | 'thinking'
    | 'delighted'
    | 'encouraging'
    | 'gentle_correction'
    | 'modeling'
    | 'proud'
    | 'surprised'
    | 'retry'
    | 'gentle_retry'
    | 'hinting'
    | 'celebrating'
    | 'concerned'
  responseQuality?: 'STRONG' | 'ADEQUATE' | 'PARTIAL' | 'UNCLEAR'
  evaluation?: {
    correct: boolean
    score: number
    feedback: string
  }
  corrections?: string[]
  correction?: { needed: boolean; original: string; corrected: string; explanation: string }
  hint?: string | null
  followUpQuestion?: string | null
  xpAwarded?: number
  recommendation?: string | null
  teachingAction?: string | null
  modelSentence?: string | null
  activityComplete?: boolean
  shouldRetry?: boolean
  hintLevel?: number
  detectedSkills?: string[]
  remainingSkills?: string[]
  conversation?: {
    id?: string
    status?: 'ACTIVE' | 'COMPLETED'
    turnCount?: number
    achievedConcepts?: string[]
    requiredConcepts?: string[]
    complete?: boolean
    masteryStatus?: 'IN_PROGRESS' | 'MASTERED' | 'COMPLETED_WITH_SUPPORT' | 'NEEDS_PRACTICE'
    skillEvidence?: Array<{ skill: string; support: 'INDEPENDENT' | 'SUPPORTED'; utterance: string; turn: number }>
    retryState?: { waiting: boolean; targetSkill: string; attempt: number; hintLevel: number; originalUtterance: string; modelSentence?: string }
  }
}

export interface ConversationStartResponse {
  conversationId: string
  message: string
  emotion: MissJulieAIResponse['emotion']
  followUpQuestion?: string | null
  suggestedResponses?: string[]
  conversation: {
    id: string
    status: 'ACTIVE' | 'COMPLETED'
    turnCount: number
    messagesCount: number
  }
}

export interface AIRecommendation {
  nextAction: string
  suggestedLevelId?: string
  focusSkill?: string
  rationale?: string
  message: string
}

export const aiService = {
  async startConversation(params: {
    lessonId?: string
    activityId?: string
    mode?: 'FREE_TALK' | 'LESSON' | 'PRACTICE'
  } = {}): Promise<ConversationStartResponse> {
    return apiClient<ConversationStartResponse>('/ai/conversation/start', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async sendTurn(params: {
    message: string
    conversationId?: string
    lessonId?: string
    activityId?: string
    context?: string
    inputMode?: 'OPTION' | 'MIC' | 'TEXT'
  }): Promise<MissJulieAIResponse> {
    return apiClient<MissJulieAIResponse>('/ai/conversation/turn', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async endConversation(conversationId: string): Promise<{ conversationId: string; status: string; summary?: string }> {
    return apiClient<{ conversationId: string; status: string; summary?: string }>(
      `/ai/conversation/${conversationId}/end`,
      {
        method: 'POST',
      },
    )
  },

  async askMissJulie(params: {
    message: string
    conversationId?: string
    activityId?: string
    lessonId?: string
    context?: string
    inputMode?: 'OPTION' | 'MIC' | 'TEXT'
  }): Promise<MissJulieAIResponse> {
    return apiClient<MissJulieAIResponse>('/ai/miss-julie', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async getRecommendation(): Promise<AIRecommendation> {
    const data = await apiClient<{ recommendations: string[] }>('/ai/recommendation')
    const message = data.recommendations[0] || 'Keep going — try the next lesson in your current level!'
    return { nextAction: 'Continue your current lesson', message }
  },
}
