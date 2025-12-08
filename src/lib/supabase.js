import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!isConfigured && typeof window !== 'undefined') {
    console.warn('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if a customer ID is valid
export async function validateCustomerId(customerId) {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('id, has_calculated')
            .eq('id', customerId)
            .single()

        if (error || !data) {
            return { valid: false, hasCalculated: false }
        }

        return { valid: true, hasCalculated: data.has_calculated }
    } catch (err) {
        console.error('Error validating customer ID:', err)
        return { valid: false, hasCalculated: false }
    }
}

// Save user inputs (auto-save every 2 seconds)
export async function saveUserInputs(customerId, taskId, inputs) {
    try {
        const { error } = await supabase
            .from('user_inputs')
            .upsert({
                customer_id: customerId,
                task_id: taskId,
                inputs: inputs
            }, {
                onConflict: 'customer_id,task_id'
            })

        if (error) throw error
        return { success: true }
    } catch (err) {
        console.error('Error saving inputs:', err)
        return { success: false, error: err.message }
    }
}

// Load saved user inputs
export async function loadUserInputs(customerId, taskId) {
    try {
        const { data, error } = await supabase
            .from('user_inputs')
            .select('inputs')
            .eq('customer_id', customerId)
            .eq('task_id', taskId)
            .single()

        if (error || !data) {
            return { inputs: {} }
        }

        return { inputs: data.inputs || {} }
    } catch (err) {
        console.error('Error loading inputs:', err)
        return { inputs: {} }
    }
}

// Save calculation results and mark as calculated
export async function saveCalculationResults(customerId, taskId, inputs, results) {
    try {
        // Save results
        const { error: resultsError } = await supabase
            .from('calculation_results')
            .insert({
                customer_id: customerId,
                task_id: taskId,
                inputs: inputs,
                results: results
            })

        if (resultsError) throw resultsError

        // Mark customer as having calculated
        const { error: updateError } = await supabase
            .from('customers')
            .update({ has_calculated: true })
            .eq('id', customerId)

        if (updateError) throw updateError

        return { success: true }
    } catch (err) {
        console.error('Error saving results:', err)
        return { success: false, error: err.message }
    }
}

// Load calculation results
export async function loadCalculationResults(customerId) {
    try {
        const { data, error } = await supabase
            .from('calculation_results')
            .select('task_id, inputs, results, calculated_at')
            .eq('customer_id', customerId)

        if (error) throw error

        return { results: data || [] }
    } catch (err) {
        console.error('Error loading results:', err)
        return { results: [] }
    }
}
