import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
        return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('user_input_data')
            .select('task_inputs, results')
            .eq('customer_id', customerId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // Convert results object to array
        const resultsArray = data?.results
            ? Object.values(data.results)
            : [];

        return NextResponse.json({
            inputs: data?.task_inputs || {},
            results: resultsArray,
        });
    } catch (error) {
        console.error('Load results error:', error);
        return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
    }
}
