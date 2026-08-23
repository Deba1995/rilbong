import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getEvent } from '@/lib/events-store'
import { createDraftRegistration, findExistingDraft } from '@/lib/registrations-store-admin'
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: Request) {
  try {
    const { eventId, ticketId, values } = await req.json()

    if (!eventId || !ticketId) {
      return NextResponse.json({ error: 'Missing eventId or ticketId' }, { status: 400 })
    }

    const event = await getEvent(eventId)
    if (!event || event.status !== 'active') {
      return NextResponse.json({ error: 'Event not available' }, { status: 400 })
    }

    const ticket = event.tickets.find((t) => t.id === ticketId)
    if (!ticket) {
      return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 })
    }

    const amountInRupees = ticket.price

    // Idempotency guard: reuse a recent matching draft instead of creating a duplicate.
    const existingDraft = await findExistingDraft({ eventId, ticketId, values })

    if (existingDraft && existingDraft.amount === amountInRupees) {
      if (existingDraft.status === 'paid' || existingDraft.status === 'free_confirmed') {
        return NextResponse.json({
          isFree: existingDraft.status === 'free_confirmed',
          alreadyConfirmed: true,
          registrationId: existingDraft.id,
        })
      }
      if (existingDraft.razorpayOrderId) {
        return NextResponse.json({
          orderId: existingDraft.razorpayOrderId,
          amount: Math.round(amountInRupees * 100),
          currency: 'INR',
          registrationId: existingDraft.id,
          reused: true,
        })
      }
    }

    // Free Ticket Bypass
    if (amountInRupees === 0) {
      const draft = await createDraftRegistration({
        eventId,
        ticketId,
        values,
        amount: 0,
        status: 'free_confirmed',
      })
      return NextResponse.json({ isFree: true, registrationId: draft.id })
    }

    // Paid Ticket: Create Razorpay Order (amount is in paise)
    const amountInPaise = Math.round(amountInRupees * 100)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `event_${eventId}_${Date.now()}`,
    })

    const draft = await createDraftRegistration({
      eventId,
      ticketId,
      values,
      amount: amountInRupees,
      razorpayOrderId: order.id,
      status: 'pending_payment',
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      registrationId: draft.id,
    })
  } catch (error) {
    console.error('Checkout Error:', error)
    return NextResponse.json({ error: 'Failed to initialize checkout' }, { status: 500 })
  }
}