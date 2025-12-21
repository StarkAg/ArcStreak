// Copy this file to supabase.ts and add your Supabase config
// Get your config from: Supabase Dashboard → Project Settings → API

import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THIS WITH YOUR SUPABASE CONFIG ⚠️
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

