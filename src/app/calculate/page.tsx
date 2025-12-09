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

                    {/* Show the task description */}
                    {task.showingText && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6'
                        }}>
                            {task.showingText.replace(/\{\{[^}]+\}\}/g, '____')}
                        </div>
                    )}

                    <div className="input-grid">
                        {task.inputVariables.map((variable) => (
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

            {error && <div className="error-message">{error}</div>}

            <button
                onClick={handleCalculate}
                className="btn btn-success"
                style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem', marginTop: '1rem' }}
                disabled={calculating}
            >
                {calculating ? 'Calculating...' : '🧮 Calculate'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ⚠️ You can only click Calculate once!
            </p>
        </main>
    );
}
