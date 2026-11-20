# 10Tracker Native Android App

Jetpack Compose client for [10tracker.com](https://10tracker.com).

**No database changes.** The app reuses existing HTTP APIs and Auth.js session cookies.

## What it does

- Native home: OG Tracker paths + exam shortcuts  
- Native path checklist (videos / practice / mocks)  
- **In-app YouTube player** with watch-% sync via `POST /api/og-trackers/progress`  
  (same upsert the Chrome extension and website use)  
- Practice & mock steps open the live site in Chrome Custom Tabs  
- Sign-in: one-time WebView Google login → cookies power native API calls  

## Build

```bash
cd android
echo "sdk.dir=$ANDROID_HOME" > local.properties   # if needed
./gradlew assembleDebug
cp app/build/outputs/apk/debug/app-debug.apk dist/10tracker-native-debug.apk
```

Package ID (debug): `com.tentracker.nativeapp.debug`

## APIs used (unchanged)

| Call | Purpose |
| --- | --- |
| `GET /api/og-trackers` | Catalog + stats |
| `GET /api/og-trackers/{slug}` | Path resources + progress |
| `POST /api/og-trackers/progress` | Save `resourceId` + `percentWatched` + status |
| `GET /api/exams/categories` | Exam chips |

## Notes

- Guest browsing works for public catalog; **sign in** to persist YouTube progress.  
- Full MCQ/mock UIs still live on the website (Custom Tabs) in this v1.  
- Push notifications / Play signing are follow-ups.
