import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase service role configuration');
    }

    return createClient(supabaseUrl, serviceRoleKey);
}

// GET - List all users
export async function GET() {
    try {
        const supabase = getServiceSupabase();

        const { data: users, error } = await supabase
            .from('approved_customers')
            .select('id, customer_name, has_calculated, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to load users' },
                { status: 500 }
            );
        }

        return NextResponse.json({ users: users || [] });

    } catch (error) {
        console.error('Error loading users:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

// POST - Add new user
export async function POST(request: NextRequest) {
    try {
        const { name } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const supabase = getServiceSupabase();

        const { data: user, error } = await supabase
            .from('approved_customers')
            .insert({ customer_name: name.trim() })
            .select('id, customer_name, has_calculated, created_at')
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const supabase = getServiceSupabase();

        const { error } = await supabase
            .from('approved_customers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to delete user' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}
