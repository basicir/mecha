'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../globals.css';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid password');
                return;
            }

            // Store admin session
            sessionStorage.setItem('adminAuthenticated', 'true');

            // Redirect to admin page
            router.push('/admin');
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        🔐 Admin Login
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Enter admin password to continue
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="password"
                            className="input"
                            placeholder="Admin password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading || !password}
                    >
                        {loading ? 'Checking...' : 'Login'}
                    </button>
                </form>

                <a
                    href="/"
                    style={{
                        display: 'block',
                        marginTop: '2rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        textDecoration: 'underline'
                    }}
                >
                    ← Back to main site
                </a>
            </div>
        </main>
    );
}
