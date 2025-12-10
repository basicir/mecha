'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import '../globals.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Don't check auth for login page
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        if (isLoginPage) {
            setIsAuthenticated(true); // Allow login page to render
            return;
        }

        const authStatus = sessionStorage.getItem('adminAuthenticated');
        if (authStatus !== 'true') {
            router.push('/admin/login');
        } else {
            setIsAuthenticated(true);
        }
    }, [isLoginPage, router]);

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuthenticated');
        router.push('/admin/login');
    };

    // Show nothing while checking auth (prevents flash)
    if (isAuthenticated === null && !isLoginPage) {
        return (
            <main className="container" style={{ paddingTop: '2rem' }}>
                <p>Loading...</p>
            </main>
        );
    }

    // Login page - no navigation
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Authenticated admin pages - with navigation
    return (
        <div>
            {/* Admin Navigation Bar */}
            <nav style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>⚙️ Admin</span>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                            href="/admin"
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                background: pathname === '/admin' ? 'var(--primary)' : 'transparent',
                                color: pathname === '/admin' ? 'white' : 'var(--text-muted)',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                            }}
                        >
                            📋 Tasks
                        </Link>
                        <Link
                            href="/admin/users"
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                background: pathname === '/admin/users' ? 'var(--primary)' : 'transparent',
                                color: pathname === '/admin/users' ? 'white' : 'var(--text-muted)',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                            }}
                        >
                            👥 Users
                        </Link>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: 'var(--error)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                    }}
                >
                    🚪 Logout
                </button>
            </nav>

            {/* Page Content */}
            {children}
        </div>
    );
}
