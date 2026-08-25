import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Login from './Login'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4"
        role="status"
        aria-live="polite"
        aria-label="Wczytywanie kolekcji"
      >
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Obracający się granatowy pierścień */}
          <div className="absolute inset-0 rounded-full border-[5px] border-[#10213d]/20 border-t-[#10213d] motion-safe:animate-spin" />

          {/* Nieruchoma złota moneta */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#9a6508] bg-gradient-to-br from-[#f8d65f] via-[#d6a91f] to-[#a86d06] shadow-md">
            {/* Wewnętrzny rant monety */}
            <div className="absolute inset-1 rounded-full border border-[#fff1ab]/70" />

            {/* Znak na awersie */}
            <span
              aria-hidden="true"
              className="relative font-serif text-3xl font-bold leading-none text-[#fff7cf]"
            >
              ✦
            </span>
          </div>
        </div>

        <p className="mt-5 text-base font-semibold text-gray-800">
          Wczytywanie kolekcji…
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Sprawdzanie dostępu i przygotowywanie danych
        </p>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return children
}