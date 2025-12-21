# ArcStreak - Migration from GymStreak

## Changes Made

### 1. App Renamed: GymStreak → ArcStreak
- ✅ Updated `package.json` name: `gymstreak` → `arcstreak`
- ✅ Updated `app.json` name and slug: `GymStreak` → `ArcStreak`
- ✅ Updated app display name in `app/index.tsx`
- ✅ Updated storage keys: `@gymstreak:*` → `@arcstreak:*`
- ✅ Updated README.md references

### 2. Backend Changed: Firebase → Supabase
- ✅ Removed Firebase dependencies
- ✅ Installed `@supabase/supabase-js`
- ✅ Created `config/supabase.example.ts` (replaces Firebase config)
- ✅ Created `utils/supabaseStorage.ts` (replaces Firebase cloud storage)
- ✅ Removed Firebase-related files:
  - `utils/cloudStorage.ts` (Firebase version)
  - `utils/auth.ts` (not needed for username-based sync)
  - `config/firebase.example.ts`
- ✅ Updated `.gitignore` to ignore `config/supabase.ts`

### 3. New Files Created
- ✅ `config/supabase.example.ts` - Supabase configuration template
- ✅ `utils/supabaseStorage.ts` - Supabase cloud sync functions
- ✅ `SUPABASE_SETUP.md` - Complete Supabase setup guide
- ✅ Updated `USERNAME_SYNC_GUIDE.md` - Now references Supabase

### 4. Storage Keys Updated
- `@gymstreak:days` → `@arcstreak:days`
- `@gymstreak:highestStreak` → `@arcstreak:highestStreak`
- `@gymstreak:username` → `@arcstreak:username`

## Next Steps

1. **Rename folder** (manual step):
   ```bash
   cd "/Users/mrstark/Desktop/Code PlayGround"
   mv GymStreak ArcStreak
   ```

2. **Set up Supabase**:
   - Follow `SUPABASE_SETUP.md`
   - Create Supabase project
   - Run SQL to create `users` table
   - Copy `config/supabase.example.ts` → `config/supabase.ts`
   - Add your Supabase URL and anon key

3. **Test the app**:
   ```bash
   npm install
   npx expo start
   ```

## Database Structure (Supabase)

```sql
users table:
├── username (TEXT, PRIMARY KEY)
├── gym_days (JSONB) - Array of gym day objects
├── highest_streak (INTEGER)
└── updated_at (TIMESTAMP)
```

## Features Unchanged

- ✅ Username-based sync (no authentication)
- ✅ Local storage with AsyncStorage
- ✅ Real-time sync across devices
- ✅ All existing UI/UX features

