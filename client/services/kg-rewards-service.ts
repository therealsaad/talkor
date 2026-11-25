import { apiClient } from '@/lib/api-client'

export interface KGRewardCollection {
  totalStars: number
  maxStars: 5
  levels: Array<{
    level: number
    title: string
    completed: boolean
    starEarned: boolean
    awardedAt: string | null
  }>
  championUnlocked: boolean
  newlyAwardedLevels: number[]
}

export const kgRewardsService = {
  access: () => apiClient<{ eligible: boolean }>('/kg-rewards/access', { cache: 'no-store' }),
  mine: () => apiClient<KGRewardCollection>('/kg-rewards/mine', { cache: 'no-store' }),
  async rewardForCompletedLevel(level: number, response?: KGRewardCollection): Promise<KGRewardCollection | null> {
    if (response?.newlyAwardedLevels.includes(level)) return response
    try {
      const reconciled = await this.mine()
      return reconciled.newlyAwardedLevels.includes(level) ? reconciled : null
    } catch {
      // Completion remains saved; the collection or dashboard can reconcile later.
      return null
    }
  },
}
