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
            </div>
        );
    }

    return (
        <div id="page-wrapper">
            <nav className="navbar fixed-top navbar-light bg-white navbar-expand">
                <div className="navbar-brand d-flex align-items-center m-0 p-0">
                    NyE-Moodle
                    <button
                        onClick={handleLogout}
                        className="btn btn-secondary"
                        style={{ marginLeft: '1rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                    >
                        Kijelentkezés
                    </button>
                </div>
            </nav>

            <div id="page" className="container-fluid">
                <div id="page-header" className="row">
                    <div className="col-12 py-3" style={{ padding: '1rem 0', width: '100%' }}>
                        <div className="page-context-header">
                            <div className="page-header-headings">
                                <h1>Statika mérnök hallgatóknak 2025</h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="page-content" className="row">
                    <div id="region-main-box" className="col-12">

                        {/* Main Content */}
                        <section id="region-main" className="has-blocks" aria-label="Tartalom">
                            <div role="main">
                                <div className="que formulas">
                                    <div className="info" style={{ background: '#d4edda', borderBottomColor: '#c3e6cb' }}>
                                        <h3 className="no"><span className="qno">{currentTaskIndex + 1}</span> kérdés</h3>
                                        <div className="state" style={{ color: '#155724' }}>✓ Befejezve</div>
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
                                                        style={{ maxWidth: '100%' }}
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
                                                            <span className="formulas_unit" style={{ margin: '0 0 0 5px' }}>
                                                                {input.unit}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </p>
                                            </div>

                                            {/* Questions with calculated results */}
                                            {currentTask.questions.map((question) => (
                                                <div key={question.id} className="formulaspart">
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
                                                                    <span className="formulas_unit">
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
                        </section>

                        {/* Sidebar Navigation */}
                        <section className={`blocks-column ${showMobileNav ? 'show' : ''}`} aria-label="Blokkok">
                            <aside id="block-region-side-pre" className="block-region">
                                <section id="mod_quiz_navblock" className="block block_fake card mb-3">
                                    <div className="card-body p-3">
                                        <h3 className="card-title d-inline">Eredmény navigáció</h3>
                                        <div className="card-text content mt-3">
                                            <div className="qn_buttons clearfix multipages">
                                                {tasks.map((task, index) => (
                                                    <button
                                                        key={task.id}
                                                        className={`qnbutton answered ${index === currentTaskIndex ? 'thispage' : ''}`}
                                                        onClick={() => goToTask(index)}
                                                        title={`${index + 1}. feladat`}
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
                                    </div>
                                </section>
                            </aside>
                        </section>
                    </div>
                </div>
            </div>

            {/* Mobile nav toggle */}
            <button
                className="mobile-nav-toggle"
                onClick={() => setShowMobileNav(!showMobileNav)}
            >
                📋
            </button>
        </div>
    );
}
