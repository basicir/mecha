import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Generic types for flexible JSON storage
export type InputData = Record<string, number | string>
export type ResultData = Record<string, number | string>


// Customer data interface
export interface CustomerData {
    id: string
    name: string
    created_at: string
    last_access: string | null
    has_calculated: boolean
    inputs: InputData
    results: ResultData
    inputs_saved_at: string | null
    results_calculated_at: string | null
}

// Config interface for dynamic field configuration
export interface CalculatorConfig {
    inputs: Array<{
        key: string
        label: string
        type: 'number' | 'text'
        placeholder?: string
    }>
    formula: {
        name: string
        expression: string
        resultKey: string
        description: string
    }
}

// =============================================
// CUSTOMER DATA FUNCTIONS
// =============================================

/**
 * Validate a customer ID and return customer data
 */
export async function validateCustomerId(customerId: string): Promise<CustomerData | null> {
    const { data, error } = await supabase
        .from('customer_data')
        .select('*')
        .eq('id', customerId)
        .single()

    if (error || !data) return null
    return data as CustomerData
}

/**
 * Get saved inputs for a customer
 */
export async function getSavedInputs(customerId: string): Promise<InputData | null> {
    const { data, error } = await supabase
        .from('customer_data')
        .select('inputs')
        .eq('id', customerId)
        .single()

    if (error || !data) return null
    return data.inputs as InputData
}

/**
 * Save inputs for a customer (merges with existing inputs)
 */
export async function saveInputs(customerId: string, inputs: InputData): Promise<boolean> {
    const { error } = await supabase
        .from('customer_data')
        .update({
            inputs: inputs,
            inputs_saved_at: new Date().toISOString(),
            last_access: new Date().toISOString()
        })
        .eq('id', customerId)

    return !error
}

/**
 * Mark customer as having calculated and save results
 */
export async function markAsCalculated(customerId: string): Promise<boolean> {
    const { error } = await supabase
        .from('customer_data')
        .update({
            has_calculated: true,
            last_access: new Date().toISOString()
        })
        .eq('id', customerId)

    return !error
}

/**
 * Save calculation results
 */
export async function saveResult(customerId: string, results: ResultData): Promise<boolean> {
    const { error } = await supabase
        .from('customer_data')
        .update({
            results: results,
            results_calculated_at: new Date().toISOString(),
            has_calculated: true,
            last_access: new Date().toISOString()
        })
        .eq('id', customerId)

    return !error
}

/**
 * Get results for a customer
 */
export async function getResult(customerId: string): Promise<ResultData | null> {
    const { data, error } = await supabase
        .from('customer_data')
        .select('results')
        .eq('id', customerId)
        .single()

    if (error || !data) return null
    return data.results as ResultData
}

/**
 * Get full customer data including inputs and results
 */
export async function getCustomerData(customerId: string): Promise<CustomerData | null> {
    const { data, error } = await supabase
        .from('customer_data')
        .select('*')
        .eq('id', customerId)
        .single()

    if (error || !data) return null
    return data as CustomerData
}

// =============================================
// CONFIG FUNCTIONS
// =============================================

/**
 * Get calculator configuration
 */
export async function getCalculatorConfig(): Promise<CalculatorConfig | null> {
    const { data, error } = await supabase
        .from('config')
        .select('config_value')
        .eq('config_key', 'calculator_fields')
        .single()

    if (error || !data) return null
    return data.config_value as CalculatorConfig
}
