export { supabase } from './client'
export { SupabaseProvider } from './provider'
export {
  useUser,
  useAuth,
  useProfile,
  useDailyLog,
  useMeals,
  useDailyLogs,
  mapProfile,
  mapDailyLog,
  mapMeal,
} from './hooks'
export {
  upsertProfile,
  upsertDailyLog,
  incrementDailyLog,
  addMeal,
  addMealNonBlocking,
  updateMealNonBlocking,
  deleteMealNonBlocking,
  getMealById,
  ensureUser,
  setUserOnboarded,
  getUserOnboardingStatus,
} from './mutations'
