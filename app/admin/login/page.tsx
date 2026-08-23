// app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'

const BLUE = '#2f6fed'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (data.session) {
        router.push('/admin')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-4 font-sans text-[#1a2b4c]">
      <div className="w-full max-w-md bg-white border border-[#e6e8ec] rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-white"
            style={{ backgroundColor: BLUE }}
          >
            <Lock size={22} />
          </div>
          <h1 className="text-2xl font-bold text-[#1a2b4c]">Admin Access</h1>
          <p className="text-xs text-[#5b6472] mt-1">Sign in to manage registrations and event configuration</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rilbong.org"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d7dbe3] rounded-xl text-sm outline-none focus:border-[#2f6fed] focus:ring-2 focus:ring-[#2f6fed]/15 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d7dbe3] rounded-xl text-sm outline-none focus:border-[#2f6fed] focus:ring-2 focus:ring-[#2f6fed]/15 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: BLUE }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}