
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vlkcnndgtarduplyedyp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsa2NubmRndGFyZHVwbHllZHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNDY0ODYsImV4cCI6MjA1MTgyMjQ4Nn0.jr1HnmnBjlyabBUafz6gFpjpjGrYMq4E3XckB0XCovE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// For backward compatibility
export default supabase;
