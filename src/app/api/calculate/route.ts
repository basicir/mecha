import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateAllTasks } from '@/lib/calculator';
import { loadConfig } from '@/lib/taskParser';

export async function POST(request: NextRequest) {
    try {
        const { customerId, taskInputs } = await request.json();

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // Check if already calculated
        const { data: customer, error: customerError } = await supabase
            .from('approved_customers')
            .select('has_calculated')
            .eq('id', customerId)
            .single();

        if (customerError || !customer) {
            return NextResponse.json({ error: 'Invalid customer' }, { status: 401 });
        }

        if (customer.has_calculated) {
            return NextResponse.json({ error: 'Already calculated. Access revoked.' }, { status: 403 });
        }

        // Load config and calculate
        const config = loadConfig();
        if (!config) {
            return NextResponse.json({ error: 'Config not loaded' }, { status: 500 });
        }

        const results = calculateAllTasks(config.tasks, taskInputs);

        // Save results to user_input_data
        const { error: saveError } = await supabase
            .from('user_input_data')
            .upsert({
                customer_id: customerId,
                task_inputs: taskInputs,
                results: results.reduce((acc, r) => ({ ...acc, [r.taskId]: r }), {}),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'customer_id',
            });

        if (saveError) {
            throw saveError;
        }

        // TEMPORARILY DISABLED FOR TESTING - Allows repeated calculations
        // TODO: Re-enable before production deployment
        /*
        // Mark customer as calculated
        const { error: updateError } = await supabase
            .from('approved_customers')
            .update({ has_calculated: true })
            .eq('id', customerId);

        if (updateError) {
            throw updateError;
        }
        */

        return NextResponse.json({
            success: true,
            results,
        });
    } catch (error) {
        console.error('Calculation error:', error);
        return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
    }
}
