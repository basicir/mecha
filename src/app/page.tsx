'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateCustomerId } from '@/lib/supabase'

export default function SignInPage() {
    const [customerId, setCustomerId] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(customerId.trim())) {
                setError('Please enter a valid ID format')
                setLoading(false)
                return
            }

            const customer = await validateCustomerId(customerId.trim())

            if (!customer) {
                setError('Invalid customer ID. Please check your ID and try again.')
                setLoading(false)
                return
            }

            // Store customer ID in sessionStorage
            sessionStorage.setItem('customerId', customer.id)

            // Redirect based on calculation status
            if (customer.has_calculated) {
                router.push('/results')
            } else {
                router.push('/calculator')
            }
        } catch (err) {
            setError('Connection error. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md">
            <div className="glass-card p-8 md:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Mecha Oldal
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        Enter your customer ID to access the calculator
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="customerId" className="block text-sm font-medium text-gray-300 mb-2">
                            Customer ID
                        </label>
                        <input
                            type="text"
                            id="customerId"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="input-field font-mono text-sm"
                            disabled={loading}
                            autoComplete="off"
                            spellCheck="false"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center gap-2"
                        disabled={loading || !customerId.trim()}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" />
                                Verifying...
                            </>
                        ) : (
                            'Access Calculator'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-gray-500 text-xs mt-6">
                    Don&apos;t have an ID? Contact your administrator.
                </p>
            </div>
        </div>
    )
}
