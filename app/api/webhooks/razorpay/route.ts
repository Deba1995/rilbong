import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature || !rawBody) {
      console.error('Webhook Error: Missing signature or body')
      return NextResponse.json({ error: 'Missing signature or body' }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex')

    let validSignature = false
    try {
      validSignature = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      )
    } catch {
      validSignature = false
    }

    if (!validSignature) {
      console.error('Webhook Error: Signature mismatch!')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload = JSON.parse(rawBody)

    const eventId =
      payload?.payload?.payment?.entity?.id
        ? `${payload.event}:${payload.payload.payment.entity.id}`
        : `${payload.event}:${req.headers.get('x-razorpay-event-id') ?? crypto.randomUUID()}`

    // Check if we've already processed this event — dedupe BEFORE processing,
    // but only record it as done AFTER processing succeeds (see bottom).
    const { data: alreadyProcessed } = await supabase
      .from('processed_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .maybeSingle()

    if (alreadyProcessed) {
      console.log('Duplicate webhook event, skipping:', eventId)
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    if (payload.event === 'order.paid') {
      const orderId = payload.payload.order.entity.id
      const paymentId = payload.payload.payment.entity.id
      const paymentMethod = payload.payload.payment.entity.method

      const { data, error } = await supabase
        .from('registrations')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId,
          payment_method: paymentMethod,
          paid_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', orderId)
        .neq('status', 'paid')
        .select()

      if (error) {
        console.error('Supabase Update Error inside Webhook:', error)
        // Do NOT mark as processed — let Razorpay retry.
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }

      if (!data || data.length === 0) {
        console.warn('order.paid: no row updated for order', orderId, '— already paid or missing draft')
      } else {
        console.log('Registration marked paid:', data[0].id)
      }
    } else if (payload.event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity
      const orderId = paymentEntity.order_id
      const errorDescription = paymentEntity.error_description || 'Transaction failed'

      const { data, error } = await supabase
        .from('registrations')
        .update({ status: 'failed', failure_reason: errorDescription })
        .eq('razorpay_order_id', orderId)
        .eq('status', 'pending_payment')
        .select()

      if (error) {
        console.error('Supabase Failure Update Error:', error)
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
      }

      if (!data || data.length === 0) {
        console.warn('payment.failed: no row updated for order', orderId, '(already paid/failed, or missing)')
      }
    }

    // Only reached if processing above succeeded (or event type is one we don't act on).
    // Insert failure here shouldn't block the response — just log it.
    const { error: markError } = await supabase
      .from('processed_webhook_events')
      .insert({ event_id: eventId })

    if (markError) {
      console.error('Failed to record processed webhook event:', markError)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook Handler Exception:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}