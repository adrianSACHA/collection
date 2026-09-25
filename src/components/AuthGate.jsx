import { lazy, Suspense, useEffect, useState } from 'react'
import { getSession, onAuthStateChange } from '../auth/authApi'
import LoadingFallback from './LoadingFallback'

const Login = lazy(() => import('./Login'))

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

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
                {/* Moneta obraca się wokół osi Y (awers/rewers). Perspektywa siedzi na
            rodzicu, a `transform-style: preserve-3d` na obracającym się
            elemencie - bez tego rotateY wygląda jak ściskanie w poziomie, a nie
            jak obrót. Animacja jest pod `motion-safe`, więc przy
            prefers-reduced-motion moneta stoi. */}
        <div className="h-16 w-16 [perspective:400px]">
          <div className="relative h-full w-full motion-safe:animate-coin-flip [transform-style:preserve-3d]">
            {/* Awers */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-[#9a6508] bg-gradient-to-br from-[#f8d65f] via-[#d6a91f] to-[#a86d06] shadow-md [backface-visibility:hidden]">
              <div className="absolute inset-1 rounded-full border border-[#fff1ab]/70" />

              <span
                aria-hidden="true"
                className="relative font-serif text-3xl font-bold leading-none text-[#fff7cf]"
              >
                ✦
              </span>
            </div>

            {/* Rewers - inny odcień, podwójny rant i inny znak, żeby obrót
                czytał się jako druga strona monety, a nie lustro awersu.
                Obrócony o 180°, więc niewidoczny, gdy zwrócony tyłem. */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-[#7a4d04] bg-gradient-to-bl from-[#e9b93a] via-[#b9820c] to-[#7a4d04] shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="absolute inset-1 rounded-full border border-[#fff1ab]/50" />
              <div className="absolute inset-2.5 rounded-full border border-[#5f3c03]/40" />

              <span
                aria-hidden="true"
                className="relative font-serif text-2xl font-bold leading-none text-[#fff1ab]"
              >
                ✧
              </span>
            </div>
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
    return (
      <Suspense fallback={<LoadingFallback label="Wczytywanie…" />}>
        <Login />
      </Suspense>
    )
  }

  return children
}
