// lib/registrations-store-admin.ts
// SERVER-ONLY. Do not import this into any 'use client' file.
import { supabaseAdmin } from './supabase-admin'

export type Registration = {
  id: string
  eventId: string
  ticketId: string
  values: Record<string, any>
  amount: number
  status: string
  termsAccepted: boolean
  createdAt: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

function mapRegistration(dbReg: any): Registration {
  return {
    id: dbReg.id,
    eventId: dbReg.event_id,
    ticketId: dbReg.ticket_id,
    values: dbReg.values,
    amount: Number(dbReg.amount),
    status: dbReg.status,
    termsAccepted: dbReg.terms_accepted,
    createdAt: dbReg.created_at,
    razorpayOrderId: dbReg.razorpay_order_id,
    razorpayPaymentId: dbReg.razorpay_payment_id,
    razorpaySignature: dbReg.razorpay_signature,
  }
}

export async function getAllRegistrations(): Promise<Registration[]> {
  const { data, error } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapRegistration)
}

export async function getRegistrationById(id: string): Promise<Registration | null> {
  const { data, error } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('getRegistrationById error:', error)
    return null
  }
  if (!data) return null
  return mapRegistration(data)
}

export async function findExistingDraft({
  eventId,
  ticketId,
  values,
}: {
  eventId: string
  ticketId: string
  values: any
}): Promise<{ id: string; amount: number; status: string; razorpayOrderId?: string } | null> {
  const email = values?.email
  if (!email) return null

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('ticket_id', ticketId)
    .in('status', ['pending_payment', 'free_confirmed', 'paid'])
    .filter('values->>email', 'eq', email)
    .gte('created_at', thirtyMinAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('findExistingDraft error:', error)
    return null
  }
  if (!data) return null

  return {
    id: data.id,
    amount: Number(data.amount),
    status: data.status,
    razorpayOrderId: data.razorpay_order_id,
  }
}

export async function createDraftRegistration({
  eventId,
  ticketId,
  values,
  amount,
  razorpayOrderId,
  status,
}: {
  eventId: string
  ticketId: string
  values: any
  amount: number
  razorpayOrderId?: string
  status?: string
}) {
  const resolvedStatus = status ?? (amount === 0 ? 'free_confirmed' : 'pending_payment')

  const { data, error } = await supabaseAdmin
    .from('registrations')
    .insert([{
      event_id: eventId,
      ticket_id: ticketId,
      values: values,
      amount: amount,
      status: resolvedStatus,
      terms_accepted: true,
      razorpay_order_id: razorpayOrderId || null,
    }])
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function confirmRegistrationPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ alreadyPaid: boolean; registration?: Registration } | null> {

  const { data, error } = await supabaseAdmin
    .from('registrations')
    .update({
      status: 'paid',
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      paid_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', orderId)
    .neq('status', 'paid')
    .select()

  if (error) {
    console.error('SUPABASE UPDATE ERROR:', error)
    throw error
  }

  if (data && data.length > 0) {
    return { alreadyPaid: false, registration: mapRegistration(data[0]) }
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('registrations')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .maybeSingle()


  if (fetchError) {
    console.error('SUPABASE FETCH ERROR (post-update check):', fetchError)
    throw fetchError
  }

  if (!existing) {
    console.error('No registration found for order:', orderId)
    return null
  }

  if (existing.status === 'paid') {
    return { alreadyPaid: true, registration: mapRegistration(existing) }
  }

  console.warn(
    `confirmRegistrationPayment: row for order ${orderId} is in unexpected status "${existing.status}"`
  )
  return { alreadyPaid: false, registration: mapRegistration(existing) }
}