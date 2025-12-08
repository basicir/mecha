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
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [showMobileNav, setShowMobileNav] = useState(false);

    const tasks = tasksConfig.tasks;
    const currentTask = tasks[currentTaskIndex];
    const totalTasks = tasks.length;

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
            const { data, error } = await supabase
                .from('calculation_results')
                .select('*')
                .eq('customer_id', id)
                .single();

            if (!error && data) {
                setResultData(data.results);
            } else {
                const localData = localStorage.getItem(`results_${id}`);
                if (localData) {
                    const parsed = JSON.parse(localData);
                    setResultData(parsed.allResults);
                }
            }
        } catch (err) {
            const localData = localStorage.getItem(`results_${id}`);
            if (localData) {
                const parsed = JSON.parse(localData);
                setResultData(parsed.allResults);
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

    const goToTask = (index) => {
        setCurrentTaskIndex(index);
        setShowMobileNav(false);
        window.scrollTo(0, 0);
    };

    const getTaskResult = (taskId) => {
        return resultData?.[taskId] || resultData?.allResults?.[taskId] || null;
    };

    const getInputValue = (taskId, inputId) => {
        const taskResult = getTaskResult(taskId);
        return taskResult?.inputs?.[inputId] ?? '—';
    };

    const getResultValue = (taskId, resultId) => {
        const taskResult = getTaskResult(taskId);
        const value = taskResult?.results?.[resultId];
        return value !== null && value !== undefined ? value : '—';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Eredmények betöltése...</p>
            </div>
        );
    }

    return (
        <>
            <nav className="navbar">
                <span className="navbar-brand">Mecha Kalkulátor - Eredmények</span>
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                >
                    Kijelentkezés
                </button>
            </nav>

            <div id="page">
                <div className="container-fluid">
                    <div id="page-header" style={{ background: '#d4edda', borderColor: '#28a745' }}>
                        <h1>✓ Számítás kész - Statika 2025</h1>
                    </div>

                    <div id="page-content">
                        <div id="region-main-box">
                            {/* Question block with results */}
                            <div className="que formulas">
                                <div className="info" style={{ background: '#d4edda' }}>
                                    <h3 className="no"><span className="qno">{currentTaskIndex + 1}</span> kérdés</h3>
                                    <div className="state" style={{ color: '#155724' }}>✓ Kész</div>
                                    <div className="grade">({currentTaskIndex + 1}/{totalTasks} oldal)</div>
                                </div>

                                <div className="content">
                                    <div className="formulation">
                                        <div className="qtext">
                                            <p>{currentTask.description}</p>

                                            {currentTask.image && (
                                                <img
                                                    src={currentTask.image}
                                                    alt="Feladat ábra"
                                                    style={{ maxWidth: '450px' }}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            )}

                                            <p>
                                                <strong>A megadott adatok:</strong><br />
                                                {currentTask.inputs.map((input, i) => (
                                                    <span key={input.id}>
                                                        {i > 0 && ', '}
                                                        {input.label}=
                                                        <span className="result-value">
                                                            {getInputValue(currentTask.id, input.id)}
                                                        </span>
                                                        {' '}{input.unit}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>

                                        {/* Questions with calculated results */}
                                        {currentTask.questions.map((question) => (
                                            <div key={question.id} className="formulaspart" style={{ borderLeftColor: '#28a745' }}>
                                                <p><strong>{question.text}</strong></p>
                                                <p>
                                                    {question.results.map((result) => (
                                                        <span key={result.id}>
                                                            {result.prefix}
                                                            <span className="result-value">
                                                                {getResultValue(currentTask.id, result.id)}
                                                            </span>
                                                            {result.suffix && <span>{result.suffix}</span>}
                                                            {result.unit && (
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    padding: '0.25rem 0.5rem',
                                                                    marginLeft: '2px',
                                                                    fontSize: '0.9rem'
                                                                }}>
                                                                    {result.unit}
                                                                </span>
                                                            )}
                                                            {' '}
                                                        </span>
                                                    ))}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Navigation buttons */}
                            <div className="submitbtns">
                                {currentTaskIndex > 0 && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => goToTask(currentTaskIndex - 1)}
                                        style={{ marginRight: '0.5rem' }}
                                    >
                                        Előző oldal
                                    </button>
                                )}

                                {currentTaskIndex < totalTasks - 1 && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => goToTask(currentTaskIndex + 1)}
                                    >
                                        Következő oldal
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Navigation sidebar */}
                        <section className={`blocks-column ${showMobileNav ? 'show' : ''}`}>
                            <section id="mod_quiz_navblock">
                                <div className="card-body">
                                    <h3>Eredmény navigáció</h3>
                                    <div className="qn_buttons">
                                        {tasks.map((task, index) => (
                                            <button
                                                key={task.id}
                                                className={`qnbutton answered ${index === currentTaskIndex ? 'thispage' : ''}`}
                                                onClick={() => goToTask(index)}
                                                title={`${index + 1}. feladat`}
                                                style={{ borderColor: '#28a745' }}
                                            >
                                                {index + 1}.
                                            </button>
                                        ))}
                                    </div>
                                    <div className="othernav">
                                        <span style={{ color: '#155724', fontSize: '0.875rem' }}>
                                            ✓ Minden feladat kész
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </section>
                    </div>
                </div>
            </div>

            {/* Mobile nav toggle */}
            <button
                className="mobile-nav-toggle"
                onClick={() => setShowMobileNav(!showMobileNav)}
                style={{ background: '#28a745' }}
            >
                📋 Navigáció
            </button>
        </>
    );
}
