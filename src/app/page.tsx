'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './globals.css';

export default function SignInPage() {
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/validate-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customerId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid customer ID');
        return;
      }

      // Store customer ID in session storage
      sessionStorage.setItem('customerId', customerId.trim());

      // Redirect based on calculation status
      if (data.hasCalculated) {
        router.push('/results');
      } else {
        router.push('/calculate');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card fade-in" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Mecha Oldal
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Statika Kalkulátor
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label" htmlFor="customerId">
              Customer ID
            </label>
            <input
              type="text"
              id="customerId"
              className="input"
              placeholder="Enter your customer ID..."
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
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
            disabled={loading || !customerId.trim()}
          >
            {loading ? 'Validating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Each customer ID can only calculate once.
        </p>
      </div>
    </main>
  );
}
