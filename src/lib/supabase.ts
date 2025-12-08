import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
}

// Server-side client with service role for admin operations
export function getServiceSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase service role configuration');
    }

    return createClient(supabaseUrl, serviceRoleKey);
}

// For backwards compatibility - lazy getter
export const supabase = {
    get from() {
        return getSupabase().from.bind(getSupabase());
    },
};
