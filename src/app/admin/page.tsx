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

    // Input Variable management
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

    const updateInputVariable = (taskId: string, varIndex: number, field: keyof TaskVariable, value: string) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                const newVars = [...task.inputVariables];
                newVars[varIndex] = { ...newVars[varIndex], [field]: value };
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

    // Task management
    const addTask = () => {
        if (!config) return;

        const newId = `task-${Date.now()}`;
        setConfig({
            ...config,
            tasks: [
                ...config.tasks,
                {
                    id: newId,
                    name: 'New Task',
                    inputVariables: [],
                    outputVariables: [],
                    equations: [],
                    showingText: '',
                    outputPlaceholders: [],
                    images: [],
                },
            ],
        });
    };

    const removeTask = (taskId: string) => {
        if (!config) return;

        setConfig({
            ...config,
            tasks: config.tasks.filter((t) => t.id !== taskId),
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
                        {refreshing ? 'Refreshing...' : '🔄 Reload from HTML'}
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

            <div style={{ marginBottom: '1.5rem' }}>
                <button onClick={addTask} className="btn btn-success" style={{ width: '100%' }}>
                    ➕ Add New Task
                </button>
            </div>

            {config?.tasks.map((task, index) => (
                <div key={task.id} className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                            Task {index + 1}
                        </h2>
                        <button
                            onClick={() => removeTask(task.id)}
                            style={{
                                background: 'var(--error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            🗑️ Remove Task
                        </button>
                    </div>

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

                    {/* Input Variables - EDITABLE */}
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
                                + Add Variable
                            </button>
                        </div>

                        {task.inputVariables.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                No input variables. Click &quot;Add Variable&quot; to create input fields for the calculation page.
                            </p>
                        )}

                        {task.inputVariables.map((v, varIndex) => (
                            <div key={varIndex} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 120px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name (code)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={v.name}
                                        onChange={(e) => updateInputVariable(task.id, varIndex, 'name', e.target.value)}
                                        placeholder="e.g., delta_l"
                                    />
                                </div>
                                <div style={{ flex: '1 1 150px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Label (display)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={v.label}
                                        onChange={(e) => updateInputVariable(task.id, varIndex, 'label', e.target.value)}
                                        placeholder="e.g., Δl"
                                    />
                                </div>
                                <div style={{ flex: '0 0 80px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={v.unit || ''}
                                        onChange={(e) => updateInputVariable(task.id, varIndex, 'unit', e.target.value)}
                                        placeholder="mm"
                                    />
                                </div>
                                <button
                                    onClick={() => removeInputVariable(task.id, varIndex)}
                                    style={{
                                        background: 'var(--error)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        marginTop: '1.25rem'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Equations */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
                                ➗ Equations ({task.equations.length})
                            </h3>
                            <button
                                onClick={() => addEquation(task.id)}
                                className="btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--success)' }}
                            >
                                + Add Equation
                            </button>
                        </div>

                        {task.equations.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                No equations. Add equations to calculate output values from input variables.
                            </p>
                        )}

                        {task.equations.map((eq, eqIndex) => (
                            <div key={eqIndex} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="input"
                                    style={{ flex: '0 0 150px' }}
                                    value={eq.outputVariable}
                                    onChange={(e) => updateEquation(task.id, eqIndex, 'outputVariable', e.target.value)}
                                    placeholder="output_var"
                                />
                                <span>=</span>
                                <input
                                    type="text"
                                    className="input"
                                    style={{ flex: 1 }}
                                    value={eq.formula}
                                    onChange={(e) => updateEquation(task.id, eqIndex, 'formula', e.target.value)}
                                    placeholder="e.g., sqrt(F * 1000 / sigma_x)"
                                />
                                <button
                                    onClick={() => removeEquation(task.id, eqIndex)}
                                    style={{
                                        background: 'var(--error)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Images */}
                    {task.images.length > 0 && (
                        <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Images:</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {task.images.map((img, i) => (
                                    <img key={i} src={`/examples/${img}`} alt="" style={{ maxWidth: '150px', borderRadius: '4px' }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {(!config?.tasks || config.tasks.length === 0) && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        No tasks configured. Add a new task or reload from HTML examples.
                    </p>
                </div>
            )}
        </main>
    );
}
