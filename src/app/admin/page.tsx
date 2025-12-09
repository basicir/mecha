'use client';

import { useState, useEffect, useRef } from 'react';
import type { TaskConfig, ConfigData, TaskVariable, TaskEquation } from '@/types';

// Function definitions with hints
const FUNCTION_BUTTONS = [
    { name: 'GYÖK', insert: 'GYÖK()', hint: 'GYÖK(szám) - Négyzetgyök' },
    { name: 'HATVÁNY', insert: 'HATVÁNY(;)', hint: 'HATVÁNY(alap;kitevő) - Hatványozás' },
    { name: 'HA', insert: 'HA(;;)', hint: 'HA(feltétel;igaz_érték;hamis_érték)' },
    { name: 'PI', insert: 'PI()', hint: 'PI() - π értéke (3.14159...)' },
    { name: 'SIN', insert: 'SIN()', hint: 'SIN(szög_radiánban)' },
    { name: 'COS', insert: 'COS()', hint: 'COS(szög_radiánban)' },
    { name: 'TAN', insert: 'TAN()', hint: 'TAN(szög_radiánban)' },
    { name: 'RADIÁN', insert: 'RADIÁN()', hint: 'RADIÁN(fok) - Fokból radián' },
    { name: 'ABS', insert: 'ABS()', hint: 'ABS(szám) - Abszolút érték' },
    { name: 'MIN', insert: 'MIN(;)', hint: 'MIN(szám1;szám2;...) - Minimum' },
    { name: 'MAX', insert: 'MAX(;)', hint: 'MAX(szám1;szám2;...) - Maximum' },
];

const BRACKET_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#eab308'];

function highlightBrackets(formula: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let depth = 0;
    let i = 0;
    for (const char of formula) {
        if (char === '(') {
            const color = BRACKET_COLORS[depth % BRACKET_COLORS.length];
            result.push(<span key={i} style={{ color, fontWeight: 'bold' }}>{char}</span>);
            depth++;
        } else if (char === ')') {
            depth--;
            const color = BRACKET_COLORS[Math.max(0, depth) % BRACKET_COLORS.length];
            result.push(<span key={i} style={{ color, fontWeight: 'bold' }}>{char}</span>);
        } else {
            result.push(<span key={i}>{char}</span>);
        }
        i++;
    }
    return result;
}

// ShowingText editor with output variable insert buttons
interface ShowingTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    outputVariables: string[]; // Output variable names from equations
}

