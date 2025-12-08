import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Load saved inputs for a customer
export async function GET(request: NextRequest) {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
        return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('user_input_data')
            .select('task_inputs')
            .eq('customer_id', customerId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json({
            taskInputs: data?.task_inputs || {},
        });
    } catch (error) {
        console.error('Load inputs error:', error);
        return NextResponse.json({ error: 'Failed to load inputs' }, { status: 500 });
    }
}

// POST: Save inputs (autosave)
export async function POST(request: NextRequest) {
    try {
        const { customerId, taskInputs } = await request.json();

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // Upsert the inputs
        const { error } = await supabase
            .from('user_input_data')
            .upsert({
                customer_id: customerId,
                task_inputs: taskInputs,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'customer_id',
            });

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save inputs error:', error);
        return NextResponse.json({ error: 'Failed to save inputs' }, { status: 500 });
    }
}
