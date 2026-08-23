// lib/event-schema.ts

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'phone'
  | 'email'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox-group'
  | 'file'

export type TicketTier = {
  id: string
  name: string
  description?: string
  price: number
  capacity?: number
}

export type FieldOption = {
  id: string
  label: string
}

export type FieldDef = {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: FieldOption[]
  filledBy: 'customer' | 'preset'
  presetValue?: string
}

export type EventStatus = 'draft' | 'active' | 'closed'

export type EventDef = {
  id: string
  org: string
  title: string
  description?: string
  photoUrl?: string
  startDate: string
  endDate: string
  status: EventStatus
  eventStartDate?: string
  eventEndDate?: string
  address: string
  contactEmail: string
  contactPhone: string
  tickets: TicketTier[]
  fields: FieldDef[]
  rules: string[]
  termsAndConditions?: string
  privacyPolicy?: string
  refundPolicy?: string
  shippingPolicy?: string
}

export const DEFAULT_POLICIES = {
  terms: 'By registering for this event, you agree to abide by all organizational rules and venue guidelines. The organizers reserve the right to alter timings or venue details due to unforeseen logistical requirements. Inaccurate information provided may invalidate your pass.',
  privacy: 'Participant information collected during registration is used solely for event badge generation, communication, and on-site coordination. We do not sell or distribute personal data to third-party marketing entities.',
  refund: 'Registration fees are non-refundable. If the event is canceled or indefinitely postponed by the organizers, full refunds will be issued automatically within 5-7 business days.',
  shipping: 'This event uses digital registration passes. No physical tickets will be shipped. Your confirmation receipt and digital pass will be issued upon registration.'
}

// crypto.randomUUID() requires a secure context (https, or localhost in dev).
// It's available in modern browsers and Node 19+. If you ever run this in an
// older/non-secure environment, swap in a small uuid-v4 polyfill.

export function newTicket(): TicketTier {
  return {
    id: crypto.randomUUID(),
    name: 'General Admission',
    price: 0,
    capacity: undefined,
  }
}

export function newField(type: FieldType): FieldDef {
  const id = crypto.randomUUID()
  const base: FieldDef = { id, label: 'Untitled Question', type, required: true, filledBy: 'customer' }
  if (['select', 'radio', 'checkbox-group'].includes(type)) {
    base.options = [
      { id: crypto.randomUUID(), label: 'Option 1' },
      { id: crypto.randomUUID(), label: 'Option 2' },
    ]
  }
  return base
}