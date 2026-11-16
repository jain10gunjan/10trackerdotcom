# Ops checklist: Mock of the Day + topic-wise mocks

Student UI is unlocked. Content must exist for cards to show as ready.

## Mock of the Day

1. Open Admin → Mock tests → Mock of the Day panel (`MockOfTheDayAdminPanel`).
2. For each exam (start with `gate-cse`, `gate-ec`, `gate-ee`, `jee-main`):
   - Generate or add mocks into `mock_of_day_pool`, or pin today’s mock in settings.
   - Enable `auto_daily_enabled` when ready for cron.
3. Ensure host cron hits `GET/POST /api/cron/mock-of-day` with the cron secret header (not query string).
4. Verify student home: MOTD card status is `ready` with a working attempt href.

## Topic-wise mocks

1. Admin → create mock with topic mode (`topic_auto` / chapter-topic panels such as `cat_topic`).
2. Publish (`is_active` / active status as used by `fetchActiveMockTests`).
3. Confirm:
   - Student home “Topic-wise mocks” lists the test.
   - `/mock-test/{slug}?type=topic` shows it.
   - Exam hub “Topic-wise tests” card links to that hub filter.

Classifier: `src/features/mock-test/lib/topicWiseTest.js` (shared by dashboard + hub).
