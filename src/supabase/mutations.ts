import { supabase } from './client'

export async function upsertProfile(userId: string, data: any) {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    gender: data.gender,
    age: data.age,
    weight: data.weight,
    height: data.height,
    bmi: data.bmi,
    bmi_category: data.bmiCategory,
    dietary_restrictions: data.dietaryRestrictions,
    allergies: data.allergies,
    calorie_target: data.calorieTarget,
    protein_target: data.proteinTarget,
    carbs_target: data.carbsTarget,
    fat_target: data.fatTarget,
    notifications_enabled: data.notificationsEnabled,
    onboarded_at: data.onboardedAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) console.error('upsertProfile:', error)
}

export function upsertDailyLog(userId: string, date: string, data: any) {
  const db: any = { user_id: userId, date }
  if (data.waterIntake !== undefined) db.water_intake = data.waterIntake
  if (data.caloriesBurned !== undefined) db.calories_burned = data.caloriesBurned
  if (data.caloriesConsumed !== undefined) db.calories_consumed = data.caloriesConsumed
  if (data.proteinTotal !== undefined) db.protein_total = data.proteinTotal
  if (data.carbsTotal !== undefined) db.carbs_total = data.carbsTotal
  if (data.fatTotal !== undefined) db.fat_total = data.fatTotal
  if (data.aiPlan !== undefined) db.ai_plan = data.aiPlan
  supabase.from('daily_logs').upsert(db, { onConflict: 'user_id,date' }).then(({ error }) => {
    if (error) console.error('upsertDailyLog:', error.message, error.details)
  })
}

export function incrementDailyLog(userId: string, date: string, inc: {
  caloriesConsumed?: number
  proteinTotal?: number
  carbsTotal?: number
  fatTotal?: number
}) {
  supabase.rpc('increment_daily_log', {
    p_user_id: userId,
    p_date: date,
    p_calories_consumed: inc.caloriesConsumed || 0,
    p_protein_total: inc.proteinTotal || 0,
    p_carbs_total: inc.carbsTotal || 0,
    p_fat_total: inc.fatTotal || 0,
  }).then(({ error }) => {
    if (error) console.error('incrementDailyLog:', error)
  })
}

export function addMealNonBlocking(userId: string, date: string, m: any) {
  supabase.from('meals').insert(mealToDb(userId, date, m)).then(({ error }) => {
    if (error) console.error('addMeal:', error)
  })
}

export async function addMeal(userId: string, date: string, m: any) {
  const { data, error } = await supabase.from('meals').insert(mealToDb(userId, date, m)).select().single()
  if (error) throw new Error(error.message)
  return data
}

export function updateMealNonBlocking(mealId: string, data: any) {
  const db: any = {}
  if (data.status !== undefined) db.status = data.status
  if (data.name !== undefined) db.name = data.name
  if (data.time !== undefined) db.time = data.time
  if (data.timing !== undefined) db.timing = data.timing
  if (data.calories !== undefined) db.calories = data.calories
  if (data.macros !== undefined) db.macros = data.macros
  if (data.imageUrl !== undefined) db.image_url = data.imageUrl
  if (data.healthScore !== undefined) db.health_score = data.healthScore
  if (data.expertInsight !== undefined) db.expert_insight = data.expertInsight
  if (data.ingredients !== undefined) db.ingredients = data.ingredients
  if (data.allergenWarning !== undefined) db.allergen_warning = data.allergenWarning
  if (data.instructions !== undefined) db.instructions = data.instructions
  if (data.reminderEnabled !== undefined) db.reminder_enabled = data.reminderEnabled
  if (data.description !== undefined) db.description = data.description
  supabase.from('meals').update(db).eq('id', mealId).then(({ error }) => {
    if (error) console.error('updateMeal:', error)
  })
}

export function deleteMealNonBlocking(mealId: string) {
  supabase.from('meals').delete().eq('id', mealId).then(({ error }) => {
    if (error) console.error('deleteMeal:', error)
  })
}

export async function getMealById(mealId: string) {
  const { data } = await supabase.from('meals').select('*').eq('id', mealId).single()
  return data
}

export async function ensureUser(userId: string, displayName = 'Demo User', email?: string | null) {
  const { error } = await supabase.from('users').upsert(
    { id: userId, display_name: displayName, email },
    { onConflict: 'id', ignoreDuplicates: true }
  )
  if (error) console.error('ensureUser:', error.message, error.details)
}

export async function setUserOnboarded(userId: string, onboarded: boolean) {
  await supabase.from('users').update({ onboarded }).eq('id', userId)
}

export async function getUserOnboardingStatus(userId: string): Promise<boolean | null> {
  const { data } = await supabase.from('users').select('onboarded').eq('id', userId).maybeSingle()
  return data?.onboarded ?? null
}

function mealToDb(userId: string, date: string, m: any) {
  return {
    user_id: userId,
    date,
    name: m.name,
    time: m.time || null,
    timing: m.timing || null,
    calories: m.calories || 0,
    macros: m.macros || { protein: 0, carbs: 0, fat: 0 },
    image_url: m.imageUrl || null,
    status: m.status || 'planned',
    source: m.source || null,
    health_score: m.healthScore || null,
    expert_insight: m.expertInsight || null,
    ingredients: m.ingredients || [],
    allergen_warning: m.allergenWarning || null,
    instructions: m.instructions || [],
    reminder_enabled: m.reminderEnabled || false,
    description: m.description || null,
  }
}
