// One place to edit event details. The registration page at
// app/register/[eventId]/page.tsx reads from here based on the URL —
// add a new event object and it gets a working /register/<id> page for free.

export type EventCategory = { id: string; label: string; total: number }

export type EventConfig = {
  id: string
  org: string
  title: string
  dateLabel: string
  address: string
  duration: string
  fee: number
  rules: string[]
  contactEmail: string
  contactPhone: string
  // Selection mode: 'dishes' shows a stock-limited checkbox group (food festival style),
  // 'category' shows a single-select set of race categories (marathon style, no per-item stock needed
  // unless you add `total` and it'll behave the same as dishes).
  selectionLabel: string
  selectionMode: 'dishes' | 'category'
  options: EventCategory[]
}

export const EVENTS: Record<string, EventConfig> = {
  'food-festival': {
    id: 'food-festival',
    org: 'Rilbong Sanatan Hindu Dharma Sabha',
    title: 'Rilbong Community Food Festival 2026',
    dateLabel: 'Saturday, 3rd October 2026 · 9:00 AM – 4:00 PM',
    address: 'Rilbong Maidan, Shillong',
    duration: '9:00 AM to 4:00 PM',
    fee: 500,
    rules: [
      'Entry fee for all categories is ₹500 for each participant.',
      'Each participant may register for a maximum of one dish category.',
      'All dishes must be prepared at home using traditional recipes.',
      'Judging is based on taste, presentation, and authenticity.',
      'Participants must report to the registration desk by 8:30 AM on event day.',
      'The committee reserves the right to disqualify any entry that violates hygiene guidelines.',
    ],
    contactEmail: 'rilbongsanatanhindudharmasabha@gmail.com',
    contactPhone: '+91 94361 03190',
    selectionLabel: 'Select Your Dish(es)',
    selectionMode: 'dishes',
    options: [
      { id: 'pukhlein', label: 'Traditional Pukhlein', total: 10 },
      { id: 'jadoh', label: 'Jadoh', total: 10 },
      { id: 'tungrymbai', label: 'Tungrymbai Curry', total: 10 },
      { id: 'dohkhlieh', label: 'Doh Khlieh', total: 10 },
      { id: 'pumaloi', label: 'Pumaloi', total: 10 },
      { id: 'dohneiiong', label: 'Dohneiiong', total: 10 },
    ],
  },
  marathon: {
    id: 'marathon',
    org: 'Rilbong Sanatan Hindu Dharma Sabha',
    title: 'Rilbong Centennial Marathon',
    dateLabel: '2nd October 2026 · 5:15 AM Report · 6:00 AM Flag Off',
    address: 'Rhino Museum Point → Rilbong Puja Mandap, Shillong',
    duration: '5:15 AM – 9:00 AM (approx.)',
    fee: 300,
    rules: [
      'Entry fee for all categories is ₹300 per participant.',
      'Runners must report by 5:15 AM for bib collection; late arrivals may not be permitted to start.',
      'Choose only one race category — 5K or 10K.',
      'Medical assistance points are stationed along the route; please carry any personal medication.',
      'The committee reserves the right to alter the route for safety reasons.',
    ],
    contactEmail: 'rilbongsanatanhindudharmasabha@gmail.com',
    contactPhone: '+91 94361 03190',
    selectionLabel: 'Select Your Category',
    selectionMode: 'category',
    options: [
      { id: '5k', label: '5K Run', total: 150 },
      { id: '10k', label: '10K Run', total: 100 },
    ],
  },
}

export function getEvent(id: string): EventConfig | undefined {
  return EVENTS[id]
}