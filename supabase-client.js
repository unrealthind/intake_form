// This file initializes the Supabase client.
// It uses the credentials from your env.js file.

const { createClient } = supabase;
// CORRECTED: This now points to APP_CONFIG to match your env.js
const { supabaseUrl, supabaseKey } = window.APP_CONFIG;

// The _supabase variable will be a global client instance.
const _supabase = createClient(supabaseUrl, supabaseKey);