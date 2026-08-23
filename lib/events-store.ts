// lib/events-store.ts
import { supabase } from './supabase'
import { EventDef, DEFAULT_POLICIES } from './event-schema'

function toISTLocalString(dateInput: string | null | undefined): string {
  if (!dateInput) return ''

  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }

  const formatter = new Intl.DateTimeFormat('en-CA', options)
  const parts = formatter.formatToParts(date)
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || ''

  const year = getPart('year')
  const month = getPart('month')
  const day = getPart('day')
  let hour = getPart('hour')
  const minute = getPart('minute')

  if (hour === '24') hour = '00'
  if (!year || !month || !day) return ''
  return `${year}-${month}-${day}T${hour}:${minute}`
}

const formatForDB = (val?: string) => {
  if (!val) return null
  return val.includes('+') || val.includes('Z') ? val : `${val}:00+05:30`
}

function mapDbEvent(dbEvent: any, dbTickets: any[], dbFields: any[]): EventDef {
  return {
    id: dbEvent.id,
    org: dbEvent.org,
    title: dbEvent.title,
    description: dbEvent.description,
    photoUrl: dbEvent.photo_url || undefined,
    status: dbEvent.status || 'active',
    startDate: toISTLocalString(dbEvent.start_date),
    endDate: toISTLocalString(dbEvent.end_date),
    eventStartDate: toISTLocalString(dbEvent.event_start_date),
    eventEndDate: toISTLocalString(dbEvent.event_end_date),
    address: dbEvent.address || '',
    contactEmail: dbEvent.contact_email || '',
    contactPhone: dbEvent.contact_phone || '',
    rules: Array.isArray(dbEvent.rules) ? dbEvent.rules : [],
    termsAndConditions: dbEvent.terms_and_conditions || DEFAULT_POLICIES.terms,
    privacyPolicy: dbEvent.privacy_policy || DEFAULT_POLICIES.privacy,
    refundPolicy: dbEvent.refund_policy || DEFAULT_POLICIES.refund,
    shippingPolicy: dbEvent.shipping_policy || DEFAULT_POLICIES.shipping,
    tickets: dbTickets.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price: Number(t.price),
      capacity: t.capacity ?? undefined,
    })),
    fields: dbFields
      .sort((a, b) => a.field_order - b.field_order)
      .map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        filledBy: f.filled_by,
        presetValue: f.preset_value,
        options: f.options || undefined,
      })),
  }
}

