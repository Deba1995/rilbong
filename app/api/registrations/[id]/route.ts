import { NextResponse } from 'next/server'
import { getRegistrationById } from '@/lib/registrations-store-admin'
import { getEvent } from '@/lib/events-store'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const registration = await getRegistrationById(id)

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (registration.status !== 'paid' && registration.status !== 'free_confirmed') {
      return NextResponse.json(
        { error: 'Registration not confirmed', status: registration.status },
        { status: 409 }
      )
    }

    const event = await getEvent(registration.eventId)
    const ticket = event?.tickets.find((t) => t.id === registration.ticketId)
    const customerFields = event?.fields.filter((f) => f.filledBy === 'customer') ?? []

    return NextResponse.json({
      registration: {
        id: registration.id,
        status: registration.status,
        amount: registration.amount,
        createdAt: registration.createdAt,
        razorpayOrderId: registration.razorpayOrderId,
        razorpayPaymentId: registration.razorpayPaymentId,
        values: registration.values,
      },
      event: event
        ? { id: event.id, name: event.title, date: (event as any).eventStartDate ?? null }
        : null,
      ticket: ticket ? { id: ticket.id, name: ticket.name, price: ticket.price } : null,
      fields: customerFields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options ?? [],
      })),
    })
  } catch (error) {
    console.error('Registration fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch registration' }, { status: 500 })
  }
}