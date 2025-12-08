'use client';

import { useState, useEffect } from 'react';
import type { TaskConfig, ConfigData } from '@/types';

export default function AdminPage() {
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return (
            <main className="container" style={{ paddingTop: '2rem' }}>
                <p>Loading configuration...</p>
            </main>
        );
    }

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                    ⚙️ Admin Configuration
                </h1>
                <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : '💾 Save Config'}
                </button>
            </div>

            {message && (
                <div className={message.includes('success') ? 'success-message' : 'error-message'} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', background: message.includes('success') ? 'var(--success-bg)' : 'var(--error-bg)', color: message.includes('success') ? '#166534' : 'var(--error)' }}>
                    {message}
                </div>
            )}

            {config?.tasks.map((task, index) => (
                <div key={task.id} className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        Task {index + 1}: {task.name}
                    </h2>

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
                        <label className="input-label">Showing Text (use {'{{variable}}'} for output placeholders)</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={task.showingText}
                            onChange={(e) => updateTask(task.id, 'showingText', e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                        Input Variables
                    </h3>
                    <div className="input-grid" style={{ marginBottom: '1.5rem' }}>
                        {task.inputVariables.map((v, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
                                <span style={{ fontWeight: '500' }}>{v.label}</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({v.name})</span>
                                {v.unit && <span style={{ color: 'var(--primary)' }}> [{v.unit}]</span>}
                            </div>
                        ))}
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                        Equations
                    </h3>
                    {task.equations.map((eq, eqIndex) => (
                        <div key={eqIndex} style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                className="input"
                                style={{ flex: '0 0 120px' }}
                                value={eq.outputVariable}
                                onChange={(e) => updateEquation(task.id, eqIndex, 'outputVariable', e.target.value)}
                                placeholder="Variable"
                            />
                            <span>=</span>
                            <input
                                type="text"
                                className="input"
                                style={{ flex: 1 }}
                                value={eq.formula}
                                onChange={(e) => updateEquation(task.id, eqIndex, 'formula', e.target.value)}
                                placeholder="Formula (e.g., a * b + c)"
                            />
                        </div>
                    ))}
                </div>
            ))}
        </main>
    );
}
