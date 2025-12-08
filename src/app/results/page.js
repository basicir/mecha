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
            const { data } = await supabase
                .from('calculation_results')
                .select('*')
                .eq('customer_id', id)
                .single();

            if (data) {
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
        window.scrollTo(0, 0);
    };

    const getTaskResult = (taskId) => {
        return resultData?.[taskId] || null;
    };

    const getInputValue = (taskId, inputId) => {
        const taskResult = getTaskResult(taskId);
        return taskResult?.inputs?.[inputId] ?? '—';
    };

    const getResultValue = (taskId, resultId) => {
        const taskResult = getTaskResult(taskId);
        const value = taskResult?.results?.[resultId];
        if (value === null || value === undefined) return '—';
        return typeof value === 'number' ? value.toFixed(2) : value;
    };

    // Render the inputsDisplay string with result values
    const renderInputsDisplay = () => {
        if (!currentTask.inputsDisplay) return null;

        const parts = currentTask.inputsDisplay.split(/(\{[^}]+\})/g);

        return parts.map((part, index) => {
            const match = part.match(/^\{(.+)\}$/);
            if (match) {
                const varName = match[1];
                const inputDef = currentTask.inputs.find(i => i.id === varName);
                if (inputDef) {
                    return (
                        <span key={index}>
                            <span className="result-value">
                                {getInputValue(currentTask.id, inputDef.id)}
                            </span>
                            <span className="formulas_unit">{inputDef.unit}</span>
                        </span>
                    );
                }
            }
            return part.split('\n').map((line, i) => (
                <span key={`${index}-${i}`}>
                    {i > 0 && <br />}
                    {line}
                </span>
            ));
        });
    };

    if (loading) {
        return <div className="loading-container">Betöltés...</div>;
    }

    return (
        <>
            <nav className="navbar">
                <span className="navbar-brand">NyE-Moodle - {customerName}</span>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
                    Kijelentkezés
                </button>
            </nav>

            <div id="page">
                <div id="page-header">
                    <h1>Eredmények - Statika 2025</h1>
                </div>

                <div id="page-content">
                    <section id="region-main">
                        {/* A KÉK DIV - EREDMÉNYEKKEL */}
                        <div className="formulation" style={{ borderLeftColor: '#4caf50' }}>
                            <div className="qtext">
                                <p><strong>{currentTask.title}</strong></p>
                                <p>{currentTask.description}</p>

                                {currentTask.image && (
                                    <img
                                        src={currentTask.image}
                                        alt="Feladat ábra"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                )}

                                <p>{renderInputsDisplay()}</p>
                            </div>

                            {/* Kérdések és eredmények */}
                            {currentTask.questions.map((question) => (
                                <div key={question.id} style={{ marginTop: '15px' }}>
                                    <p><strong>{question.text}</strong></p>
                                    <p>
                                        {question.results.map((result) => (
                                            <span key={result.id}>
                                                {result.prefix}
                                                <span className="result-value">
                                                    {getResultValue(currentTask.id, result.id)}
                                                </span>
                                                {result.suffix}
                                                {result.unit && <span className="formulas_unit">{result.unit}</span>}
                                                {' '}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="submitbtns">
                            {currentTaskIndex > 0 && (
                                <button className="btn btn-secondary" onClick={() => goToTask(currentTaskIndex - 1)}>
                                    Előző oldal
                                </button>
                            )}

                            {currentTaskIndex < totalTasks - 1 && (
                                <button className="btn btn-primary" onClick={() => goToTask(currentTaskIndex + 1)}>
                                    Következő oldal
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Sidebar */}
                    <aside className="blocks-column">
                        <div className="nav-block">
                            <h3>Eredmények</h3>
                            <div className="nav-buttons">
                                {tasks.map((task, index) => (
                                    <button
                                        key={task.id}
                                        className={`nav-btn ${index === currentTaskIndex ? 'active' : ''} answered`}
                                        onClick={() => goToTask(index)}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
