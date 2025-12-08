'use client';

import { useState, useEffect } from 'react';
import type { TaskConfig, ConfigData } from '@/types';

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
                // Reload the config
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
                <div style={{ display: 'flex', gap: '1rem' }}>
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

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    💡 <strong>Dynamic Loading:</strong> Tasks are automatically parsed from HTML files in the <code>examples/</code> folder.
                    Click &quot;Reload from HTML&quot; to refresh after adding new example files.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    📊 <strong>Currently loaded:</strong> {config?.tasks.length || 0} tasks from HTML examples
                </p>
            </div>

            {config?.tasks.map((task, index) => (
                <div key={task.id} className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                            Task {index + 1}: {task.name}
                        </h2>
                        <span style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(37, 99, 235, 0.2)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: 'var(--primary)'
                        }}>
                            ID: {task.id}
                        </span>
                    </div>

                    {/* Images from parsed HTML */}
                    {task.images.length > 0 && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Images:</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {task.images.map((img, i) => (
                                    <img key={i} src={`/examples/${img}`} alt="" style={{ maxWidth: '200px', borderRadius: '4px' }} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">Task Name</label>
                        <input
                            type="text"
                            className="input"
                            value={task.name}
                            onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">
                            Showing Text (use {'{{variable_name}}'} for output placeholders)
                        </label>
                        <textarea
                            className="input"
                            rows={4}
                            value={task.showingText}
                            onChange={(e) => updateTask(task.id, 'showingText', e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Parsed Input Variables (read-only display) */}
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                        📥 Detected Input Variables ({task.inputVariables.length})
                    </h3>
                    <div className="input-grid" style={{ marginBottom: '1.5rem' }}>
                        {task.inputVariables.map((v, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                                <div style={{ fontWeight: '500' }}>{v.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    name: <code>{v.name}</code>
                                    {v.unit && <span style={{ marginLeft: '0.5rem' }}>unit: <code>{v.unit}</code></span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Equations - editable */}
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
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            No equations defined yet. Add equations to calculate output values from inputs.
                        </p>
                    )}

                    {task.equations.map((eq, eqIndex) => (
                        <div key={eqIndex} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'center' }}>
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
            ))}

            {(!config?.tasks || config.tasks.length === 0) && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        No tasks found. Add HTML example files to the <code>examples/</code> folder and click &quot;Reload from HTML&quot;.
                    </p>
                    <button onClick={handleRefresh} className="btn btn-primary">
                        🔄 Reload from HTML
                    </button>
                </div>
            )}
        </main>
    );
}
