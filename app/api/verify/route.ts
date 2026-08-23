import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { confirmRegistrationPayment } from '@/lib/registrations-store-admin'

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    let isAuthentic = false
    try {
      isAuthentic = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
      )
    } catch {
      isAuthentic = false
    }

    if (!isAuthentic) {
      console.warn('Invalid payment signature for order:', razorpay_order_id)
      return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 })
    }

    const result = await confirmRegistrationPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!result) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      alreadyPaid: !!result.alreadyPaid,
      registrationId: result.registration?.id,
    })
  } catch (error) {
    console.error('Verification Error:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}