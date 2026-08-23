// lib/registrations-store.ts
// CLIENT-SAFE. Only exports functions safe to call from the browser.
import { supabase } from './supabase'

export async function getTicketClaims(eventId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('get_ticket_claims', { p_event_id: eventId })

  if (error || !data) return {}

  const claims: Record<string, number> = {}
  data.forEach((row: any) => {
    claims[row.ticket_id] = Number(row.claim_count)
  })

  return claims
}