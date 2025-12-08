'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateCustomerId, loadCalculationResults } from '@/lib/supabase'

export default function ResultsPage() {
    const router = useRouter()
    const [customerId, setCustomerId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState([])

    useEffect(() => {
        const checkAuth = async () => {
            const storedId = sessionStorage.getItem('customerId')

            if (!storedId) {
                router.push('/')
                return
            }

            const { valid, hasCalculated } = await validateCustomerId(storedId)

            if (!valid) {
                sessionStorage.removeItem('customerId')
                router.push('/')
                return
            }

            if (!hasCalculated) {
                // User hasn't calculated yet, send to calculator
                router.push('/calculator')
                return
            }

            setCustomerId(storedId)

            // Load results
            const { results: savedResults } = await loadCalculationResults(storedId)
            setResults(savedResults)

            setLoading(false)
        }

        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Számítási Eredmények</h1>
            </div>

            <div className="alert alert-success">
                ✓ A számítás sikeresen végrehajtva. Az eredményeket bármikor megtekintheti ezen az oldalon.
            </div>

            {results.length === 0 ? (
                <div className="alert alert-info">
                    Nincsenek mentett eredmények.
                </div>
            ) : (
                results.map((result, idx) => (
                    <div key={idx} className="que formulas">
                        <div className="info">
                            <h3>Feladat #{idx + 1}</h3>
                            <div className="state">
                                Számítva: {new Date(result.calculated_at).toLocaleString('hu-HU')}
                            </div>
                        </div>

                        <div className="content">
                            <div className="qtext">
                                <p><strong>Bementi adatok:</strong></p>
                            </div>

                            <div className="formulaspart">
                                {Object.entries(result.inputs || {}).map(([key, value]) => (
                                    <p key={key}>
                                        {key} = <span className="result-value">{value}</span>
                                    </p>
                                ))}
                            </div>

                            <div className="qtext">
                                <p><strong>Eredmények:</strong></p>
                            </div>

                            {Object.entries(result.results || {}).map(([key, value]) => (
                                <div key={key} className="formulaspart">
                                    <p>
                                        <strong>{key}:</strong>{' '}
                                        <span className="result-value">{value}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        sessionStorage.removeItem('customerId')
                        router.push('/')
                    }}
                >
                    Kijelentkezés
                </button>
            </div>
        </div>
    )
}
