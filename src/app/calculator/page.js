'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { validateCustomerId, saveUserInputs, loadUserInputs, saveCalculationResults } from '@/lib/supabase'
import { calculateTask, validateInputs } from '@/lib/calculator'

// Demo task configuration - this would come from CONFIG JSON in production
const demoTask = {
    id: 'task_1',
    title: 'Igénybevételek számítása',
    description: 'Merev rúd tartós egyensúlyban - kényszererők és igénybevételek számítása',
    inputs: [
        { name: 'a', label: 'a', unit: 'm', defaultValue: '' },
        { name: 'b', label: 'b', unit: 'm', defaultValue: '' },
        { name: 'q1', label: 'q₁', unit: 'kN/m', defaultValue: '' },
        { name: 'F2', label: 'F₂', unit: 'kN', defaultValue: '' },
        { name: 'alpha', label: 'α', unit: '°', defaultValue: '' }
    ],
    outputs: [
        { name: 'FA_x', label: 'F⃗_A x komponens', unit: 'kN', equation: 'F2 * cos(alpha)', decimals: 2 },
        { name: 'FA_y', label: 'F⃗_A y komponens', unit: 'kN', equation: 'q1 * a - F2 * sin(alpha)', decimals: 2 },
        { name: 'FB_y', label: 'F⃗_B y komponens', unit: 'kN', equation: 'q1 * b + F2 * sin(alpha)', decimals: 2 }
    ]
}

export default function CalculatorPage() {
    const router = useRouter()
    const [customerId, setCustomerId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [inputs, setInputs] = useState({})
    const [saveStatus, setSaveStatus] = useState('saved')
    const [calculating, setCalculating] = useState(false)
    const [error, setError] = useState('')
    const saveTimeoutRef = useRef(null)

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedId = sessionStorage.getItem('customerId')

            if (!storedId) {
                router.push('/')
                return
            }

            const { valid, hasCalculated } = await validateCustomerId(storedId)

            if (!valid) {
                sessionStorage.removeItem('customerId')
                router.push('/')
                return
            }

            if (hasCalculated) {
                router.push('/results')
                return
            }

            setCustomerId(storedId)

            // Load saved inputs
            const { inputs: savedInputs } = await loadUserInputs(storedId, demoTask.id)
            if (savedInputs && Object.keys(savedInputs).length > 0) {
                setInputs(savedInputs)
            } else {
                // Initialize with default values
                const defaultInputs = {}
                demoTask.inputs.forEach(input => {
                    defaultInputs[input.name] = input.defaultValue || ''
                })
                setInputs(defaultInputs)
            }

            setLoading(false)
        }

        checkAuth()
    }, [router])

    // Auto-save every 2 seconds when inputs change
    const autoSave = useCallback(async (currentInputs) => {
        if (!customerId) return

        setSaveStatus('saving')
        const result = await saveUserInputs(customerId, demoTask.id, currentInputs)
        setSaveStatus(result.success ? 'saved' : 'error')
    }, [customerId])

    // Handle input change with debounced auto-save
    const handleInputChange = (name, value) => {
        const newInputs = { ...inputs, [name]: value }
        setInputs(newInputs)

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Set new timeout for auto-save (2 seconds)
        saveTimeoutRef.current = setTimeout(() => {
            autoSave(newInputs)
        }, 2000)
    }

    // Handle calculate button
    const handleCalculate = async () => {
        setError('')

        // Validate inputs
        const validation = validateInputs(demoTask.inputs, inputs)
        if (!validation.valid) {
            setError(`Kérjük, töltse ki a következő mezőket: ${validation.missing.join(', ')}`)
            return
        }

        setCalculating(true)

        try {
            // Calculate results
            const results = calculateTask(demoTask, inputs)

            // Save results and mark as calculated
            const saveResult = await saveCalculationResults(customerId, demoTask.id, inputs, results)

            if (!saveResult.success) {
                throw new Error(saveResult.error || 'Failed to save results')
            }

            // Redirect to results page
            router.push('/results')
        } catch (err) {
            console.error('Calculation error:', err)
            setError('Hiba történt a számítás során. Kérjük, próbálja újra.')
            setCalculating(false)
        }
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Statika Kalkulátor</h1>
            </div>

            <div className="que formulas">
                <div className="info">
                    <h3>{demoTask.title}</h3>
                    <div className="state">{demoTask.description}</div>
                </div>

                <div className="content">
                    <div className="qtext">
                        <p>
                            Az ábrán látható merev rúd tartós egyensúlyban van. A koordináta-rendszer origója a rúd baloldali végével esik egybe.
                        </p>
                        <p><strong>Az ismert adatok:</strong></p>
                    </div>

                    <div className="formulaspart">
                        <p>
                            a = <input
                                type="text"
                                className="formulas_number"
                                value={inputs.a || ''}
                                onChange={(e) => handleInputChange('a', e.target.value)}
                                placeholder="?"
                            /> m,
                            b = <input
                                type="text"
                                className="formulas_number"
                                value={inputs.b || ''}
                                onChange={(e) => handleInputChange('b', e.target.value)}
                                placeholder="?"
                            /> m
                        </p>
                        <p>
                            q₁ = <input
                                type="text"
                                className="formulas_number"
                                value={inputs.q1 || ''}
                                onChange={(e) => handleInputChange('q1', e.target.value)}
                                placeholder="?"
                            /> kN/m,
                            F₂ = <input
                                type="text"
                                className="formulas_number"
                                value={inputs.F2 || ''}
                                onChange={(e) => handleInputChange('F2', e.target.value)}
                                placeholder="?"
                            /> kN,
                            α = <input
                                type="text"
                                className="formulas_number"
                                value={inputs.alpha || ''}
                                onChange={(e) => handleInputChange('alpha', e.target.value)}
                                placeholder="?"
                            /> °
                        </p>
                    </div>

                    {demoTask.outputs.map((output, idx) => (
                        <div key={idx} className="formulaspart">
                            <p>
                                <strong>{output.label}:</strong>{' '}
                                <input
                                    type="text"
                                    className="formulas_number"
                                    disabled
                                    placeholder="[Eredmény]"
                                /> {output.unit}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="calculate-container">
                <button
                    className="btn btn-success btn-lg"
                    onClick={handleCalculate}
                    disabled={calculating}
                >
                    {calculating ? 'Számítás folyamatban...' : 'Számítás'}
                </button>
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                    Figyelem: A számítás gombra csak egyszer kattinthat!
                </p>
            </div>

            {/* Auto-save indicator */}
            <div className={`autosave-indicator ${saveStatus}`}>
                {saveStatus === 'saving' && '💾 Mentés...'}
                {saveStatus === 'saved' && '✓ Mentve'}
                {saveStatus === 'error' && '⚠ Mentési hiba'}
            </div>
        </div>
    )
}
