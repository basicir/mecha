'use client';

import { useState, useEffect } from 'react';
import '../../globals.css';

interface Customer {
    id: string;
    customer_name: string;
    has_calculated: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUserName, setNewUserName] = useState('');
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            setMessage('Failed to load users');
        }
        setLoading(false);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName.trim()) return;

        setAdding(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newUserName.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`✅ User "${newUserName}" added! ID: ${data.user.id}`);
                setNewUserName('');
                loadUsers();
            } else {
                setMessage(`❌ ${data.error || 'Failed to add user'}`);
            }
        } catch (err) {
            setMessage('❌ Connection error');
        }
        setAdding(false);
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete "${userName}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMessage(`✅ User "${userName}" deleted`);
                loadUsers();
            } else {
                const data = await res.json();
                setMessage(`❌ ${data.error || 'Failed to delete user'}`);
            }
        } catch (err) {
            setMessage('❌ Connection error');
        }
    };

    const handleCopyId = async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (loading) {
        return (
            <main className="container" style={{ paddingTop: '2rem' }}>
                <p>Loading users...</p>
            </main>
        );
    }

    return (
        <main className="container">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    👥 User Management
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Manage approved customers. Click the ID to copy.
                </p>
            </div>

            {/* Add New User Form */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                    ➕ Add New User
                </h2>
                <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Customer name..."
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        style={{ flex: '1', minWidth: '200px' }}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={adding || !newUserName.trim()}
                    >
                        {adding ? 'Adding...' : '➕ Add User'}
                    </button>
                </form>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: message.includes('✅') ? 'var(--success-bg)' : 'var(--error-bg)',
                    color: message.includes('✅') ? '#166534' : 'var(--error)',
                }}>
                    {message}
                </div>
            )}

            {/* Users Table */}
            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                    📋 Users ({users.length})
                </h2>

                {users.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                        No users yet. Add one above!
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>
                                        Name
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>
                                        ID (click to copy)
                                    </th>
                                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>
                                        Calculated
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-muted)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        style={{ borderBottom: '1px solid var(--border-color)' }}
                                    >
                                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                                            {user.customer_name}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button
                                                onClick={() => handleCopyId(user.id)}
                                                style={{
                                                    background: copiedId === user.id ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                                                    color: copiedId === user.id ? 'white' : 'var(--text-light)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    padding: '0.5rem 0.75rem',
                                                    cursor: 'pointer',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    transition: 'all 0.2s',
                                                }}
                                                title="Click to copy ID"
                                            >
                                                {copiedId === user.id ? '✓ Copied!' : '📋'}
                                                <span style={{
                                                    maxWidth: '180px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {user.id}
                                                </span>
                                            </button>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '99px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: user.has_calculated ? 'var(--success)' : 'var(--border-color)',
                                                color: 'white',
                                            }}>
                                                {user.has_calculated ? '✓ Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.customer_name)}
                                                style={{
                                                    background: 'var(--error)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '0.5rem 0.75rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
