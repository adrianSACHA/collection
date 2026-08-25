import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (signInError) {
      setError('Nieprawidłowy email lub hasło.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-gray-800">
          Zaloguj się
        </h1>

        <div>
          <label
            htmlFor="login-email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>

          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Hasło
          </label>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="min-h-[44px] w-full rounded-lg border border-gray-300 py-2 pl-3 pr-12 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
              aria-pressed={showPassword}
              aria-controls="login-password"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              {showPassword ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="m3 3 18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5.5 0 9.3 4.5 10 8-0.3 1.4-1.3 3.1-2.8 4.5" />
                  <path d="M6.6 6.6C4.5 8 2.7 10.3 2 12c0.8 3.5 4.5 8 10 8 1.6 0 3.1-0.4 4.3-1" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div role="alert" aria-live="assertive" className="min-h-[20px]">
          {error ? (
            <span className="text-sm text-red-700">{error}</span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        >
          {loading ? 'Logowanie...' : 'Zaloguj'}
        </button>
      </form>
    </div>
  )
}