# Supabase Setup Guide for ArcStreak

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up (free account)
3. Click "New Project"
4. Name it "ArcStreak" (or any name)
5. Set a database password (save it!)
6. Choose a region (closest to you)
7. Click "Create new project"

Wait 2-3 minutes for the project to be ready.

## Step 2: Create Database Table

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Run this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  gym_days JSONB DEFAULT '[]'::jsonb,
  highest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read/write (for username-based sync)
CREATE POLICY "Allow public access" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Click "Run" to execute

## Step 2b: Create Subjects Table (Optional - for class attendance tracking)

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Run this SQL (or use the file `database/subjects_table.sql`):

```sql
-- Create subjects table for tracking class attendance
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  total_classes INTEGER DEFAULT 0,
  absent_classes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username, subject_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_username ON subjects(username);

-- Enable Row Level Security (RLS)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read/write (for username-based sync)
CREATE POLICY "Allow public access" ON subjects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_subjects_updated_at();
```

4. Click "Run" to execute

## Step 3: Enable Realtime (Optional)

1. Go to Database → Replication
2. Find the `users` table
3. Toggle "Enable Replication" ON

This enables real-time sync across devices.

## Step 4: Get API Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 5: Add Config to App

1. Copy `config/supabase.example.ts` to `config/supabase.ts`
2. Replace `YOUR_SUPABASE_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

## Step 6: Install Supabase

Already installed! ✅

## That's it! 🎉

Your app will now sync data to Supabase using usernames!

## Database Structure

```
users table:
├── username (TEXT, PRIMARY KEY)
├── gym_days (JSONB) - Array of gym day objects
├── highest_streak (INTEGER)
└── updated_at (TIMESTAMP)

subjects table:
├── id (UUID, PRIMARY KEY)
├── username (TEXT, NOT NULL) - Foreign key to users
├── subject_name (TEXT, NOT NULL)
├── total_classes (INTEGER, DEFAULT 0)
├── absent_classes (INTEGER, DEFAULT 0)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── UNIQUE(username, subject_name)
```

## Free Tier Limits

- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ Real-time subscriptions
- ✅ Unlimited API requests

Perfect for an MVP! 🚀

