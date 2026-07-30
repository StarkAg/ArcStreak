# Arc Streak 💪

- 📅 **Calendar View**: Beautiful dark-themed calendar to mark your activity days
- 🔥 **Streak Tracking**: Track your current streak and highest streak record
- ☁️ **Cloud Sync**: Sync your data across all devices using Supabase
- 👥 **Family & Friends**: View and compare stats with family and friends
- ⭐ **Favorites**: Save your favorite users for quick access
- 📊 **Statistics**: View total days, current streak, and monthly counts
- 🎯 **Motivation**: Celebrate new high streaks with animations
- 🔄 **Auto-Sync**: Automatically syncs data every 2 minutes and on app resume
- 🎨 **Universal Tracking**: Track any daily activity - gym, reading, meditation, coding, or any habit

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Supabase account (for cloud sync)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/starkag/ArcStreak.git
cd ArcStreak
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Copy `config/supabase.example.ts` to `config/supabase.ts`
   - Add your Supabase URL and anon key
   - Follow `SUPABASE_SETUP.md` for database setup

4. Start the development server:
```bash
npm start
```

## 📱 Building for Production

### Android APK
```bash
eas build --platform android --profile preview
```

### iOS
```bash
eas build --platform ios --profile production
```

See `BUILD_GUIDE.md` for detailed instructions.

## 🏗️ Project Structure

```
ArcStreak/
├── app/                 # Main app screens
│   ├── index.tsx       # Home screen with calendar
│   └── _layout.tsx     # Root layout
├── components/          # Reusable components
├── utils/              # Utility functions
│   ├── storage.ts      # Local storage
│   ├── supabaseStorage.ts  # Cloud storage
│   ├── stats.ts        # Statistics calculations
│   └── favoritesStorage.ts # Favorites management
├── config/             # Configuration files
├── types/              # TypeScript type definitions
└── assets/             # Images, sounds, etc.
```

## 🔧 Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Supabase** - Backend and cloud sync
- **React Native Calendars** - Calendar component
- **Expo Haptics** - Tactile feedback
- **Expo AV** - Audio playback

## 📖 Documentation

- `SUPABASE_SETUP.md` - Supabase configuration guide
- `BUILD_GUIDE.md` - Building APK and iOS apps
- `CLOUD_SYNC_GUIDE.md` - Cloud sync documentation
- `MULTI_USER_SETUP.md` - Multi-user setup guide

## 🎯 Use Cases

Arc Streak is perfect for tracking:
- 💪 Gym workouts and fitness routines
- 📚 Reading habits
- 🧘 Meditation and mindfulness
- 💻 Coding practice
- 🎨 Creative projects
- 🏃 Running or jogging
- 🎵 Music practice
- ✍️ Writing habits
- Or any daily activity you want to track!

## 🎨 Features in Detail

### Calendar Tracking
- Tap any date to mark/unmark activity days
- Visual indicators for marked days
- Today's date highlighted in green
- Confirmation dialog before unmarking
- Track any daily activity or habit

### Statistics
- **Total Days**: Count of all marked activity days
- **Current Streak**: Longest consecutive days ending on most recent marked date
- **Highest Streak**: All-time record streak
- **Monthly Count**: Days marked in current month

### Cloud Sync
- Automatic sync every 2 minutes
- Sync on app resume
- Manual sync button
- Merge local and cloud data intelligently
- Support for multiple devices

### Social Features
- View family and friends' stats
- Save favorites for quick access
- Compare streaks and progress
- Full calendar view for others (coming soon)

## 🔐 Privacy

- All data is stored locally on your device
- Cloud sync is optional (requires username)
- No personal information required
- Username-based sync (no authentication needed)

## 📝 License

This project is private and proprietary.

## 👨‍💻 Author

**Harsh (Stark)**
- LinkedIn: [harshxagarwal](https://in.linkedin.com/in/harshxagarwal)
- GitHub: [StarkAg](https://github.com/StarkAg)

## 🙏 Acknowledgments

- Built with ❤️ using React Native and Expo
- Calendar component by [react-native-calendars](https://github.com/wix/react-native-calendars)
- Backend powered by [Supabase](https://supabase.com)

---

**Mark every day. Become your best.** 💪
