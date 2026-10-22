/**
 * Daily generated leaderboard rows. Not accounts, profiles, or attempts.
 * Names and scores are seeded by exam + calendar day (Asia/Kolkata), so each
 * exam has its own board and both names and scores change the next day.
 * The cohort for a given exam and day is cached in this process until the date rolls.
 */

export const SYNTHETIC_RANK_COUNT = 50;

const SPARE_NAMES = 20;

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ishaan',
  'Shaurya', 'Atharv', 'Advait', 'Kabir', 'Ananya', 'Diya', 'Aanya', 'Myra',
  'Sara', 'Ira', 'Anika', 'Navya', 'Kiara', 'Priya', 'Sneha', 'Neha',
  'Riya', 'Anjali', 'Kavya', 'Meera', 'Rohan', 'Karthik', 'Rahul', 'Amit',
  'Vikram', 'Nikhil', 'Arun', 'Varun', 'Manish', 'Deepak', 'Kiran', 'Harish',
  'Sanjay', 'Aisha', 'Fatima', 'Zoya', 'Imran', 'Sameer', 'Tanvi', 'Shreya',
  'Isha', 'Aditi', 'Nisha', 'Rakesh', 'Manoj', 'Abhishek', 'Siddharth', 'Harsh',
  'Yash', 'Dev', 'Tejas', 'Kunal', 'Akash', 'Rohit', 'Lakshmi', 'Divya',
  'Swati', 'Pallavi', 'Gauri', 'Pooja', 'Anushka', 'Ishita',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Reddy', 'Nair', 'Iyer',
  'Menon', 'Das', 'Bose', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Joshi', 'Kulkarni',
  'Deshmukh', 'Patil', 'Jadhav', 'Shah', 'Mehta', 'Kapoor', 'Malhotra', 'Chopra',
  'Bhat', 'Rao', 'Naidu', 'Pillai', 'Krishnan', 'Khan', 'Ansari', 'Qureshi',
  'Yadav', 'Chauhan', 'Thakur', 'Mishra', 'Pandey', 'Tiwari', 'Dubey', 'Shukla',
  'Agarwal', 'Jain', 'Bansal', 'Goyal', 'Arora', 'Khanna', 'Saxena', 'Tripathi',
  'Kaur', 'Ghosh',
];

const IST_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const cohortCache = new Map();
let cohortCacheDay = '';

function hashString(input) {
  let h = 2166136261;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unit(seed) {
  let t = (hashString(seed) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function examSlug(examCategory) {
  return String(examCategory || 'exam').trim().toLowerCase();
}

export function leaderboardDayKey(now = new Date()) {
  return IST_DAY.format(now);
}

/** Each exam keeps its own score band so boards do not look like copies. */
function examScoreBand(slug) {
  const floor = 12 + unit(`band:${slug}:floor`) * 22;
  const span = 52 + unit(`band:${slug}:span`) * 32;
  return { floor, ceil: Math.min(98.5, floor + span) };
}

function pickNames(slug, day, count) {
  const names = [];
  const used = new Set();
  let slot = 0;
  const guard = count * 8;

  while (names.length < count && slot < guard) {
    const h = hashString(`${slug}:${day}:name:${slot}`);
    const name = `${FIRST_NAMES[h % FIRST_NAMES.length]} ${LAST_NAMES[(h >>> 8) % LAST_NAMES.length]}`;
    slot += 1;
    if (used.has(name)) continue;
    used.add(name);
    names.push(name);
  }

  return names;
}

function rememberCohort(day, key, factory) {
  if (cohortCacheDay !== day) {
    cohortCache.clear();
    cohortCacheDay = day;
  }
  const hit = cohortCache.get(key);
  if (hit) return hit;
  const value = factory();
  cohortCache.set(key, value);
  return value;
}

function buildCohort(slug, day, count) {
  const key = `${slug}:${day}:${count}`;
  return rememberCohort(day, key, () => {
    const band = examScoreBand(slug);
    const names = pickNames(slug, day, count + SPARE_NAMES);
    return names.map((displayName) => {
      const roll = unit(`${slug}:${day}:score:${displayName}`);
      const ability = band.floor + roll * (band.ceil - band.floor);
      return {
        displayName,
        userEmail: `synthetic:${slug}:${day}:${hashString(displayName).toString(36)}`,
        ability,
      };
    });
  });
}

function comparePerTest(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  const duration = (a.durationTaken ?? 999999) - (b.durationTaken ?? 999999);
  if (duration !== 0) return duration;
  return String(a.userEmail).localeCompare(String(b.userEmail));
}

function compareOverall(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  const tests = (b.testsCompleted ?? 0) - (a.testsCompleted ?? 0);
  if (tests !== 0) return tests;
  return String(a.userEmail).localeCompare(String(b.userEmail));
}

export function buildSyntheticRankEntries({
  examCategory,
  scope,
  testIds = [],
  testId = null,
  count = SYNTHETIC_RANK_COUNT,
  reservedNames = [],
  now = new Date(),
}) {
  const day = leaderboardDayKey(now);
  const slug = examSlug(examCategory);
  const reserved = new Set(
    (reservedNames || []).map((name) => String(name || '').trim().toLowerCase()).filter(Boolean)
  );
  const cohort = buildCohort(slug, day, count);
  const chosen = [];

  for (const person of cohort) {
    if (reserved.has(person.displayName.toLowerCase())) continue;
    chosen.push(person);
    if (chosen.length === count) break;
  }

  const testCount = Math.max(testIds?.length || 0, testId ? 1 : 0, 1);
  const perTest = scope === 'test';
  const id = String(testId || 'test');

  return chosen.map((person) => {
    if (perTest) {
      const jitter = (unit(`${slug}:${day}:t:${person.displayName}:${id}`) - 0.5) * 14;
      return {
        userEmail: person.userEmail,
        score: clamp(round2(person.ability + jitter), 8, 99.4),
        durationTaken:
          30 * 60 + Math.floor(unit(`${slug}:${day}:d:${person.displayName}:${id}`) * 150 * 60),
        submittedAt: null,
        attemptId: null,
        displayName: person.displayName,
        avatarUrl: null,
      };
    }

    const testsCompleted = 1 + Math.floor(unit(`${slug}:${day}:n:${person.displayName}`) * testCount);
    return {
      userEmail: person.userEmail,
      score: round2(person.ability),
      testsCompleted,
      totalTests: testCount,
      displayName: person.displayName,
      avatarUrl: null,
    };
  });
}

/** Rank real attempts and generated students together, then keep the top `limit`. */
export function mergeWithSyntheticRanks(realEntries, options) {
  const limit = Math.max(1, Number(options.limit) || 50);
  const reservedNames = (realEntries || []).map((entry) => entry.displayName);
  const synthetic = buildSyntheticRankEntries({ ...options, reservedNames });
  const combined = [...(realEntries || []), ...synthetic];
  combined.sort(options.scope === 'test' ? comparePerTest : compareOverall);

  const ranked = combined.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  return {
    entries: ranked.slice(0, limit),
    ranked,
    totalParticipants: ranked.length,
  };
}
