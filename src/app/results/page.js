'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import tasksConfig from '@/lib/config/tasks.json';

export default function ResultsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [customerId, setCustomerId] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [resultData, setResultData] = useState(null);
    const [currentTask] = useState(tasksConfig.tasks[0]);

    // Check authentication and load results
    useEffect(() => {
        const storedId = localStorage.getItem('customerId');
        const storedName = localStorage.getItem('customerName');
        const hasCalculated = localStorage.getItem('hasCalculated');

        if (!storedId) {
            router.push('/');
            return;
        }

        if (hasCalculated !== 'true') {
            router.push('/calculator');
            return;
        }

        setCustomerId(storedId);
        setCustomerName(storedName || 'Felhasználó');
        loadResults(storedId);
    }, [router]);

    const loadResults = async (id) => {
        try {
            // First try to load from Supabase
            const { data, error } = await supabase
                .from('calculation_results')
                .select('*')
                .eq('customer_id', id)
                .eq('task_id', currentTask.id)
                .single();

            if (!error && data) {
                setResultData({
                    inputs: data.inputs,
                    results: data.results,
                    calculatedAt: data.calculated_at
                });
            } else {
                // Fallback to localStorage
                const localData = localStorage.getItem(`results_${id}`);
                if (localData) {
                    setResultData(JSON.parse(localData));
                }
            }
        } catch (err) {
            console.log('Loading from Supabase failed, trying localStorage:', err);
            const localData = localStorage.getItem(`results_${id}`);
            if (localData) {
                setResultData(JSON.parse(localData));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('customerId');
        localStorage.removeItem('customerName');
        localStorage.removeItem('hasCalculated');
        router.push('/');
    };

    // Render result field with highlighted value
    const renderResultField = (resultId) => {
        const value = resultData?.results?.[resultId];
        return (
            <span className="result-field">
                {value !== null && value !== undefined ? value : '—'}
            </span>
        );
    };

    // Render input value (readonly display)
    const renderInputValue = (inputId) => {
        const value = resultData?.inputs?.[inputId];
        return (
            <span className="result-field" style={{ background: '#f5f5f5', borderColor: '#999' }}>
                {value !== null && value !== undefined ? value : '—'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Eredmények betöltése...</p>
            </div>
        );
    }

    if (!resultData) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '3rem' }}>
                <h2>Nincs elérhető eredmény</h2>
                <p>Nem találtunk mentett számítási eredményeket.</p>
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Vissza a bejelentkezéshez
                </button>
            </div>
        );
    }

    const calculatedDate = resultData.calculatedAt
        ? new Date(resultData.calculatedAt).toLocaleString('hu-HU')
        : 'Ismeretlen';

    return (
        <>
            <nav className="navbar">
                <span className="navbar-brand">🔧 Mecha Oldal - Eredmények</span>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'transparent',
                        border: '1px solid #ddd',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    Kijelentkezés
                </button>
            </nav>

            <div className="container">
                <div className="page-header results-header">
                    <h1>✅ Számítás kész!</h1>
                    <p>{currentTask.title}</p>
                    <div className="results-badge">
                        📅 Számítva: {calculatedDate}
                    </div>
                </div>

                <div className="task-card">
                    <div className="task-header">
                        <span className="task-number" style={{ background: '#2e7d32' }}>
                            ✓ Kész
                        </span>
                        <span className="task-status">👤 {customerName}</span>
                    </div>

                    <div className="task-content">
                        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                            {currentTask.description}
                        </p>

                        {currentTask.image && (
                            <img
                                src={currentTask.image}
                                alt="Feladat ábra"
                                className="task-image"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}

                        <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                            A megadott adatok:
                        </h4>
                        <div className="inputs-display">
                            {currentTask.inputs.map((input, index) => (
                                <span key={input.id}>
                                    {index > 0 && ', '}
                                    <strong>{input.label}</strong>=
                                    {renderInputValue(input.id)}
                                    <span> {input.unit}</span>
                                </span>
                            ))}
                        </div>

                        <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#2e7d32' }}>
                            📊 Eredmények:
                        </h4>

                        {currentTask.questions.map((question) => (
                            <div key={question.id} className="question-block" style={{ borderLeftColor: '#2e7d32' }}>
                                <h4>{question.text}</h4>
                                <div className="question-results">
                                    {question.results.map((result) => (
                                        <span key={result.id}>
                                            {result.prefix}
                                            {renderResultField(result.id)}
                                            {result.suffix && <span>{result.suffix}</span>}
                                            {result.unit && <span style={{ marginLeft: '0.25rem', color: '#666' }}>{result.unit}</span>}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: '#e8f5e9',
                    borderRadius: '12px',
                    marginTop: '1rem'
                }}>
                    <p style={{ fontSize: '1.1rem', color: '#2e7d32', marginBottom: '0.5rem' }}>
                        🎉 A számítás sikeresen megtörtént!
                    </p>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        Ezt az oldalt bármikor megtekintheti újra a bejelentkezés után.
                    </p>
                </div>
            </div>
        </>
    );
}
