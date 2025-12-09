'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskConfig, CalculationResult } from '@/types';

export default function ResultsPage() {
    const [tasks, setTasks] = useState<TaskConfig[]>([]);
    const [results, setResults] = useState<CalculationResult[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const customerId = sessionStorage.getItem('customerId');
        if (!customerId) {
            router.push('/');
            return;
        }

        loadResults(customerId);
    }, [router]);

    const loadResults = async (customerId: string) => {
        try {
            // Load config for task structure
            const configRes = await fetch('/api/config');
            const configData = await configRes.json();
            setTasks(configData.tasks || []);

            // Load results
            const resultsRes = await fetch(`/api/results?customerId=${customerId}`);
            if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                setResults(resultsData.results || []);
            }
        } catch (err) {
            console.error('Failed to load results:', err);
        }
        setLoading(false);
    };

    const formatResult = (value: number | null | undefined): string => {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        return value.toFixed(4);
    };

    // Replace ALL {{variable}} patterns with calculated values
    const renderShowingText = (task: TaskConfig, taskResult?: CalculationResult) => {
        if (!taskResult) return task.showingText;

        let text = task.showingText;

        // Find all {{variable}} patterns using regex
        const placeholderRegex = /\{\{(\w+)\}\}/g;

        text = text.replace(placeholderRegex, (match, varName) => {
            const value = taskResult.outputs[varName];
            if (value !== undefined && value !== null) {
                return `<span class="result-value">${formatResult(value)}</span>`;
            }
            return match; // Keep original if not found
        });

        return text;
    };

    if (loading) {
        return (
            <main className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <p>Loading results...</p>
            </main>
        );
    }

    return (
        <main className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    ✅ Calculation Results
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Your answers are displayed below with the calculated values highlighted in green.
                </p>
            </div>

            {tasks.map((task, index) => {
                const taskResult = results.find((r) => r.taskId === task.id);

                return (
                    <div
                        key={task.id}
                        className="card fade-in"
                        style={{ marginBottom: '1.5rem', animationDelay: `${index * 0.1}s` }}
                    >
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
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

                        <div
                            style={{ fontSize: '1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}
                            dangerouslySetInnerHTML={{ __html: renderShowingText(task, taskResult) }}
                        />

                        {taskResult && Object.keys(taskResult.outputs).length > 0 && (
                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    Calculated Values:
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    {Object.entries(taskResult.outputs).map(([key, value]) => (
                                        <div key={key} style={{ fontSize: '0.875rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{key}: </span>
                                            <span className="result-value" style={{ fontWeight: '600' }}>
                                                {formatResult(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {taskResult && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    Input Values:
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    {task.inputVariables.map((variable) => (
                                        <div key={variable.name} style={{ fontSize: '0.875rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{variable.label}: </span>
                                            <span style={{ fontWeight: '500' }}>
                                                {taskResult.inputs[variable.name] || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    This page is permanently accessible. You can return anytime to view your results.
                </p>
            </div>
        </main>
    );
}
