import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { customerId } = await request.json();

        if (!customerId) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            );
        }

        // Check if customer ID exists in approved_customers table
        const { data: customer, error } = await supabase
            .from('approved_customers')
            .select('id, customer_name, has_calculated')
            .eq('id', customerId)
            .single();

        if (error || !customer) {
            return NextResponse.json(
                { error: 'Invalid customer ID. Access denied.' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            valid: true,
            customerName: customer.customer_name,
            hasCalculated: customer.has_calculated,
        });
    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}
