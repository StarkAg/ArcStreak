// Supabase configuration
// Get your config from: Supabase Dashboard → Project Settings → API

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgghuorphotttadqsiac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2h1b3JwaG90dHRhZHFzaWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDA4MjUsImV4cCI6MjA4MTkxNjgyNX0.7m7TiaWgVW39wPJOEAYegUkGZafdRXoOmsOwchzD_2w';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

