'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    validateCustomerId,
    getSavedInputs,
    saveInputs,
    markAsCalculated,
    saveResult
} from '@/lib/supabase'

export default function CalculatorPage() {
    const [inputA, setInputA] = useState<string>('')
    const [inputB, setInputB] = useState<string>('')
    const [customerId, setCustomerId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [calculating, setCalculating] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
    const [error, setError] = useState('')
    const router = useRouter()
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastSavedRef = useRef<{ a: string; b: string }>({ a: '', b: '' })

    // Check authentication and load saved inputs
    useEffect(() => {
        const checkAuth = async () => {
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

            // If already calculated, redirect to results
            if (customer.has_calculated) {
                router.push('/results')
                return
            }

            setCustomerId(storedId)

            // Load saved inputs
            const savedInputs = await getSavedInputs(storedId)
            if (savedInputs) {
                setInputA(savedInputs.input_a?.toString() || '')
                setInputB(savedInputs.input_b?.toString() || '')
                lastSavedRef.current = {
                    a: savedInputs.input_a?.toString() || '',
                    b: savedInputs.input_b?.toString() || ''
                }
            }

            setLoading(false)
        }

        checkAuth()
    }, [router])

    // Auto-save every 2 seconds when values change
    const performSave = useCallback(async () => {
        if (!customerId) return

        // Only save if values have changed
        if (lastSavedRef.current.a === inputA && lastSavedRef.current.b === inputB) {
            return
        }

        setSaveStatus('saving')
        const success = await saveInputs(
            customerId,
            parseFloat(inputA) || 0,
            parseFloat(inputB) || 0
        )

        if (success) {
            lastSavedRef.current = { a: inputA, b: inputB }
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        }
    }, [customerId, inputA, inputB])

    useEffect(() => {
        if (!customerId || loading) return

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Set new timeout for auto-save
        saveTimeoutRef.current = setTimeout(performSave, 2000)

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [inputA, inputB, customerId, loading, performSave])

    const handleCalculate = async () => {
        if (!customerId) return

        setCalculating(true)
        setError('')

        try {
            // Calculate result (A + B)
            const a = parseFloat(inputA) || 0
            const b = parseFloat(inputB) || 0
            const result = a + b

            // Save result to database
            const resultSaved = await saveResult(customerId, result)
            if (!resultSaved) {
                setError('Failed to save result. Please try again.')
                setCalculating(false)
                return
            }

            // Mark customer as having calculated
            const marked = await markAsCalculated(customerId)
            if (!marked) {
                setError('Failed to complete calculation. Please try again.')
                setCalculating(false)
                return
            }

            // Redirect to results page
            router.push('/results')
        } catch (err) {
            setError('An error occurred. Please try again.')
            setCalculating(false)
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-lg">
                <div className="glass-card p-8 md:p-10 text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-gray-400">Loading calculator...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg">
            <div className="glass-card p-8 md:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Calculator
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Enter values A and B to calculate their sum
                    </p>
                </div>

                {/* Auto-save indicator */}
                <div className={`save-indicator mb-6 justify-center ${saveStatus}`}>
                    {saveStatus === 'saving' && (
                        <>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            <span>Saving...</span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Saved</span>
                        </>
                    )}
                    {saveStatus === 'idle' && (
                        <span className="text-gray-500 text-xs">Auto-saves every 2 seconds</span>
                    )}
                </div>

                {/* Inputs */}
                <div className="space-y-6 mb-8">
                    <div>
                        <label htmlFor="inputA" className="block text-sm font-medium text-gray-300 mb-2">
                            Value A
                        </label>
                        <input
                            type="number"
                            id="inputA"
                            value={inputA}
                            onChange={(e) => setInputA(e.target.value)}
                            placeholder="Enter value A"
                            className="input-field"
                            disabled={calculating}
                            step="any"
                        />
                    </div>

                    <div>
                        <label htmlFor="inputB" className="block text-sm font-medium text-gray-300 mb-2">
                            Value B
                        </label>
                        <input
                            type="number"
                            id="inputB"
                            value={inputB}
                            onChange={(e) => setInputB(e.target.value)}
                            placeholder="Enter value B"
                            className="input-field"
                            disabled={calculating}
                            step="any"
                        />
                    </div>
                </div>


                {error && (
                    <div className="error-message mb-6">
                        {error}
                    </div>
                )}

                {/* Calculate button */}
                <button
                    onClick={handleCalculate}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    disabled={calculating}
                >
                    {calculating ? (
                        <>
                            <div className="spinner" />
                            Calculating...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Calculate
                        </>
                    )}
                </button>

                {/* Warning */}
                <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-amber-200 text-sm">
                            <strong>Important:</strong> You can only click Calculate <strong>once</strong>. After that, you&apos;ll only be able to view the results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
