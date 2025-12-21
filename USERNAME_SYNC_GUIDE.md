# Username-Based Cloud Sync Guide for ArcStreak

## How It Works

Instead of authentication, users simply enter a username to sync their data:

1. **User enters username** → Stored locally in AsyncStorage
2. **Data synced to Supabase** → Stored in `users` table with `username` as primary key
3. **Same username = same data** → Works across all devices

## Data Structure

```
Supabase Database:
└── users table
    ├── username (TEXT, PRIMARY KEY)
    ├── gym_days (JSONB) - Array of gym day objects
    ├── highest_streak (INTEGER)
    └── updated_at (TIMESTAMP)
```

## Setup Steps

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up (free account)
3. Create new project "ArcStreak"
4. Wait for project to be ready

### Step 2: Create Database Table

Run the SQL from `SUPABASE_SETUP.md` to create the `users` table.

### Step 3: Add Supabase Config

1. Copy `config/supabase.example.ts` to `config/supabase.ts`
2. Add your Supabase URL and anon key from Supabase Dashboard

### Step 4: Username Entry

The app includes a `UsernameEntry` component that:
- Validates username (3-20 chars, alphanumeric + underscores)
- Saves username to AsyncStorage
- Allows changing username anytime

## Usage

1. **First time**: User enters username → Data syncs to Supabase
2. **Other devices**: Enter same username → Data syncs automatically
3. **Change username**: Opens new account (old data stays under old username)

## Features

✅ **No authentication required** - Just enter username  
✅ **Works offline** - Saves locally, syncs when online  
✅ **Real-time sync** - Changes appear instantly on other devices  
✅ **Simple setup** - No complex auth flows  
✅ **PostgreSQL** - Powerful database backend  

## Limitations

⚠️ **No security** - Anyone can access any username's data  
⚠️ **Username conflicts** - Multiple people can use same username  
⚠️ **No password** - Can't recover if username is forgotten  

For production apps, consider adding Supabase Authentication later.

## Free Tier

- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ Real-time subscriptions
- ✅ Unlimited API requests

Perfect for MVP! 🚀

