import { supabase } from '../lib/supabase'

// Seam dla uwierzytelniania. Komponenty nie znają Supabase bezpośrednio -
// cała interakcja z sesją przechodzi przez ten moduł (jak collectionApi dla
// danych kolekcji). Dzięki temu zamiana dostawcy auth to zmiana w jednym pliku.

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

export function signInWithPassword(credentials) {
  return supabase.auth.signInWithPassword(credentials)
}

export function signOut() {
  return supabase.auth.signOut()
}