export async function getEvents(): Promise<EventDef[]> {
  const { data: events, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  if (!events) return []

  const results: EventDef[] = []
  for (const ev of events) {
    const { data: tickets, error: tErr } = await supabase.from('event_tickets').select('*').eq('event_id', ev.id)
    const { data: fields, error: fErr } = await supabase.from('event_fields').select('*').eq('event_id', ev.id)
    if (tErr) console.error(`Error fetching tickets for ${ev.id}:`, tErr)
    if (fErr) console.error(`Error fetching fields for ${ev.id}:`, fErr)
    results.push(mapDbEvent(ev, tickets || [], fields || []))
  }
  return results
}

export async function getEvent(id: string): Promise<EventDef | undefined> {
  const { data: ev, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (error || !ev) {
    if (error) console.error('Error fetching event:', error)
    return undefined
  }

  const { data: tickets, error: tErr } = await supabase.from('event_tickets').select('*').eq('event_id', id)
  const { data: fields, error: fErr } = await supabase.from('event_fields').select('*').eq('event_id', id)
  if (tErr) console.error('Error fetching tickets:', tErr)
  if (fErr) console.error('Error fetching fields:', fErr)

  return mapDbEvent(ev, tickets || [], fields || [])
}

// Upsert current tickets/fields FIRST, then delete only rows no longer present.
// This ordering means a failed write never wipes existing data — the old
// delete-then-insert pattern could lose everything if the insert step failed.
export async function saveEvent(event: EventDef) {
  const { error: eventError } = await supabase.from('events').upsert({
    id: event.id,
    org: event.org,
    title: event.title,
    description: event.description,
    photo_url: event.photoUrl || null,
    status: event.status,
    start_date: formatForDB(event.startDate),
    end_date: formatForDB(event.endDate),
    event_start_date: formatForDB(event.eventStartDate),
    event_end_date: formatForDB(event.eventEndDate),
    address: event.address,
    contact_email: event.contactEmail,
    contact_phone: event.contactPhone,
    rules: event.rules || [],
    terms_and_conditions: event.termsAndConditions,
    privacy_policy: event.privacyPolicy,
    refund_policy: event.refundPolicy,
    shipping_policy: event.shippingPolicy,
  })
  if (eventError) {
    console.error('Error saving event:', eventError)
    throw new Error(`Failed to save event details: ${eventError.message}`)
  }

  // --- TICKETS ---
  if (event.tickets && event.tickets.length > 0) {
    const ticketRows = event.tickets.map((t) => ({
      id: t.id,
      event_id: event.id,
      name: t.name,
      description: t.description || null,
      price: Number(t.price) || 0,
      capacity: t.capacity !== undefined && t.capacity !== null ? Number(t.capacity) : null,
    }))

    const { error: ticketError } = await supabase.from('event_tickets').upsert(ticketRows)
    if (ticketError) {
      console.error('Error saving tickets to Supabase:', ticketError)
      throw new Error(`Failed to save tickets: ${ticketError.message}`)
    }

    const ticketIds = event.tickets.map((t) => t.id)
    const { error: ticketCleanupError } = await supabase
      .from('event_tickets')
      .delete()
      .eq('event_id', event.id)
      .not('id', 'in', `(${ticketIds.map((id) => `"${id}"`).join(',')})`)
    if (ticketCleanupError) console.error('Error cleaning up removed tickets:', ticketCleanupError)
  } else {
    // No tickets left in the draft at all — safe to clear, this is an explicit user action, not a failed write
    await supabase.from('event_tickets').delete().eq('event_id', event.id)
  }

  // --- FIELDS ---
  if (event.fields && event.fields.length > 0) {
    const fieldRows = event.fields.map((f, index) => ({
      id: f.id,
      event_id: event.id,
      label: f.label,
      type: f.type,
      required: f.required,
      placeholder: f.placeholder,
      filled_by: f.filledBy,
      preset_value: f.presetValue,
      options: f.options ? JSON.parse(JSON.stringify(f.options)) : null,
      field_order: index,
    }))

    const { error: fieldError } = await supabase.from('event_fields').upsert(fieldRows)
    if (fieldError) {
      console.error('Error saving fields to Supabase:', fieldError)
      throw new Error(`Failed to save questions: ${fieldError.message}`)
    }

    const fieldIds = event.fields.map((f) => f.id)
    const { error: fieldCleanupError } = await supabase
      .from('event_fields')
      .delete()
      .eq('event_id', event.id)
      .not('id', 'in', `(${fieldIds.map((id) => `"${id}"`).join(',')})`)
    if (fieldCleanupError) console.error('Error cleaning up removed fields:', fieldCleanupError)
  } else {
    await supabase.from('event_fields').delete().eq('event_id', event.id)
  }
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) {
    console.error('Error deleting event:', error)
    throw new Error(`Failed to delete event: ${error.message}`)
  }
}

export async function createEvent(title: string): Promise<EventDef> {
  const id = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `event-${Date.now()}`

  const newEv: EventDef = {
    id,
    org: 'Rilbong Sanatan Hindu Dharma Sabha',
    title,
    description: '',
    status: 'active',
    startDate: '',
    endDate: '',
    eventStartDate: '',
    eventEndDate: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    rules: [
      'Participants must report at the venue 30 minutes before the scheduled time.',
      'Please carry a valid photo ID and digital booking confirmation.',
    ],
    termsAndConditions: DEFAULT_POLICIES.terms,
    privacyPolicy: DEFAULT_POLICIES.privacy,
    refundPolicy: DEFAULT_POLICIES.refund,
    shippingPolicy: DEFAULT_POLICIES.shipping,
    tickets: [{ id: crypto.randomUUID(), name: 'General Admission', price: 0, capacity: undefined }],
    fields: [
      { id: crypto.randomUUID(), label: 'Full Name', type: 'text', required: true, filledBy: 'customer' },
      { id: crypto.randomUUID(), label: 'Phone', type: 'phone', required: true, filledBy: 'customer' },
    ],
  }

  await saveEvent(newEv)
  return newEv
}

// ---- Cover photo constraints ----
const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_COVER_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const ALLOWED_COVER_EXTENSIONS = ['.png', '.jpg', '.jpeg']

export function validateCoverPhoto(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  if (!ALLOWED_COVER_TYPES.includes(file.type) || !ALLOWED_COVER_EXTENSIONS.includes(ext)) {
    return 'Only PNG or JPEG images are allowed.'
  }
  if (file.size > MAX_COVER_SIZE_BYTES) {
    return `File is too large — max size is 2MB (this file is ${Math.ceil(file.size / (1024 * 1024) * 10) / 10}MB).`
  }
  return null
}

export async function uploadEventCoverPhoto(file: File, eventId: string): Promise<string> {
  const validationError = validateCoverPhoto(file)
  if (validationError) throw new Error(validationError)

  const fileExt = file.name.split('.').pop()
  const fileName = `${eventId}/cover-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('event-covers')
    .upload(fileName, file, { cacheControl: '3600', upsert: true }) // upsert:true so re-uploading replaces cleanly

  if (error) {
    console.error('Cover photo upload error:', error)
    throw new Error('Failed to upload cover photo.')
  }

  const { data: { publicUrl } } = supabase.storage.from('event-covers').getPublicUrl(data.path)
  return publicUrl
}