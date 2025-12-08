'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateCustomerId, getResult, getSavedInputs } from '@/lib/supabase'

interface ResultData {
    inputA: number
    inputB: number
    resultC: number
    calculatedAt: string
}

export default function ResultsPage() {
    const [result, setResult] = useState<ResultData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        const loadResults = async () => {
            const storedId = sessionStorage.getItem('customerId')

            if (!storedId) {
                router.push('/')
                return
            }

            const customer = await validateCustomerId(storedId)

            if (!customer) {
                sessionStorage.removeItem('customerId')
                router.push('/')
                return
            }

            // Verify customer has calculated
            if (!customer.has_calculated) {
                router.push('/calculator')
                return
            }

            // Load results
            const resultData = await getResult(storedId)
            const inputData = await getSavedInputs(storedId)

            if (resultData) {
                setResult({
                    inputA: inputData?.input_a || 0,
                    inputB: inputData?.input_b || 0,
                    resultC: resultData.result_c,
                    calculatedAt: resultData.calculated_at
                })
            } else {
                setError('Could not load results. Please try again.')
            }

            setLoading(false)
        }

        loadResults()
    }, [router])

    const handleLogout = () => {
        sessionStorage.removeItem('customerId')
        router.push('/')
    }

    if (loading) {
        return (
            <div className="w-full max-w-lg">
                <div className="glass-card p-8 md:p-10 text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-gray-400">Loading results...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full max-w-lg">
                <div className="glass-card p-8 md:p-10 text-center">
                    <div className="error-message mb-4">{error}</div>
                    <button onClick={handleLogout} className="btn-secondary">
                        Return to Sign In
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg">
            <div className="glass-card p-8 md:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Calculation Complete
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Your results are ready
                    </p>
                </div>

                {/* Result display */}
                {result && (
                    <div className="space-y-6">
                        {/* Main result */}
                        <div className="text-center p-6 rounded-xl bg-white/5">
                            <p className="text-gray-400 text-sm mb-2">Result (C)</p>
                            <p className="result-value">{result.resultC}</p>
                        </div>

                        {/* Input values */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-lg bg-white/5">
                                <p className="text-gray-400 text-xs mb-1">Value A</p>
                                <p className="text-2xl font-semibold text-white">{result.inputA}</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-white/5">
                                <p className="text-gray-400 text-xs mb-1">Value B</p>
                                <p className="text-2xl font-semibold text-white">{result.inputB}</p>
                            </div>
                        </div>

                        {/* Formula */}
                        <div className="text-center p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <p className="font-mono text-lg text-white">
                                C = A + B = {result.inputA} + {result.inputB} = <span className="text-violet-400 font-bold">{result.resultC}</span>
                            </p>
                        </div>

                        {/* Calculated at */}
                        <p className="text-center text-gray-500 text-xs">
                            Calculated on {new Date(result.calculatedAt).toLocaleString()}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <button onClick={handleLogout} className="btn-secondary w-full">
                        Sign Out
                    </button>
                </div>

                {/* Info */}
                <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-blue-200 text-sm">
                            You can return to this page anytime using your customer ID to view your results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
