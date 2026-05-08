'use client'

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './client'

export interface AppUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

interface CtxState {
  user: AppUser | null
  isUserLoading: boolean
  session: Session | null
}

const Ctx = createContext<CtxState | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ? toAppUser(session.user) : null)
      setIsUserLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      setUser(session?.user ? toAppUser(session.user) : null)
      setIsUserLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <Ctx.Provider value={{ user, isUserLoading, session }}>{children}</Ctx.Provider>
}

function toAppUser(u: User): AppUser {
  return {
    uid: u.id,
    displayName: u.user_metadata?.display_name || 'Demo User',
    email: u.email || null,
    photoURL: u.user_metadata?.avatar_url || null,
  }
}

export function useSupabaseCtx() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSupabaseCtx must be used within SupabaseProvider')
  return c
}
