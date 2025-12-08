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
    const [currentTask] = useState(tasksConfig.tasks[0]); // Use first task for now

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
            // Try to load from Supabase
            const { data, error } = await supabase
                .from('input_values')
                .select('values')
                .eq('customer_id', id)
                .eq('task_id', currentTask.id)
                .single();

            if (!error && data) {
                setInputs(data.values || {});
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
            // Try to save to Supabase
            const { error } = await supabase
                .from('input_values')
                .upsert({
                    customer_id: customerId,
                    task_id: currentTask.id,
                    values: inputs,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'customer_id,task_id'
                });

            if (error) throw error;
            setSaveStatus('saved');
        } catch (err) {
            console.log('Autosave to Supabase failed, saving locally:', err);
            // Fallback to localStorage
            localStorage.setItem(`inputs_${customerId}`, JSON.stringify(inputs));
            setSaveStatus('saved');
        }
    }, [customerId, inputs, currentTask.id]);

    // Debounced autosave
    useEffect(() => {
        const timer = setTimeout(saveInputs, 2000);
        return () => clearTimeout(timer);
    }, [inputs, saveInputs]);

    // Handle input change
    const handleInputChange = (inputId, value) => {
        setInputs(prev => ({
            ...prev,
            [inputId]: value
        }));
        setSaveStatus('unsaved');
    };

    // Handle calculation
    const handleCalculate = async () => {
        // Validate inputs
        const requiredInputIds = currentTask.inputs.map(i => i.id);
        if (!validateInputs(inputs, requiredInputIds)) {
            alert('Kérjük, töltse ki az összes mezőt érvényes számokkal!');
            return;
        }

        setCalculating(true);

        try {
            // Convert input values to numbers
            const numericInputs = {};
            for (const [key, value] of Object.entries(inputs)) {
                numericInputs[key] = parseFloat(value);
            }

            // Calculate results
            const results = calculateResults(numericInputs, currentTask.equations);

            // Save results to localStorage (and Supabase if available)
            const resultData = {
                inputs: numericInputs,
                results,
                calculatedAt: new Date().toISOString()
            };

            localStorage.setItem(`results_${customerId}`, JSON.stringify(resultData));
            localStorage.setItem('hasCalculated', 'true');

            // Try to update Supabase
            try {
                await supabase
                    .from('customers')
                    .update({ has_calculated: true })
                    .eq('id', customerId);

                await supabase
                    .from('calculation_results')
                    .insert({
                        customer_id: customerId,
                        task_id: currentTask.id,
                        inputs: numericInputs,
                        results,
                        calculated_at: new Date().toISOString()
                    });
            } catch (dbError) {
                console.log('Could not save to Supabase:', dbError);
            }

            // Redirect to results
            router.push('/results');
        } catch (err) {
            console.error('Calculation error:', err);
            alert('Hiba történt a számítás során. Kérjük, ellenőrizze a megadott értékeket.');
        } finally {
            setCalculating(false);
        }
    };

    // Render input field inline
    const renderInputField = (inputConfig) => {
        return (
            <input
                key={inputConfig.id}
                type="number"
                step="any"
                className={`inline-input ${inputs[inputConfig.id] ? 'has-value' : ''}`}
                placeholder={inputConfig.placeholder || ''}
                value={inputs[inputConfig.id] || ''}
                onChange={(e) => handleInputChange(inputConfig.id, e.target.value)}
                title={`${inputConfig.label} (${inputConfig.unit})`}
            />
        );
    };

    // Render the inputs display with inline input fields
    const renderInputsDisplay = () => {
        // Parse the display template and replace placeholders with inputs
        let display = currentTask.inputsDisplay;

        return (
            <div className="inputs-display">
                {currentTask.inputs.map((input, index) => (
                    <span key={input.id}>
                        {index > 0 && ', '}
                        <strong>{input.label}</strong>=
                        {renderInputField(input)}
                        <span> {input.unit}</span>
                    </span>
                ))}
            </div>
        );
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
                <span className="navbar-brand">🔧 Mecha Oldal - Kalkulátor</span>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    👤 {customerName}
                </span>
            </nav>

            <div className="container">
                <div className="page-header">
                    <h1>{currentTask.title}</h1>
                    <p>Töltse ki az alábbi mezőket a feladat adataival</p>
                </div>

                <div className="task-card">
                    <div className="task-header">
                        <span className="task-number">1 kérdés</span>
                        <span className="task-status">Folyamatban</span>
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
                            Az ismert adatok:
                        </h4>
                        {renderInputsDisplay()}

                        {currentTask.questions.map((question, qIndex) => (
                            <div key={question.id} className="question-block">
                                <h4>{question.text}</h4>
                                <div className="question-results">
                                    {question.results.map((result) => (
                                        <span key={result.id}>
                                            {result.prefix}
                                            <input
                                                type="number"
                                                step="any"
                                                className="inline-input"
                                                placeholder="?"
                                                disabled
                                                title="Ez a mező a számítás után lesz kitöltve"
                                            />
                                            {result.suffix && <span>{result.suffix}</span>}
                                            {result.unit && <span style={{ marginLeft: '0.25rem', color: '#666' }}>{result.unit}</span>}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    className="calculate-btn"
                    onClick={handleCalculate}
                    disabled={calculating}
                >
                    {calculating ? '⏳ Számítás...' : '🧮 Számítás indítása'}
                </button>

                <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                    ⚠️ Figyelem: A "Számítás" gombra kattintás után már nem módosíthatja az adatokat!
                </p>
            </div>

            <div className={`autosave-indicator ${saveStatus}`}>
                {saveStatus === 'saving' && '💾 Mentés...'}
                {saveStatus === 'saved' && '✅ Mentve'}
                {saveStatus === 'unsaved' && '⏳ Nem mentett változások'}
            </div>
        </>
    );
}
