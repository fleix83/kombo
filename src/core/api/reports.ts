import { currentUserId } from './auth'
import { supabase } from './supabase'

export interface ReportInput {
  reportedUserId?: string
  reportedCardId?: string
  reason: string
}

export async function createReport(input: ReportInput): Promise<void> {
  const uid = await currentUserId()
  const { error } = await supabase().from('reports').insert({
    reporter_id: uid,
    reported_user_id: input.reportedUserId ?? null,
    reported_card_id: input.reportedCardId ?? null,
    reason: input.reason,
  })
  if (error) throw error
}
