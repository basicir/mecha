import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase service role configuration');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Check password against stored passwords
        const { data: passwords, error } = await supabase
            .from('admin_passwords')
            .select('password_hash')
            .limit(1);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Server error' },
                { status: 500 }
            );
        }

        if (!passwords || passwords.length === 0) {
            return NextResponse.json(
                { error: 'No admin password configured. Run the password generator script.' },
                { status: 500 }
            );
        }

        // Simple plain text comparison (for simplicity)
        const storedPassword = passwords[0].password_hash;

        if (password !== storedPassword) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}
