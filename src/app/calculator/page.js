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
                <p>Betöltés...</p>
            </div>
        );
    }

    return (
        <>
            <nav className="navbar">
                <span className="navbar-brand">Mecha Kalkulátor</span>
                <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {customerName}
                </span>
            </nav>

            <div id="page">
                <div className="container-fluid">
                    <div id="page-header">
                        <h1>Statika mérnök hallgatóknak 2025</h1>
                    </div>

                    <div id="page-content">
                        <div id="region-main-box">
                            {/* Question block */}
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
                                                    style={{ maxWidth: '450px' }}
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
                                                        />
                                                        {' '}{input.unit}
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
                                                                <span className="formulas_unit" style={{ background: '#f8f9fa', border: '1px solid #ced4da' }}>
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

                        {/* Navigation sidebar */}
                        <section className={`blocks-column ${showMobileNav ? 'show' : ''}`}>
                            <section id="mod_quiz_navblock">
                                <div className="card-body">
                                    <h3>Feladat navigáció</h3>
                                    <div className="qn_buttons">
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
                            </section>
                        </section>
                    </div>
                </div>
            </div>

            {/* Mobile nav toggle */}
            <button
                className="mobile-nav-toggle"
                onClick={() => setShowMobileNav(!showMobileNav)}
            >
                📋 Navigáció
            </button>

            {/* Autosave indicator */}
            <div className={`autosave-indicator ${saveStatus}`}>
                {saveStatus === 'saving' && '💾 Mentés...'}
                {saveStatus === 'saved' && '✓ Mentve'}
                {saveStatus === 'unsaved' && '○ Nem mentett'}
            </div>
        </>
    );
}
