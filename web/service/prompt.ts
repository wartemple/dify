import { get, post, del, patch } from './base'
import type { PromptCase } from '@/types/app'

export const likePromptCase = (appId: string, promptId: string) => {
  return get(`apps/${appId}/prompt-cases/${promptId}/like`)
}

export const addPromptCase = (appId: string, body: Record<string, any>) => {
  return post(`apps/${appId}/prompt-cases`, {
    body,
  })  as Promise<PromptCase>
}

export const PatchPromptCase = (appId: string, promptId: string, body: Record<string, any>) => {
  return patch(`apps/${appId}/prompt-cases/${promptId}`, {
    body,
  })
}

export const delPromptCase = (appId: string, promptId: string) => {
  return del(`apps/${appId}/prompt-cases/${promptId}`,)
}
