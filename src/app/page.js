'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if customer ID exists in database
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId.trim())
        .single();

      if (fetchError || !customer) {
        setError('Érvénytelen azonosító. Kérjük, ellenőrizze és próbálja újra.');
        setLoading(false);
        return;
      }

      // Store customer ID in localStorage for session
      localStorage.setItem('customerId', customer.id);
      localStorage.setItem('customerName', customer.name || 'Felhasználó');
      localStorage.setItem('hasCalculated', customer.has_calculated ? 'true' : 'false');

      // Redirect based on calculation status
      if (customer.has_calculated) {
        router.push('/results');
      } else {
        router.push('/calculator');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Hiba történt a bejelentkezés során. Próbálja újra később.');
    } finally {
      setLoading(false);
    }
  };

  // For development/demo: bypass Supabase if not configured
  const handleDemoSignIn = () => {
    localStorage.setItem('customerId', 'demo-user');
    localStorage.setItem('customerName', 'Demo Felhasználó');
    localStorage.setItem('hasCalculated', 'false');
    router.push('/calculator');
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h1>Mecha Oldal</h1>
        <p>Statika Kalkulátor mérnök hallgatóknak</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSignIn}>
          <input
            type="text"
            placeholder="Adja meg az azonosítóját..."
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Ellenőrzés...' : 'Belépés'}
          </button>
        </form>

        {/* Demo mode button for testing without Supabase */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.5rem' }}>
            Teszteléshez:
          </p>
          <button
            onClick={handleDemoSignIn}
            style={{
              background: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              fontSize: '0.9rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            Demo Mód
          </button>
        </div>
      </div>
    </div>
  );
}
