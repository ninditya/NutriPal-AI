'use client'

import { useState, useEffect } from 'react'
import { supabase } from './client'
import { useSupabaseCtx } from './provider'

export function useUser() {
  const { user, isUserLoading } = useSupabaseCtx()
  return { user, isUserLoading, userError: null }
}


export function useProfile(userId: string | null | undefined) {
  const [data, setData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) { setData(null); return }
    setIsLoading(true)

    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data: raw, error: err }) => {
        setIsLoading(false)
        if (err) setError(new Error(err.message))
        else setData(raw ? mapProfile(raw) : null)
      })

    const ch = supabase.channel(`profile:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${userId}` },
        (p) => setData(p.eventType === 'DELETE' ? null : mapProfile(p.new)))
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [userId])

  return { data, isLoading, error }
}

export function useDailyLog(userId: string | null | undefined, date: string | null | undefined) {
  const [data, setData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId || !date) { setData(null); return }
    setIsLoading(true)

    supabase.from('daily_logs').select('*').eq('user_id', userId).eq('date', date).maybeSingle()
      .then(({ data: raw }) => {
        setIsLoading(false)
        setData(raw ? mapDailyLog(raw) : null)
      })

    const ch = supabase.channel(`daily_log:${userId}:${date}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs', filter: `user_id=eq.${userId}` },
        (p) => {
          const row = p.eventType === 'DELETE' ? p.old : p.new
          if ((row as any)?.date === date) {
            setData(p.eventType === 'DELETE' ? null : mapDailyLog(p.new))
          }
        })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [userId, date])

  return { data, isLoading, error: null }
}

export function useMeals(userId: string | null | undefined, date: string | null | undefined) {
  const [data, setData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId || !date) { setData(null); return }
    setIsLoading(true)

    const fetch = async () => {
      const { data: rows } = await supabase.from('meals').select('*').eq('user_id', userId).eq('date', date)
      if (rows) setData(rows.map(mapMeal))
      setIsLoading(false)
    }

    fetch()

    const ch = supabase.channel(`meals:${userId}:${date}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: `user_id=eq.${userId}` }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [userId, date])

  return { data, isLoading, error: null }
}

export function useDailyLogs(userId: string | null | undefined, count = 14) {
  const [data, setData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) { setData(null); return }
    setIsLoading(true)

    const fetch = async () => {
      const { data: rows } = await supabase.from('daily_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(count)
      if (rows) setData(rows.map(mapDailyLog))
      setIsLoading(false)
    }

    fetch()

    const ch = supabase.channel(`daily_logs:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs', filter: `user_id=eq.${userId}` }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [userId, count])

  return { data, isLoading }
}

export function mapProfile(p: any) {
  return {
    id: p.id,
    gender: p.gender || '',
    age: p.age || 0,
    weight: p.weight || 0,
    height: p.height || 0,
    bmi: p.bmi ?? null,
    bmiCategory: p.bmi_category || '',
    dietaryRestrictions: p.dietary_restrictions || [],
    allergies: p.allergies || '',
    calorieTarget: p.calorie_target || 2000,
    proteinTarget: p.protein_target || 30,
    carbsTarget: p.carbs_target || 40,
    fatTarget: p.fat_target || 30,
    notificationsEnabled: p.notifications_enabled || false,
    onboardedAt: p.onboarded_at || null,
  }
}

export function mapDailyLog(d: any) {
  return {
    id: d.id,
    date: d.date,
    caloriesBurned: d.calories_burned || 0,
    caloriesConsumed: d.calories_consumed || 0,
    proteinTotal: d.protein_total || 0,
    carbsTotal: d.carbs_total || 0,
    fatTotal: d.fat_total || 0,
    waterIntake: d.water_intake || 0,
    aiPlan: d.ai_plan || null,
  }
}

export function mapMeal(m: any) {
  return {
    id: m.id,
    date: m.date,
    name: m.name,
    time: m.time || null,
    timing: m.timing || null,
    calories: m.calories || 0,
    macros: m.macros || { protein: 0, carbs: 0, fat: 0 },
    imageUrl: m.image_url || null,
    status: m.status || 'planned',
    source: m.source || null,
    healthScore: m.health_score || null,
    expertInsight: m.expert_insight || null,
    ingredients: m.ingredients || [],
    allergenWarning: m.allergen_warning || null,
    instructions: m.instructions || [],
    reminderEnabled: m.reminder_enabled || false,
    description: m.description || null,
    createdAt: m.created_at,
  }
}
