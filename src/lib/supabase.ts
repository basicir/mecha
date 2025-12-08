import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Customer {
    id: string
    name: string
    created_at: string
    has_calculated: boolean
    last_access: string | null
}

export interface SavedInputs {
    id: string
    customer_id: string
    input_a: number
    input_b: number
    saved_at: string
}

export interface Result {
    id: string
    customer_id: string
    result_c: number
    calculated_at: string
}

// Helper functions
export async function validateCustomerId(customerId: string): Promise<Customer | null> {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

    if (error || !data) return null
    return data as Customer
}

export async function getSavedInputs(customerId: string): Promise<SavedInputs | null> {
    const { data, error } = await supabase
        .from('saved_inputs')
        .select('*')
        .eq('customer_id', customerId)
        .single()

    if (error || !data) return null
    return data as SavedInputs
}

export async function saveInputs(customerId: string, inputA: number, inputB: number): Promise<boolean> {
    const { error } = await supabase
        .from('saved_inputs')
        .upsert({
            customer_id: customerId,
            input_a: inputA,
            input_b: inputB,
            saved_at: new Date().toISOString()
        }, { onConflict: 'customer_id' })

    return !error
}

export async function markAsCalculated(customerId: string): Promise<boolean> {
    const { error } = await supabase
        .from('customers')
        .update({ has_calculated: true })
        .eq('id', customerId)

    return !error
}

export async function saveResult(customerId: string, resultC: number): Promise<boolean> {
    const { error } = await supabase
        .from('results')
        .insert({
            customer_id: customerId,
            result_c: resultC
        })

    return !error
}

export async function getResult(customerId: string): Promise<Result | null> {
    const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('customer_id', customerId)
        .single()

    if (error || !data) return null
    return data as Result
}
