
import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient> | null = null;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  if (!supabaseKey) {
    console.error('Supabase Anon Key is missing. Authentication will not work properly.');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export { supabase };
