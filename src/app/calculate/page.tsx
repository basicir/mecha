'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskConfig } from '@/types';

export default function CalculatePage() {
    const [tasks, setTasks] = useState<TaskConfig[]>([]);
    const [inputs, setInputs] = useState<Record<string, Record<string, number>>>({});
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [decimalWarning, setDecimalWarning] = useState('');
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

    // Autosave every 2 seconds
    const saveInputs = useCallback(async () => {
        if (!customerId || Object.keys(inputs).length === 0) return;

        try {
            await fetch('/api/save-inputs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    taskInputs: inputs,
                }),
            });
            setLastSaved(new Date());
        } catch (err) {
            console.error('Autosave failed:', err);
        }
    }, [customerId, inputs]);

    useEffect(() => {
        const interval = setInterval(saveInputs, 2000);
        return () => clearInterval(interval);
    }, [saveInputs]);

    const handleInputChange = (taskId: string, variable: string, value: string) => {
        // Check for decimal comma
        if (value.includes(',')) {
            setDecimalWarning('⚠️ FIGYELEM! Tizedes PONT-ot használj, NEM vesszőt! (pl: 3.14) - Dolgozatban is így!');
            setTimeout(() => setDecimalWarning(''), 5000);
            return;
        }
        setDecimalWarning('');
        const numValue = parseFloat(value) || 0;
        setInputs((prev) => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [variable]: numValue,
            },
        }));
    };

    const handleCalculate = async () => {
        if (!customerId) return;

        setCalculating(true);
        setError('');
        setShowConfirmation(false);

        try {
            const res = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    taskInputs: inputs,
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



                    <div className="input-grid">
                        {[...task.inputVariables].reverse().map((variable) => (
                            <div key={variable.name} className="input-group">
                                <label className="input-label" htmlFor={`${task.id}-${variable.name}`}>
                                    {variable.label} {variable.unit && `(${variable.unit})`}
                                </label>
                                <input
                                    type="number"
                                    id={`${task.id}-${variable.name}`}
                                    className="input"
                                    step="any"
                                    placeholder="0"
                                    value={inputs[task.id]?.[variable.name] || ''}
                                    onChange={(e) => handleInputChange(task.id, variable.name, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {decimalWarning && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '8px',
                    fontWeight: '600',
                    textAlign: 'center'
                }}>
                    {decimalWarning}
                </div>
            )}

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
                disabled={calculating}
            >
                🧮 Számolás indítása (CSAK 1x!)
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: '600' }}>
                ⚠️ FIGYELEM: Ez a művelet VISSZAVONHATATLAN! Csak EGYSZER számolhatsz!
            </p>
        </main>
    );
}
