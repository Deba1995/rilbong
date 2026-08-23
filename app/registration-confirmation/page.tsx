'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type RegistrationData = {
  registration: {
    id: string
    status: string
    amount: number
    createdAt: string
    razorpayOrderId?: string
    razorpayPaymentId?: string
    values: Record<string, any>
  }
  event: {
    id: string
    title?: string
    name?: string
    startDate?: string
    eventStartDate?: string
    date?: string | null
    address?: string
    contactEmail?: string
  } | null
  ticket: { id: string; name: string; price: number } | null
  fields: { id: string; label: string; type: string; options?: any[] }[]
}

export default function RegistrationConfirmationPage() {
  const searchParams = useSearchParams()
  const rid = searchParams.get('rid')

  const [data, setData] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!rid) {
      setError('Missing registration id in URL')
      setLoading(false)
      return
    }

    fetch(`/api/registrations/${rid}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load registration')
        return json
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [rid])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        <p className="text-sm text-zinc-500 font-medium">Loading your confirmation...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 text-center border border-red-100 rounded-2xl bg-red-50/50">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>
        <h1 className="text-lg font-semibold text-zinc-900">Couldn't load registration</h1>
        <p className="text-sm text-zinc-600 mt-1">{error}</p>
      </div>
    )
  }

  const { registration, event, ticket, fields } = data
  const isFree = registration.amount === 0
  const eventTitle = event?.title || event?.name || 'Event Pass'
  const eventDate = event?.eventStartDate || event?.startDate || event?.date

  return (
    <div className="min-h-screen bg-zinc-50/50 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header Action Card */}
        <div className="text-center print:hidden space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Registration Confirmed</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Your ticket details and invoice are ready.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
        </div>

        {/* Invoice Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none">
          
          {/* Top Banner */}
          <div className="bg-zinc-900 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                  {isFree ? 'Free Pass' : 'Paid Receipt'}
                </span>
                <h2 className="text-lg font-bold mt-2">{eventTitle}</h2>
                {eventDate && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(eventDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <div className="text-right font-mono text-xs text-zinc-400">
                #{registration.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Registration Values */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Attendee Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-xs">
                {fields && fields.length > 0 ? (
                  fields.map((f) => {
                    if (f.type === 'file') return null
                    const raw = registration.values?.[f.id]
                    const display = Array.isArray(raw)
                      ? raw.map((v) => f.options?.find((o: any) => o.id === v)?.label ?? v).join(', ')
                      : f.options?.find((o: any) => o.id === raw)?.label ?? raw

                    return (
                      <div key={f.id} className="space-y-0.5">
                        <span className="text-zinc-400 block">{f.label}</span>
                        <span className="font-semibold text-zinc-800 break-words">{display || '—'}</span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-zinc-400 col-span-2">No custom details recorded.</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Order Summary
              </h3>
              <div className="border-t border-b border-zinc-100 divide-y divide-zinc-100 text-xs">
                <div className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-zinc-800">{ticket?.name || 'General Admission'}</p>
                    <p className="text-zinc-400 text-[11px]">1x Registration Pass</p>
                  </div>
                  <span className="font-medium text-zinc-800">
                    {isFree ? '₹0' : `₹${registration.amount.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="py-3 flex justify-between items-center font-bold text-sm text-zinc-900">
                  <span>Total Amount</span>
                  <span>{isFree ? 'Free' : `₹${registration.amount.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
            </div>

            {/* Payment Meta */}
            <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100 flex flex-col gap-1 text-[11px] text-zinc-500 font-mono">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(registration.createdAt).toLocaleString('en-IN')}</span>
              </div>
              {registration.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span>{registration.razorpayPaymentId}</span>
                </div>
              )}
              {registration.razorpayOrderId && (
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span>{registration.razorpayOrderId}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-center text-zinc-400">
              This is a digital receipt for your event registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}