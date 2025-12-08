'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calculateResults, validateInputs } from '@/lib/calculator';
import tasksConfig from '@/lib/config/tasks.json';

export default function CalculatorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [customerId, setCustomerId] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [inputs, setInputs] = useState({});
    const [saveStatus, setSaveStatus] = useState('saved');
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [showMobileNav, setShowMobileNav] = useState(false);

    const tasks = tasksConfig.tasks;
    const currentTask = tasks[currentTaskIndex];
    const totalTasks = tasks.length;

    // Check authentication
    useEffect(() => {
        const storedId = localStorage.getItem('customerId');
        const storedName = localStorage.getItem('customerName');
        const hasCalculated = localStorage.getItem('hasCalculated');

        if (!storedId) {
            router.push('/');
            return;
        }

        if (hasCalculated === 'true') {
            router.push('/results');
            return;
        }

        setCustomerId(storedId);
        setCustomerName(storedName || 'Felhasználó');
        loadSavedInputs(storedId);
    }, [router]);

    // Load previously saved inputs
    const loadSavedInputs = async (id) => {
        try {
            const { data, error } = await supabase
                .from('input_values')
                .select('values')
                .eq('customer_id', id)
                .single();

            if (!error && data) {
                setInputs(data.values || {});
            } else {
                // Try localStorage
                const localData = localStorage.getItem(`inputs_${id}`);
                if (localData) setInputs(JSON.parse(localData));
            }
        } catch (err) {
            console.log('Could not load saved inputs:', err);
        } finally {
            setLoading(false);
        }
    };

    // Autosave inputs every 2 seconds
    const saveInputs = useCallback(async () => {
        if (!customerId || Object.keys(inputs).length === 0) return;

        setSaveStatus('saving');

        try {
            await supabase
                .from('input_values')
                .upsert({
                    customer_id: customerId,
                    task_id: 'all_tasks',
                    values: inputs,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'customer_id,task_id' });
            setSaveStatus('saved');
        } catch (err) {
            localStorage.setItem(`inputs_${customerId}`, JSON.stringify(inputs));
            setSaveStatus('saved');
        }
    }, [customerId, inputs]);

    useEffect(() => {
        const timer = setTimeout(saveInputs, 2000);
        return () => clearTimeout(timer);
    }, [inputs, saveInputs]);

    // Handle input change
    const handleInputChange = (taskId, inputId, value) => {
        setInputs(prev => ({
            ...prev,
            [`${taskId}_${inputId}`]: value
        }));
        setSaveStatus('unsaved');
    };

    // Get input value
    const getInputValue = (taskId, inputId) => {
        return inputs[`${taskId}_${inputId}`] || '';
    };

    // Check if task has any filled inputs
    const isTaskAnswered = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return false;
        return task.inputs.some(input => getInputValue(taskId, input.id));
    };

    // Navigate to task
    const goToTask = (index) => {
        setCurrentTaskIndex(index);
        setShowMobileNav(false);
        window.scrollTo(0, 0);
    };

    // Handle calculation
    const handleCalculate = async () => {
        // Validate all tasks have inputs
        let allValid = true;
        let missingTask = null;

        for (const task of tasks) {
            const taskInputs = {};
            task.inputs.forEach(input => {
                taskInputs[input.id] = getInputValue(task.id, input.id);
            });

            if (!validateInputs(taskInputs, task.inputs.map(i => i.id))) {
                allValid = false;
                missingTask = task;
                break;
            }
        }

        if (!allValid && missingTask) {
            alert(`Kérjük, töltse ki az összes mezőt a(z) "${missingTask.title}" feladatban!`);
            const index = tasks.findIndex(t => t.id === missingTask.id);
            if (index !== -1) setCurrentTaskIndex(index);
            return;
        }

        setCalculating(true);

        try {
            const allResults = {};

            for (const task of tasks) {
                const taskInputs = {};
                task.inputs.forEach(input => {
                    taskInputs[input.id] = parseFloat(getInputValue(task.id, input.id));
                });

                const results = calculateResults(taskInputs, task.equations);
                allResults[task.id] = { inputs: taskInputs, results };
            }

            const resultData = {
                allResults,
                calculatedAt: new Date().toISOString()
            };

            localStorage.setItem(`results_${customerId}`, JSON.stringify(resultData));
            localStorage.setItem('hasCalculated', 'true');

            try {
                await supabase.from('customers').update({ has_calculated: true }).eq('id', customerId);
                await supabase.from('calculation_results').insert({
                    customer_id: customerId,
                    task_id: 'all_tasks',
                    inputs: inputs,
                    results: allResults,
                    calculated_at: new Date().toISOString()
                });
            } catch (dbError) {
                console.log('Could not save to Supabase:', dbError);
            }

            router.push('/results');
        } catch (err) {
            console.error('Calculation error:', err);
            alert('Hiba történt a számítás során. Kérjük, ellenőrizze a megadott értékeket.');
        } finally {
            setCalculating(false);
        }
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
                    <span style={{ fontSize: '0.8rem', color: '#6c757d', marginLeft: '1rem', fontWeight: 'normal' }}>
                        {customerName}
                    </span>
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

                        {/* Main Content Area */}
                        <section id="region-main" className="has-blocks" aria-label="Tartalom">
                            <div role="main">
                                <div className="que formulas">
                                    <div className="info">
                                        <h3 className="no"><span className="qno">{currentTaskIndex + 1}</span> kérdés</h3>
                                        <div className="state">Folyamatban</div>
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
                                                    <strong>Az ismert adatok:</strong><br />
                                                    {currentTask.inputs.map((input, i) => (
                                                        <span key={input.id}>
                                                            {i > 0 && ', '}
                                                            {input.label}=
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                className={`formulas_number ${getInputValue(currentTask.id, input.id) ? 'has-value' : ''}`}
                                                                value={getInputValue(currentTask.id, input.id)}
                                                                onChange={(e) => handleInputChange(currentTask.id, input.id, e.target.value)}
                                                                placeholder={input.placeholder || ''}
                                                                style={{ width: '60px', margin: 0 }}
                                                            />
                                                            <span className="formulas_unit" style={{ margin: '0 0 0 5px' }}>{input.unit}</span>
                                                        </span>
                                                    ))}
                                                </p>
                                            </div>

                                            {/* Questions with result placeholders */}
                                            {currentTask.questions.map((question) => (
                                                <div key={question.id} className="formulaspart">
                                                    <p><strong>{question.text}</strong></p>
                                                    <p>
                                                        {question.results.map((result) => (
                                                            <span key={result.id}>
                                                                {result.prefix}
                                                                <span className="result-placeholder">?</span>
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

                                    {currentTaskIndex < totalTasks - 1 ? (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => goToTask(currentTaskIndex + 1)}
                                        >
                                            Következő oldal
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleCalculate}
                                            disabled={calculating}
                                            style={{ background: '#28a745', borderColor: '#28a745' }}
                                        >
                                            {calculating ? 'Számítás...' : 'Számítás és befejezés'}
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
                                        <h3 className="card-title d-inline">Tesztnavigáció</h3>
                                        <div className="card-text content mt-3">
                                            <div className="qn_buttons clearfix multipages">
                                                {tasks.map((task, index) => (
                                                    <button
                                                        key={task.id}
                                                        className={`qnbutton ${index === currentTaskIndex ? 'thispage' : ''
                                                            } ${isTaskAnswered(task.id) ? 'answered' : 'notyetanswered'}`}
                                                        onClick={() => goToTask(index)}
                                                        title={`${index + 1}. feladat`}
                                                    >
                                                        {index + 1}.
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="othernav">
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleCalculate(); }}>
                                                    Számítás befejezése...
                                                </a>
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

            {/* Autosave indicator */}
            <div className={`autosave-indicator ${saveStatus}`} style={{ display: 'none' }}>
                {/* Hidden as per user screenshot usually doesn't show this prominently, or kept subtle */}
                {saveStatus === 'saving' && 'Saving...'}
            </div>
            {saveStatus === 'saving' && (
                <button
                    style={{
                        position: 'fixed', bottom: '20px', right: '20px',
                        padding: '10px 16px', background: 'rgb(25, 118, 210)',
                        color: 'white', border: 'medium', borderRadius: '8px',
                        fontSize: '15px', cursor: 'pointer', zIndex: 999999,
                        boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 10px'
                    }}
                    disabled
                >
                    Saving...
                </button>
            )}
        </div>
    );
}
