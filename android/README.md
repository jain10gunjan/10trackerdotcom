# 10Tracker Native Android App

Jetpack Compose rebuild of [10tracker.com](https://10tracker.com) for Android.

**No database changes.** The app reuses existing HTTP APIs and Auth.js session cookies.

## What’s native

| Area | Behavior |
| --- | --- |
| Home | Brand hero, stats, shortcuts into native tabs |
| Exams | Active exams → subjects/chapters → in-app MCQ practice |
| Practice | HTML questions, A–D options, check/reveal, progress sync |
| OG Trackers | Paths + in-app YouTube with watch-% via `/api/og-trackers/progress` |
| Updates | Articles list + HTML article reader |
| More | Profile/sign-in, pricing overview, Custom Tabs for web extras |
| Mocks | Mock of the day card; attempt opens Custom Tabs (same live site) |

Sign-in is a one-time WebView Google login; cookies power native OkHttp calls.

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
| `POST /api/og-trackers/progress` | YouTube watch % |
| `GET /api/exams/active` | Exam list |
| `GET /api/exams/categories` | Home chips |
| `GET /api/allsubtopics?category=` | Subjects / chapters |
| `GET /api/questions/chapter` | Practice questions |
| `GET/POST /api/practice/progress` | Practice progress |
| `GET /api/articles` · `GET /api/articles/{slug}` | Updates |
| `GET /api/mock-test/mock-of-day` | Mock of the day |

## Notes

- Guest browsing works for public data; **sign in** to persist practice + YouTube progress.
- Timed mock **attempt UI** still uses the live web flow in Custom Tabs (no schema changes).
- Push notifications / Play signing are follow-ups.
