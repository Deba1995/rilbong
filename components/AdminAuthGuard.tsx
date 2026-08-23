// components/AdminAuthGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

const BLUE = '#2f6fed'

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsAuthenticated(false)
        router.replace('/admin/login')
      } else {
        setIsAuthenticated(true)
      }
    })

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false)
        router.replace('/admin/login')
      } else {
        setIsAuthenticated(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] text-[#5b6472] gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: BLUE }} />
        <p className="text-sm font-medium">Verifying authorization...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}