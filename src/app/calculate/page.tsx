'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskConfig } from '@/types';

export default function CalculatePage() {
    const [tasks, setTasks] = useState<TaskConfig[]>([]);
    // Store inputs as strings to preserve leading zeros (e.g., "0.123")
    const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
    // Track which fields have validation errors
    const [inputErrors, setInputErrors] = useState<Record<string, Record<string, string>>>({});
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const router = useRouter();

    // Load customer ID and check access
    useEffect(() => {
        const id = sessionStorage.getItem('customerId');
        if (!id) {
            router.push('/');
            return;
        }
        setCustomerId(id);

        // Verify access and load data
        fetch('/api/validate-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: id }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.hasCalculated) {
                    router.push('/results');
                    return;
                }
                loadConfig();
                loadSavedInputs(id);
            })
            .catch(() => router.push('/'));
    }, [router]);

    const loadConfig = async () => {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (err) {
            console.error('Failed to load config:', err);
        }
        setLoading(false);
    };

    const loadSavedInputs = async (id: string) => {
        try {
            const res = await fetch(`/api/save-inputs?customerId=${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.taskInputs) {
                    setInputs(data.taskInputs);
                }
            }
        } catch (err) {
            console.error('Failed to load saved inputs:', err);
        }
    };


    // Check if any input has validation errors
    const hasValidationErrors = useCallback(() => {
        for (const taskId in inputErrors) {
            for (const variable in inputErrors[taskId]) {
                if (inputErrors[taskId][variable]) {
                    return true;
                }
            }
        }
        return false;
    }, [inputErrors]);

    // Check if all required inputs are filled
    const getMissingInputs = useCallback(() => {
        const missing: { taskName: string; variableLabel: string }[] = [];

        for (const task of tasks) {
            for (const variable of task.inputVariables) {
                const value = inputs[task.id]?.[variable.name];
                // Check if value is empty or undefined
                if (value === undefined || value === '' || value === null) {
                    missing.push({
                        taskName: task.name,
                        variableLabel: variable.label,
                    });
                }
            }
        }

        return missing;
    }, [tasks, inputs]);

    // Check if all inputs are filled (for button enable/disable)
    const allInputsFilled = useCallback(() => {
        return getMissingInputs().length === 0;
    }, [getMissingInputs]);

    // Convert string inputs to numeric format for saving/calculating
    const getNumericInputs = useCallback(() => {
        const numericInputs: Record<string, Record<string, number>> = {};
        for (const taskId in inputs) {
            numericInputs[taskId] = {};
            for (const variable in inputs[taskId]) {
                const value = inputs[taskId][variable];
                numericInputs[taskId][variable] = value === '' ? 0 : parseFloat(value) || 0;
            }
        }
        return numericInputs;
    }, [inputs]);

    // Autosave every 2 seconds (only if no validation errors)
    const saveInputs = useCallback(async () => {
        if (!customerId || Object.keys(inputs).length === 0 || hasValidationErrors()) return;

        try {
            await fetch('/api/save-inputs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    taskInputs: getNumericInputs(),
                }),
            });
            setLastSaved(new Date());
        } catch (err) {
            console.error('Autosave failed:', err);
        }
    }, [customerId, inputs, hasValidationErrors, getNumericInputs]);

    useEffect(() => {
        const interval = setInterval(saveInputs, 2000);
        return () => clearInterval(interval);
    }, [saveInputs]);

    // Validate input value - only allow digits and one decimal point
    const validateInputValue = (value: string): { isValid: boolean; error: string } => {
        if (value === '' || value === '-') {
            return { isValid: true, error: '' };
        }

        // Check for comma (European decimal separator)
        if (value.includes(',')) {
            return {
                isValid: false,
                error: '⚠️ Tizedes PONT-ot használj, NEM vesszőt! (Dolgozatban is pont kell!)'
            };
        }

        // Check for invalid characters (letters or other symbols)
        // Allow: digits, dot, minus sign at start
        const validPattern = /^-?\d*\.?\d*$/;
        if (!validPattern.test(value)) {
            return {
                isValid: false,
                error: '⚠️ Csak számokat és tizedespontot használhatsz!'
            };
        }

        return { isValid: true, error: '' };
    };

    // Handle keydown to prevent typing invalid characters
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter, arrow keys
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (allowedKeys.includes(e.key)) {
            return;
        }

        // Allow Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }

        // Block comma and letters - only allow digits, dot, and minus
        const allowedChars = /^[\d.\-]$/;
        if (!allowedChars.test(e.key)) {
            e.preventDefault();

            // Show specific warning for comma
            if (e.key === ',') {
                const taskId = (e.target as HTMLInputElement).dataset.taskid || '';
                const variable = (e.target as HTMLInputElement).dataset.variable || '';
                setInputErrors((prev) => ({
                    ...prev,
                    [taskId]: {
                        ...prev[taskId],
                        [variable]: '⚠️ Tizedes PONT-ot használj, NEM vesszőt! (Dolgozatban is pont kell!)',
                    },
                }));
                // Clear warning after 4 seconds
                setTimeout(() => {
                    setInputErrors((prev) => ({
                        ...prev,
                        [taskId]: {
                            ...prev[taskId],
                            [variable]: '',
                        },
                    }));
                }, 4000);
            }
        }
    };

    const handleInputChange = (taskId: string, variable: string, value: string) => {
        // Validate the input value
        const validation = validateInputValue(value);

        // Update error state
        setInputErrors((prev) => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [variable]: validation.error,
            },
        }));

        // Always update the input (so user can see what they typed and fix it)
        setInputs((prev) => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [variable]: value,
            },
        }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>, taskId: string, variable: string) => {
        const value = e.target.value;
        const validation = validateInputValue(value);

        // If there's a validation error (comma or invalid chars), prevent blur
        if (!validation.isValid) {
            e.preventDefault();
            e.target.focus();
            setInputErrors((prev) => ({
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    [variable]: validation.error,
                },
            }));
        }
    };

    const handleCalculate = async () => {
        if (!customerId) return;

        // Don't allow calculation if there are validation errors
        if (hasValidationErrors()) {
            setError('Javítsd ki a hibás mezőket a számítás előtt!');
            return;
        }

        // Don't allow calculation if not all inputs are filled
        const missing = getMissingInputs();
        if (missing.length > 0) {
            const missingList = missing.slice(0, 5).map(m => `${m.taskName}: ${m.variableLabel}`).join(', ');
            const extraCount = missing.length > 5 ? ` (+${missing.length - 5} további)` : '';
            setError(`Hiányzó értékek: ${missingList}${extraCount}`);
            return;
        }

        setCalculating(true);
        setError('');
        setShowConfirmation(false);

        try {
            const res = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    taskInputs: getNumericInputs(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Calculation failed');
                return;
            }

            // Redirect to results
            router.push('/results');
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setCalculating(false);
        }
    };

    if (loading) {
        return (
            <main className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <p>Loading tasks...</p>
            </main>
        );
    }

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                    Calculation Tasks
                </h1>
                <div className="autosave-indicator">
                    <span className="autosave-dot" />
                    {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Autosave enabled'}
                </div>
            </div>

            {tasks.map((task, index) => (
                <div key={task.id} className="task-container fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <h2 className="task-title">
                        {index + 1}. {task.name}
                    </h2>

                    {task.images && task.images.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            {task.images.map((img) => (
                                <img
                                    key={img}
                                    src={img.startsWith('/') ? img : `/examples/${img}`}
                                    alt={task.name}
                                    className="task-image"
                                    style={{ maxWidth: '400px' }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Hint section */}
                    {task.hint && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '8px',
                            borderLeft: '4px solid #f59e0b',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <strong>💡 Hint:</strong> {task.hint}
                        </div>
                    )}



                    <div className="input-grid">
                        {[...task.inputVariables].reverse().map((variable) => (
                            <div key={variable.name} className="input-group">
                                <label className="input-label" htmlFor={`${task.id}-${variable.name}`}>
                                    {variable.label} {variable.unit && `(${variable.unit})`}
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    id={`${task.id}-${variable.name}`}
                                    className={`input ${inputErrors[task.id]?.[variable.name] ? 'input-error' : ''}`}
                                    placeholder="0"
                                    value={inputs[task.id]?.[variable.name] ?? ''}
                                    data-taskid={task.id}
                                    data-variable={variable.name}
                                    onKeyDown={handleKeyDown}
                                    onChange={(e) => handleInputChange(task.id, variable.name, e.target.value)}
                                    onBlur={(e) => handleBlur(e, task.id, variable.name)}
                                />
                                {inputErrors[task.id]?.[variable.name] && (
                                    <span className="input-warning">
                                        {inputErrors[task.id][variable.name]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}


            {error && <div className="error-message">{error}</div>}

            {showConfirmation && (
                <div style={{
                    position: 'fixed',
                    inset: '0',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1f2937',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        margin: '1rem'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>⚠️ FIGYELEM!</h2>
                        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            Ez a művelet <strong>VISSZAVONHATATLAN</strong>!<br />
                            Csak EGYSZER számolhatsz minden feladattal.<br />
                            Biztosan folytatod?
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="btn"
                                style={{ flex: 1, background: 'var(--border-color)' }}
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleCalculate}
                                className="btn btn-success"
                                style={{ flex: 1 }}
                                disabled={calculating}
                            >
                                {calculating ? 'Számol...' : 'Igen, számolok!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setShowConfirmation(true)}
                className="btn btn-success"
                style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem', marginTop: '1rem' }}
                disabled={calculating || !allInputsFilled() || hasValidationErrors()}
            >
                {!allInputsFilled()
                    ? `⚠️ Hiányzik ${getMissingInputs().length} érték`
                    : '🧮 Számolás indítása (CSAK 1x!)'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: '600' }}>
                ⚠️ FIGYELEM: Ez a művelet VISSZAVONHATATLAN! Csak EGYSZER számolhatsz!
            </p>
        </main>
    );
}
