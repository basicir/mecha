'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateCustomerId } from '@/lib/supabase'

export default function SignInPage() {
  const [customerId, setCustomerId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(customerId.trim())) {
      setError('Kérjük, adjon meg egy érvényes azonosítót (UUID formátum)')
      setLoading(false)
      return
    }

    try {
      const { valid, hasCalculated } = await validateCustomerId(customerId.trim())

      if (!valid) {
        setError('Érvénytelen azonosító. Kérjük, ellenőrizze az azonosítót.')
        setLoading(false)
        return
      }

      // Store customer ID in sessionStorage
      sessionStorage.setItem('customerId', customerId.trim())

      if (hasCalculated) {
        // User already calculated, redirect to results
        router.push('/results')
      } else {
        // User can still calculate, redirect to calculator
        router.push('/calculator')
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Hiba történt a bejelentkezéskor. Kérjük, próbálja újra.')
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="signin-container">
        <div className="signin-card">
          <h2>Mecha Oldal</h2>
          <p>Adja meg az ügyfél-azonosítóját a belépéshez</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="customerId">Ügyfél-azonosító (UUID)</label>
              <input
                type="text"
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading || !customerId.trim()}
            >
              {loading ? 'Ellenőrzés...' : 'Belépés'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
