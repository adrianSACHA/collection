import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Login from './Login'

// Owija całą apkę. Pokazuje ekran logowania, dopóki nie ma aktywnej sesji.
// Po zalogowaniu renderuje dzieci (resztę apki) normalnie.
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = jeszcze nie wiemy

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Wczytywanie...
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return children
}