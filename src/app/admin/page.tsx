'use client';

import { useState, useEffect } from 'react';
import type { TaskConfig, ConfigData, TaskVariable } from '@/types';

export default function AdminPage() {
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            setConfig(data);
        } catch (err) {
            console.error('Failed to load config:', err);
        }
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/refresh', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setMessage(`Refreshed! Found ${data.taskCount} tasks from HTML examples.`);
                await loadConfig();
            } else {
                setMessage('Failed to refresh from examples');
            }
        } catch (err) {
            setMessage('Error refreshing configuration');
        }
        setRefreshing(false);
    };

    const handleSave = async () => {
        if (!config) return;

        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                setMessage('Configuration saved successfully!');
            } else {
                setMessage('Failed to save configuration');
            }
        } catch (err) {
            setMessage('Error saving configuration');
        }
        setSaving(false);
    };

    const updateTask = (taskId: string, field: keyof TaskConfig, value: unknown) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) =>
                task.id === taskId ? { ...task, [field]: value } : task
            ),
        });
    };

    // Input Variable management - only name field
    const addInputVariable = (taskId: string) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return {
                    ...task,
                    inputVariables: [
                        ...task.inputVariables,
                        { name: '', label: '', unit: '' },
                    ],
                };
            }),
        });
    };

    const updateInputVariableName = (taskId: string, varIndex: number, name: string) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                const newVars = [...task.inputVariables];
                newVars[varIndex] = { ...newVars[varIndex], name, label: name };
                return { ...task, inputVariables: newVars };
            }),
        });
    };

    const removeInputVariable = (taskId: string, varIndex: number) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return {
                    ...task,
                    inputVariables: task.inputVariables.filter((_, i) => i !== varIndex),
                };
            }),
        });
    };

    // Equation management
    const addEquation = (taskId: string) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return {
                    ...task,
                    equations: [...task.equations, { outputVariable: '', formula: '' }],
                };
            }),
        });
    };

    const updateEquation = (taskId: string, eqIndex: number, field: 'outputVariable' | 'formula', value: string) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                const newEquations = [...task.equations];
                newEquations[eqIndex] = { ...newEquations[eqIndex], [field]: value };
                return { ...task, equations: newEquations };
            }),
        });
    };

    const removeEquation = (taskId: string, eqIndex: number) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return {
                    ...task,
                    equations: task.equations.filter((_, i) => i !== eqIndex),
                };
            }),
        });
    };

    if (loading) {
        return (
            <main className="container" style={{ paddingTop: '2rem' }}>
                <p>Loading configuration...</p>
            </main>
        );
    }

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                    ⚙️ Admin Configuration
                </h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleRefresh}
                        className="btn"
                        style={{ background: 'var(--border-color)' }}
                        disabled={refreshing}
                    >
                        {refreshing ? 'Refreshing...' : '🔄 Reload Tasks from HTML'}
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : '💾 Save Config'}
                    </button>
                </div>
            </div>

            {message && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: message.includes('success') || message.includes('Found') ? 'var(--success-bg)' : 'var(--error-bg)',
                    color: message.includes('success') || message.includes('Found') ? '#166534' : 'var(--error)'
                }}>
                    {message}
                </div>
            )}

            {config?.tasks.map((task, index) => (
                <div key={task.id} className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Task {index + 1}
                    </h2>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">Task Name</label>
                        <input
                            type="text"
                            className="input"
                            value={task.name}
                            onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                            placeholder="e.g., Prizmatikus rúd megnyúlása"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">
                            Showing Text (use {'{{variable_name}}'} for output placeholders)
                        </label>
                        <textarea
                            className="input"
                            rows={3}
                            value={task.showingText}
                            onChange={(e) => updateTask(task.id, 'showingText', e.target.value)}
                            placeholder="e.g., A rúd terheletlen hossza l₀ = {{l0}} mm."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Input Variables - only name */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
                                📥 Input Variables ({task.inputVariables.length})
                            </h3>
                            <button
                                onClick={() => addInputVariable(task.id)}
                                className="btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--primary)' }}
                            >
                                + Add
                            </button>
                        </div>

                        {task.inputVariables.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                No input variables defined.
                            </p>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {task.inputVariables.map((v, varIndex) => (
                                <div key={varIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <input
                                        type="text"
                                        className="input"
                                        style={{ width: '120px' }}
                                        value={v.name}
                                        onChange={(e) => updateInputVariableName(task.id, varIndex, e.target.value)}
                                        placeholder="var_name"
                                    />
                                    <button
                                        onClick={() => removeInputVariable(task.id, varIndex)}
                                        style={{
                                            background: 'var(--error)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '0.4rem 0.6rem',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Equations */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
                                ➗ Equations ({task.equations.length})
                            </h3>
                            <button
                                onClick={() => addEquation(task.id)}
                                className="btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--success)' }}
                            >
                                + Add
                            </button>
                        </div>

                        {task.equations.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                No equations defined.
                            </p>
                        )}

                        {task.equations.map((eq, eqIndex) => (
                            <div key={eqIndex} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="input"
                                    style={{ width: '120px' }}
                                    value={eq.outputVariable}
                                    onChange={(e) => updateEquation(task.id, eqIndex, 'outputVariable', e.target.value)}
                                    placeholder="output"
                                />
                                <span>=</span>
                                <input
                                    type="text"
                                    className="input"
                                    style={{ flex: 1 }}
                                    value={eq.formula}
                                    onChange={(e) => updateEquation(task.id, eqIndex, 'formula', e.target.value)}
                                    placeholder="formula"
                                />
                                <button
                                    onClick={() => removeEquation(task.id, eqIndex)}
                                    style={{
                                        background: 'var(--error)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.4rem 0.6rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {(!config?.tasks || config.tasks.length === 0) && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        No tasks. Add HTML files to the examples/ folder and click &quot;Reload Tasks from HTML&quot;.
                    </p>
                </div>
            )}
        </main>
    );
}
