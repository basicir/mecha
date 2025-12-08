'use client'

import { useState, useEffect } from 'react'

// Sample task configuration structure
const defaultTaskConfig = {
    id: 'task_1',
    title: 'Igénybevételek számítása',
    description: 'Merev rúd tartós egyensúlyban',
    inputs: [
        { name: 'a', label: 'a', unit: 'm' },
        { name: 'b', label: 'b', unit: 'm' },
        { name: 'q1', label: 'q₁', unit: 'kN/m' },
        { name: 'F2', label: 'F₂', unit: 'kN' },
        { name: 'alpha', label: 'α', unit: '°' }
    ],
    outputs: [
        { name: 'FA_x', label: 'F⃗_A x komponens', unit: 'kN', equation: 'F2 * cos(alpha)', decimals: 2 },
        { name: 'FA_y', label: 'F⃗_A y komponens', unit: 'kN', equation: 'q1 * a - F2 * sin(alpha)', decimals: 2 },
        { name: 'FB_y', label: 'F⃗_B y komponens', unit: 'kN', equation: 'q1 * b + F2 * sin(alpha)', decimals: 2 }
    ]
}

export default function AdminPage() {
    const [config, setConfig] = useState(defaultTaskConfig)
    const [jsonOutput, setJsonOutput] = useState('')
    const [newInput, setNewInput] = useState({ name: '', label: '', unit: '' })
    const [newOutput, setNewOutput] = useState({ name: '', label: '', unit: '', equation: '', decimals: 2 })

    useEffect(() => {
        setJsonOutput(JSON.stringify(config, null, 2))
    }, [config])

    const addInput = () => {
        if (newInput.name && newInput.label) {
            setConfig({
                ...config,
                inputs: [...config.inputs, { ...newInput }]
            })
            setNewInput({ name: '', label: '', unit: '' })
        }
    }

    const removeInput = (index) => {
        setConfig({
            ...config,
            inputs: config.inputs.filter((_, i) => i !== index)
        })
    }

    const addOutput = () => {
        if (newOutput.name && newOutput.equation) {
            setConfig({
                ...config,
                outputs: [...config.outputs, { ...newOutput }]
            })
            setNewOutput({ name: '', label: '', unit: '', equation: '', decimals: 2 })
        }
    }

    const removeOutput = (index) => {
        setConfig({
            ...config,
            outputs: config.outputs.filter((_, i) => i !== index)
        })
    }

    const exportConfig = () => {
        const blob = new Blob([jsonOutput], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${config.id}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>⚙️ Admin - Task Konfiguráció</h1>
            </div>

            <div className="alert alert-info">
                Ezen az oldalon konfigurálhatja a feladatokat, megadhatja a bemeneti és kimeneti mezőket, valamint az egyenleteket.
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                    <h3 style={{ marginBottom: '1rem' }}>Alapadatok</h3>

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div>
                            <label>Feladat ID:</label>
                            <input
                                type="text"
                                className="formulas_number"
                                style={{ width: '100%' }}
                                value={config.id}
                                onChange={(e) => setConfig({ ...config, id: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Cím:</label>
                            <input
                                type="text"
                                className="formulas_number"
                                style={{ width: '100%' }}
                                value={config.title}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label>Leírás:</label>
                        <input
                            type="text"
                            className="formulas_number"
                            style={{ width: '100%' }}
                            value={config.description}
                            onChange={(e) => setConfig({ ...config, description: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                    <h3 style={{ marginBottom: '1rem' }}>Bemeneti mezők (Inputs)</h3>

                    <table style={{ width: '100%', marginBottom: '1rem' }}>
                        <thead>
                            <tr>
                                <th>Név</th>
                                <th>Címke</th>
                                <th>Mértékegység</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {config.inputs.map((input, idx) => (
                                <tr key={idx}>
                                    <td>{input.name}</td>
                                    <td>{input.label}</td>
                                    <td>{input.unit}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => removeInput(idx)}
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Név (pl: a)"
                            className="formulas_number"
                            value={newInput.name}
                            onChange={(e) => setNewInput({ ...newInput, name: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Címke (pl: a)"
                            className="formulas_number"
                            value={newInput.label}
                            onChange={(e) => setNewInput({ ...newInput, label: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Egység (pl: m)"
                            className="formulas_number"
                            value={newInput.unit}
                            onChange={(e) => setNewInput({ ...newInput, unit: e.target.value })}
                        />
                        <button className="btn btn-primary" onClick={addInput}>+ Hozzáad</button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                    <h3 style={{ marginBottom: '1rem' }}>Kimeneti mezők (Outputs)</h3>

                    <table style={{ width: '100%', marginBottom: '1rem' }}>
                        <thead>
                            <tr>
                                <th>Név</th>
                                <th>Címke</th>
                                <th>Egyenlet</th>
                                <th>Egység</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {config.outputs.map((output, idx) => (
                                <tr key={idx}>
                                    <td>{output.name}</td>
                                    <td>{output.label}</td>
                                    <td><code>{output.equation}</code></td>
                                    <td>{output.unit}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => removeOutput(idx)}
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Név"
                            className="formulas_number"
                            value={newOutput.name}
                            onChange={(e) => setNewOutput({ ...newOutput, name: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Címke"
                            className="formulas_number"
                            value={newOutput.label}
                            onChange={(e) => setNewOutput({ ...newOutput, label: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Egyenlet"
                            className="formulas_number"
                            style={{ width: '200px' }}
                            value={newOutput.equation}
                            onChange={(e) => setNewOutput({ ...newOutput, equation: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Egység"
                            className="formulas_number"
                            value={newOutput.unit}
                            onChange={(e) => setNewOutput({ ...newOutput, unit: e.target.value })}
                        />
                        <button className="btn btn-primary" onClick={addOutput}>+ Hozzáad</button>
                    </div>

                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                        <strong>Elérhető függvények:</strong> sin, cos, tan, sqrt, abs, pow, exp, log
                        <br />
                        <strong>Példa egyenlet:</strong> <code>F2 * cos(alpha)</code>, <code>sqrt(a*a + b*b)</code>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <h3 style={{ marginBottom: '1rem' }}>JSON Konfiguráció</h3>

                    <textarea
                        style={{
                            width: '100%',
                            height: '300px',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            padding: '1rem',
                            border: '1px solid #ddd',
                            borderRadius: '0.25rem'
                        }}
                        value={jsonOutput}
                        readOnly
                    />

                    <div style={{ marginTop: '1rem' }}>
                        <button className="btn btn-success" onClick={exportConfig}>
                            📥 Exportálás JSON-ként
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
