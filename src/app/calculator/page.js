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

        if (hasCalculated === 'true') {
            router.push('/results');
            return;
        }

        setCustomerId(storedId);
        setCustomerName(storedName || 'Felhasználó');
        loadSavedInputs(storedId);
    }, [router]);

    const loadSavedInputs = async (id) => {
        try {
            const { data } = await supabase
                .from('input_values')
                .select('values')
                .eq('customer_id', id)
                .single();

            if (data) {
                setInputs(data.values || {});
            } else {
                const localData = localStorage.getItem(`inputs_${id}`);
                if (localData) setInputs(JSON.parse(localData));
            }
        } catch (err) {
            const localData = localStorage.getItem(`inputs_${id}`);
            if (localData) setInputs(JSON.parse(localData));
        } finally {
            setLoading(false);
        }
    };

    // Autosave
    const saveInputs = useCallback(async () => {
        if (!customerId || Object.keys(inputs).length === 0) return;
        try {
            await supabase
                .from('input_values')
                .upsert({
                    customer_id: customerId,
                    task_id: 'all_tasks',
                    values: inputs,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'customer_id,task_id' });
        } catch (err) {
            localStorage.setItem(`inputs_${customerId}`, JSON.stringify(inputs));
        }
    }, [customerId, inputs]);

    useEffect(() => {
        const timer = setTimeout(saveInputs, 2000);
        return () => clearTimeout(timer);
    }, [inputs, saveInputs]);

    const handleInputChange = (taskId, inputId, value) => {
        setInputs(prev => ({
            ...prev,
            [`${taskId}_${inputId}`]: value
        }));
    };

    const getInputValue = (taskId, inputId) => {
        return inputs[`${taskId}_${inputId}`] || '';
    };

    const isTaskAnswered = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return false;
        return task.inputs.some(input => getInputValue(taskId, input.id));
    };

    const goToTask = (index) => {
        setCurrentTaskIndex(index);
        window.scrollTo(0, 0);
    };

    // Render the inputsDisplay string with input fields inserted at {variable} positions
    const renderInputsDisplay = () => {
        if (!currentTask.inputsDisplay) return null;

        // Split by {variableName} pattern
        const parts = currentTask.inputsDisplay.split(/(\{[^}]+\})/g);

        return parts.map((part, index) => {
            // Check if this part is a variable placeholder like {a} or {alpha}
            const match = part.match(/^\{(.+)\}$/);
            if (match) {
                const varName = match[1];
                const inputDef = currentTask.inputs.find(i => i.id === varName);
                if (inputDef) {
                    return (
                        <span key={index}>
                            <input
                                type="number"
                                step="any"
                                className="formulas_number"
                                value={getInputValue(currentTask.id, inputDef.id)}
                                onChange={(e) => handleInputChange(currentTask.id, inputDef.id, e.target.value)}
                                placeholder={inputDef.placeholder || ''}
                            />
                            <span className="formulas_unit">{inputDef.unit}</span>
                        </span>
                    );
                }
            }
            // Return text parts, preserving newlines
            return part.split('\n').map((line, i) => (
                <span key={`${index}-${i}`}>
                    {i > 0 && <br />}
                    {line}
                </span>
            ));
        });
    };

    const handleCalculate = async () => {
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
            alert(`Kérjük, töltse ki az összes mezőt!`);
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

            localStorage.setItem(`results_${customerId}`, JSON.stringify({ allResults }));
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
                console.log('DB error:', dbError);
            }

            router.push('/results');
        } catch (err) {
            console.error('Calculation error:', err);
            alert('Hiba történt a számítás során.');
        } finally {
            setCalculating(false);
        }
    };

    if (loading) {
        return <div className="loading-container">Betöltés...</div>;
    }

    return (
        <>
            <nav className="navbar">
                <span className="navbar-brand">NyE-Moodle - {customerName}</span>
            </nav>

            <div id="page">
                <div id="page-header">
                    <h1>Statika mérnök hallgatóknak 2025</h1>
                </div>

                <div id="page-content">
                    <section id="region-main">
                        {/* A KÉK DIV - EZ A FORMULATION */}
                        <div className="formulation">
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

                            {/* Kérdések és eredmény placeholderek */}
                            {currentTask.questions.map((question) => (
                                <div key={question.id} style={{ marginTop: '15px' }}>
                                    <p><strong>{question.text}</strong></p>
                                    <p>
                                        {question.results.map((result) => (
                                            <span key={result.id}>
                                                {result.prefix}
                                                <span className="result-placeholder">?</span>
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

                            {currentTaskIndex < totalTasks - 1 ? (
                                <button className="btn btn-primary" onClick={() => goToTask(currentTaskIndex + 1)}>
                                    Következő oldal
                                </button>
                            ) : (
                                <button className="btn btn-primary" onClick={handleCalculate} disabled={calculating}>
                                    {calculating ? 'Számítás...' : 'Számítás befejezése'}
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Sidebar */}
                    <aside className="blocks-column">
                        <div className="nav-block">
                            <h3>Feladatok</h3>
                            <div className="nav-buttons">
                                {tasks.map((task, index) => (
                                    <button
                                        key={task.id}
                                        className={`nav-btn ${index === currentTaskIndex ? 'active' : ''} ${isTaskAnswered(task.id) ? 'answered' : ''}`}
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