function ShowingTextEditor({ value, onChange, outputVariables }: ShowingTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const newValue = value.substring(0, start) + text + value.substring(end);

        onChange(newValue);

        requestAnimationFrame(() => {
            const cursorPos = start + text.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.focus();
        });
    };

    return (
        <div>
            <textarea
                ref={textareaRef}
                className="input"
                rows={5}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />

            {/* Output variable insert buttons */}
            {outputVariables.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                        📤 Output beszúrása:
                    </span>
                    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {outputVariables.map((varName) => (
                            <button
                                key={varName}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    insertAtCursor(`{{${varName}}}`);
                                }}
                                style={{
                                    background: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {`{{${varName}}}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {outputVariables.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    💡 Adj hozzá equation-öket, hogy itt megjelenjenek az output változó gombok
                </p>
            )}
        </div>
    );
}

// Formula editor
interface FormulaEditorProps {
    value: string;
    onChange: (value: string) => void;
    variables: TaskVariable[];
    placeholder?: string;
}

function FormulaEditor({ value, onChange, variables, placeholder }: FormulaEditorProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [hoveredFunc, setHoveredFunc] = useState<string | null>(null);

    const insertAtCursor = (text: string) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newValue = value.substring(0, start) + text + value.substring(end);

        onChange(newValue);

        requestAnimationFrame(() => {
            const cursorPos = start + text.length;
            if (text.includes('()')) {
                input.setSelectionRange(cursorPos - 1, cursorPos - 1);
            } else if (text.includes('(;)') || text.includes('(;;)')) {
                input.setSelectionRange(start + text.indexOf('(') + 1, start + text.indexOf('(') + 1);
            } else {
                input.setSelectionRange(cursorPos, cursorPos);
            }
            input.focus();
        });
    };

    return (
        <div>
            {value && (
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', marginBottom: '0.5rem', overflowX: 'auto' }}>
                    ={highlightBrackets(value)}
                </div>
            )}

            <input
                ref={inputRef}
                type="text"
                className="input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ fontFamily: 'monospace' }}
            />

            {variables.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Változók:</span>
                    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {variables.map((v) => (
                            <button
                                key={v.name}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); insertAtCursor(v.name); }}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace' }}
                            >
                                {v.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Függvények:</span>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {FUNCTION_BUTTONS.map((func) => (
                        <button
                            key={func.name}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); insertAtCursor(func.insert); }}
                            onMouseEnter={() => setHoveredFunc(func.name)}
                            onMouseLeave={() => setHoveredFunc(null)}
                            style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                            {func.name}
                        </button>
                    ))}
                </div>
            </div>

            {hoveredFunc && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    💡 {FUNCTION_BUTTONS.find(f => f.name === hoveredFunc)?.hint}
                </div>
            )}
        </div>
    );
}

export default function AdminPage() {
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => { loadConfig(); }, []);

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
                setMessage(`Refreshed! Found ${data.taskCount} tasks.`);
                await loadConfig();
            } else {
                setMessage('Failed to refresh');
            }
        } catch (err) {
            setMessage('Error refreshing');
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
                setMessage('Saved!');
            } else {
                setMessage('Save failed');
            }
        } catch (err) {
            setMessage('Error saving');
        }
        setSaving(false);
    };

    const updateTask = (taskId: string, field: keyof TaskConfig, value: unknown) => {
        if (!config) return;
        setConfig({
            ...config,
            tasks: config.tasks.map((task) => task.id === taskId ? { ...task, [field]: value } : task),
        });
    };

    const addInputVariable = (taskId: string) => {
        if (!config) return;
        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return { ...task, inputVariables: [...task.inputVariables, { name: '', label: '', unit: '' }] };
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
                return { ...task, inputVariables: task.inputVariables.filter((_, i) => i !== varIndex) };
            }),
        });
    };

    const addEquation = (taskId: string) => {
        if (!config) return;
        setConfig({
            ...config,
            tasks: config.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return { ...task, equations: [...task.equations, { outputVariable: '', formula: '' }] };
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
                return { ...task, equations: task.equations.filter((_, i) => i !== eqIndex) };
            }),
        });
    };

    // Get output variable names from equations
    const getOutputVariables = (equations: TaskEquation[]): string[] => {
        return equations.map(eq => eq.outputVariable).filter(name => name.trim() !== '');
    };

    if (loading) {
        return <main className="container" style={{ paddingTop: '2rem' }}><p>Loading...</p></main>;
    }

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>⚙️ Admin</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleRefresh} className="btn" style={{ background: 'var(--border-color)' }} disabled={refreshing}>
                        {refreshing ? '...' : '🔄 Reload'}
                    </button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                        {saving ? '...' : '💾 Save'}
                    </button>
                </div>
            </div>

            {message && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: message.includes('!') ? 'var(--success-bg)' : 'var(--error-bg)', color: message.includes('!') ? '#166534' : 'var(--error)' }}>
                    {message}
                </div>
            )}

            {config?.tasks.map((task, index) => (
                <div key={task.id} className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Task {index + 1}</h2>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">Task Name</label>
                        <input type="text" className="input" value={task.name} onChange={(e) => updateTask(task.id, 'name', e.target.value)} />
                    </div>

                    {/* Input Variables */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>📥 Input Variables ({task.inputVariables.length})</h3>
                            <button onClick={() => addInputVariable(task.id)} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--primary)' }}>+ Add</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {task.inputVariables.map((v, varIndex) => (
                                <div key={varIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <input type="text" className="input" style={{ width: '120px', fontFamily: 'monospace' }} value={v.name} onChange={(e) => updateInputVariableName(task.id, varIndex, e.target.value)} placeholder="var_name" />
                                    <button onClick={() => removeInputVariable(task.id, varIndex)} style={{ background: 'var(--error)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Equations */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>➗ Equations ({task.equations.length})</h3>
                            <button onClick={() => addEquation(task.id)} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--success)' }}>+ Add</button>
                        </div>

                        {task.equations.map((eq, eqIndex) => (
                            <div key={eqIndex} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <input type="text" className="input" style={{ width: '120px', fontFamily: 'monospace' }} value={eq.outputVariable} onChange={(e) => updateEquation(task.id, eqIndex, 'outputVariable', e.target.value)} placeholder="output" />
                                    <span style={{ fontSize: '1.25rem' }}>=</span>
                                    <button onClick={() => removeEquation(task.id, eqIndex)} style={{ background: 'var(--error)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.4rem 0.6rem', cursor: 'pointer', marginLeft: 'auto' }}>🗑️</button>
                                </div>
                                <FormulaEditor
                                    value={eq.formula}
                                    onChange={(value) => updateEquation(task.id, eqIndex, 'formula', value)}
                                    variables={task.inputVariables}
                                    placeholder="Formula (pl: GYÖK(F*1000/sigma))"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Showing Text with Output Variable Insert */}
                    <div>
                        <label className="input-label">📝 Showing Text</label>
                        <ShowingTextEditor
                            value={task.showingText}
                            onChange={(value) => updateTask(task.id, 'showingText', value)}
                            outputVariables={getOutputVariables(task.equations)}
                        />
                    </div>
                </div>
            ))}

            {(!config?.tasks || config.tasks.length === 0) && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No tasks. Click Reload to load from HTML.</p>
                </div>
            )}
        </main>
    );
}
