'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { validateCustomerId, saveUserInputs, loadUserInputs, saveCalculationResults } from '@/lib/supabase'
import { calculateTask, validateInputs } from '@/lib/calculator'

export default function CalculatorPage() {
    const router = useRouter()
    const [customerId, setCustomerId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState([])
    const [selectedTask, setSelectedTask] = useState(null)
    const [taskHtml, setTaskHtml] = useState('')
    const [taskConfig, setTaskConfig] = useState(null)
    const [inputs, setInputs] = useState({})
    const [results, setResults] = useState(null)
    const [saveStatus, setSaveStatus] = useState('saved')
    const [calculating, setCalculating] = useState(false)
    const [error, setError] = useState('')
    const saveTimeoutRef = useRef(null)
    const contentRef = useRef(null)

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

            // Load all tasks dynamically
            const res = await fetch('/api/tasks')
            const data = await res.json()
            setTasks(data.tasks || [])

            setLoading(false)
        }

        checkAuth()
    }, [router])

    // Load specific task when selected
    const loadTask = async (taskId) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/tasks/${taskId}`)
            const data = await res.json()

            setSelectedTask(data)
            setTaskHtml(data.html)
            setTaskConfig(data.config)

            // Load saved inputs for this task
            const { inputs: savedInputs } = await loadUserInputs(customerId, taskId)
            setInputs(savedInputs || {})
            setResults(null)

            setLoading(false)
        } catch (err) {
            console.error('Error loading task:', err)
            setError('Failed to load task')
            setLoading(false)
        }
    }

    // Auto-save every 2 seconds when inputs change
    const autoSave = useCallback(async (currentInputs) => {
        if (!customerId || !selectedTask) return

        setSaveStatus('saving')
        const result = await saveUserInputs(customerId, selectedTask.id, currentInputs)
        setSaveStatus(result.success ? 'saved' : 'error')
    }, [customerId, selectedTask])

    // Handle input change with debounced auto-save
    const handleInputChange = (fieldId, value) => {
        const newInputs = { ...inputs, [fieldId]: value }
        setInputs(newInputs)

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
            autoSave(newInputs)
        }, 2000)
    }

    // Handle calculate button
    const handleCalculate = async () => {
        if (!selectedTask || !taskConfig) {
            setError('Please select a task first')
            return
        }

        setError('')

        // Validate inputs based on config
        if (taskConfig.inputs && taskConfig.inputs.length > 0) {
            const validation = validateInputs(taskConfig.inputs, inputs)
            if (!validation.valid) {
                setError(`Kérjük, töltse ki a következő mezőket: ${validation.missing.join(', ')}`)
                return
            }
        }

        setCalculating(true)

        try {
            // Calculate results
            const calculatedResults = calculateTask(taskConfig, inputs)

            // Save results and mark as calculated
            const saveResult = await saveCalculationResults(
                customerId,
                selectedTask.id,
                inputs,
                calculatedResults
            )

            if (!saveResult.success) {
                throw new Error(saveResult.error || 'Failed to save results')
            }

            setResults(calculatedResults)
            router.push('/results')
        } catch (err) {
            console.error('Calculation error:', err)
            setError('Hiba történt a számítás során. Kérjük, próbálja újra.')
            setCalculating(false)
        }
    }

    // Process HTML to inject interactive inputs
    const processHtml = (html) => {
        if (!html) return { __html: '' }

        // Fix image paths to point to API
        let processed = html.replace(
            /src="(img_\d+\.jpg)"/g,
            `src="/api/tasks/${selectedTask?.id}/image/$1"`
        )

        return { __html: processed }
    }

    // Attach event listeners to input fields after HTML is rendered
    useEffect(() => {
        if (!contentRef.current || !selectedTask) return

        // Find all formulas_number and formulas_unit inputs
        const inputFields = contentRef.current.querySelectorAll('input.formulas_number, input.formulas_unit')

        inputFields.forEach((input, index) => {
            const fieldId = input.id || input.name || `field_${index}`

            // Set value from saved inputs
            if (inputs[fieldId]) {
                input.value = inputs[fieldId]
            }

            // If we have results and this is a result field, show result
            if (results && taskConfig?.outputs) {
                const output = taskConfig.outputs.find(o => o.fieldId === fieldId)
                if (output && results[output.name] !== undefined) {
                    input.value = results[output.name]
                    input.disabled = true
                    input.style.backgroundColor = '#d4edda'
                    input.style.border = '2px solid #198754'
                    input.style.fontWeight = 'bold'
                }
            }

            // Add change listener for input fields (not result fields)
            const isResultField = taskConfig?.outputs?.some(o => o.fieldId === fieldId)
            if (!isResultField) {
                input.addEventListener('input', (e) => {
                    handleInputChange(fieldId, e.target.value)
                })
            }
        })

        return () => {
            // Cleanup listeners
            const inputFields = contentRef.current?.querySelectorAll('input.formulas_number, input.formulas_unit')
            inputFields?.forEach(input => {
                input.removeEventListener('input', () => { })
            })
        }
    }, [selectedTask, taskHtml, inputs, results, taskConfig])

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    // Task selection view
    if (!selectedTask) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1>Válasszon feladatot</h1>
                </div>

                <div className="task-list">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="task-card"
                            onClick={() => loadTask(task.id)}
                        >
                            <h3>{task.title}</h3>
                            <p>Kattintson a feladat megnyitásához</p>
                        </div>
                    ))}
                </div>

                {tasks.length === 0 && (
                    <div className="alert alert-info">
                        Nincsenek elérhető feladatok.
                    </div>
                )}
            </div>
        )
    }

    // Task view with injected inputs
    return (
        <div className="page-container">
            <div className="page-header">
                <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedTask(null)}
                    style={{ marginBottom: '1rem' }}
                >
                    ← Vissza a feladatokhoz
                </button>
                <h1>{selectedTask.title}</h1>
            </div>

            {/* Render the original HTML with dynamic inputs */}
            <div
                ref={contentRef}
                className="task-content"
                dangerouslySetInnerHTML={processHtml(taskHtml)}
            />

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
