import crypto from 'crypto';
import { getSupabaseServer, isValidServiceRoleKey } from '@/lib/supabaseServer';
import { normalizeEmail } from '@/lib/normalizeEmail';
import { getActiveSubscription } from '@/features/credits/lib/walletService';
import { isSetupError, normalizeSlug } from '@/features/og-trackers/lib/ogTrackerService';
import { chapterBySlug, matchGateChapter } from '@/features/og-trackers/lib/ai/gateLexicon';
import {
  fetchGateCseMocks,
  layoutLearningBlocks,
  pickFullMock,
  pickSubjectMock,
  practiceStepsFor,
} from '@/features/og-trackers/lib/ai/gateStudyMix';
import { kolkataDayRange, parsePlaylistId, quotaMonth } from '@/features/og-trackers/lib/ai/playlistId';

const EXAM_FAMILY = 'gate-cse';
const MAX_VIDEOS = 120;
const MONTHLY_LIMIT = 5;
const DAILY_LIMIT = 2;
const OPEN_HOLD_MS = 20 * 60 * 1000;
const MATCH_RATIO = 0.35;
const MATCH_COUNT = 6;
const LLM_BATCH = 20;
const OPEN_STATUSES = ['queued', 'aligning', 'writing'];

function db() {
  return getSupabaseServer(isValidServiceRoleKey());
}

function contentHash(videoIds) {
  return crypto.createHash('sha256').update(videoIds.join('\n')).digest('hex');
}

function parseIsoDuration(value) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(value || ''));
  if (!match) return null;
  const seconds =
    Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  return seconds > 0 ? seconds : null;
}

function jobView(row, extra = {}) {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    errorCode: row.error_code || null,
    errorMessage: row.error_message || null,
    playlistId: row.playlist_id,
    pathId: row.path_id || null,
    pathSlug: extra.pathSlug || null,
    videosTotal: row.videos_total || 0,
    videosDone: row.videos_done || 0,
    videoCount: extra.videoCount ?? null,
    practiceCount: extra.practiceCount ?? null,
    mockCount: extra.mockCount ?? null,
    consumed: Boolean(row.consumed),
    quotaMonth: row.quota_month,
    promptTokens: Number(row.prompt_tokens) || 0,
    completionTokens: Number(row.completion_tokens) || 0,
    totalTokens: Number(row.total_tokens) || 0,
    createdAt: row.created_at,
  };
}

function emptyQuota(extra = {}) {
  return {
    used: 0,
    limit: MONTHLY_LIMIT,
    dailyUsed: 0,
    dailyLimit: DAILY_LIMIT,
    ...extra,
  };
}

async function countJobs(email, apply) {
  let query = db().from('og_ai_jobs').select('id', { count: 'exact', head: true }).eq('user_email', email);
  query = apply(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function usageCounts(email, month, range) {
  const fresh = new Date(Date.now() - OPEN_HOLD_MS).toISOString();
  const open = (query) =>
    query.in('status', OPEN_STATUSES).eq('consumed', false).gte('updated_at', fresh);
  const [monthDone, monthOpen, dayDone, dayOpen] = await Promise.all([
    countJobs(email, (query) => query.eq('quota_month', month).eq('consumed', true)),
    countJobs(email, (query) => open(query.eq('quota_month', month))),
    countJobs(email, (query) =>
      query.eq('consumed', true).gte('created_at', range.start).lt('created_at', range.end)
    ),
    countJobs(email, (query) =>
      open(query.gte('created_at', range.start).lt('created_at', range.end))
    ),
  ]);
  return {
    used: monthDone + monthOpen,
    dailyUsed: dayDone + dayOpen,
    monthDone,
    dayDone,
  };
}

function quotaBlock(counts) {
  if (counts.used >= MONTHLY_LIMIT) {
    return {
      code: 'quota_exceeded',
      error: 'You have used all 5 playlist generations for this month.',
    };
  }
  if (counts.dailyUsed >= DAILY_LIMIT) {
    return {
      code: 'daily_quota_exceeded',
      error: 'You can build 2 trackers a day. The next one can start tomorrow.',
    };
  }
  return null;
}

export async function getAiEntitlement(email) {
  const userEmail = normalizeEmail(email);
  const month = quotaMonth();
  const range = kolkataDayRange();
  if (!userEmail) {
    return { entitled: false, code: 'subscription_required', ...emptyQuota(), month, day: range.day };
  }
  const sub = await getActiveSubscription(userEmail);
  if (!sub) {
    return { entitled: false, code: 'subscription_required', ...emptyQuota(), month, day: range.day };
  }
  if (sub.plan_id === 'day_pass') {
    return { entitled: false, code: 'plan_excludes_ai', ...emptyQuota(), month, day: range.day };
  }
  let counts;
  try {
    counts = await usageCounts(userEmail, month, range);
  } catch (err) {
    if (isSetupError(err)) {
      return {
        entitled: true,
        code: 'setup_required',
        ...emptyQuota(),
        month,
        day: range.day,
        setupRequired: true,
      };
    }
    throw err;
  }
  const block = quotaBlock(counts);
  return {
    entitled: !block,
    code: block?.code || null,
    used: counts.used,
    limit: MONTHLY_LIMIT,
    dailyUsed: counts.dailyUsed,
    dailyLimit: DAILY_LIMIT,
    month,
    day: range.day,
    planId: sub.plan_id,
  };
}

async function youtubeGet(path, params) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    const err = new Error('YouTube Data API key is not configured');
    err.code = 'youtube_api_key_missing';
    throw err;
  }
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(name, String(value));
  }
  url.searchParams.set('key', key);
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message || 'YouTube request failed');
    err.code = 'youtube_fetch_failed';
    throw err;
  }
  return json;
}

async function fetchPlaylistFromYouTube(playlistId) {
  const meta = await youtubeGet('playlists', { part: 'snippet', id: playlistId });
  const title = meta.items?.[0]?.snippet?.title || 'YouTube playlist';
  const videos = [];
  let pageToken = '';
  while (videos.length < MAX_VIDEOS) {
    const page = await youtubeGet('playlistItems', {
      part: 'snippet,contentDetails',
      maxResults: 50,
      playlistId,
      pageToken,
    });
    for (const item of page.items || []) {
      const videoId = item.contentDetails?.videoId;
      const itemTitle = item.snippet?.title || '';
      if (!videoId) continue;
      if (itemTitle === 'Private video' || itemTitle === 'Deleted video') continue;
      videos.push({
        videoId,
        title: itemTitle || 'Untitled',
        position: Number.isFinite(item.snippet?.position) ? item.snippet.position : videos.length,
      });
      if (videos.length >= MAX_VIDEOS) break;
    }
    pageToken = page.nextPageToken || '';
    if (!pageToken) break;
  }

  for (let i = 0; i < videos.length; i += 50) {
    const slice = videos.slice(i, i + 50);
    const details = await youtubeGet('videos', {
      part: 'contentDetails',
      id: slice.map((video) => video.videoId).join(','),
    });
    const durations = new Map(
      (details.items || []).map((item) => [
        item.id,
        parseIsoDuration(item.contentDetails?.duration),
      ])
    );
    for (const video of slice) {
      video.durationSeconds = durations.get(video.videoId) || null;
    }
  }

  videos.sort((a, b) => a.position - b.position);
  return { playlistId, title, videos };
}

async function readSnapshot(playlistId, hash) {
  if (!playlistId || !hash) return null;
  const { data, error } = await db()
    .from('og_playlist_snapshots')
    .select('title, videos, content_hash')
    .eq('playlist_id', playlistId)
    .eq('content_hash', hash)
    .maybeSingle();
  if (error || !data?.videos?.length) return null;
  return {
    playlistId,
    contentHash: hash,
    title: data.title || 'YouTube playlist',
    videos: data.videos,
  };
}

async function loadOrFetchSnapshot(playlistId) {
  const fresh = await fetchPlaylistFromYouTube(playlistId);
  const hash = contentHash(fresh.videos.map((video) => video.videoId));
  const supabase = db();
  const cached = await supabase
    .from('og_playlist_snapshots')
    .select('playlist_id, content_hash, title, videos, video_count')
    .eq('playlist_id', playlistId)
    .eq('content_hash', hash)
    .maybeSingle();
  if (cached.data?.videos?.length) {
    return {
      playlistId,
      contentHash: hash,
      title: cached.data.title || fresh.title,
      videos: cached.data.videos,
    };
  }
  const row = {
    playlist_id: playlistId,
    content_hash: hash,
    title: fresh.title,
    videos: fresh.videos,
    video_count: fresh.videos.length,
    fetched_at: new Date().toISOString(),
  };
  const saved = await supabase.from('og_playlist_snapshots').upsert(row).select('title, videos').maybeSingle();
  return {
    playlistId,
    contentHash: hash,
    title: saved.data?.title || fresh.title,
    videos: saved.data?.videos || fresh.videos,
  };
}

async function loadTopicCache(videoIds) {
  if (!videoIds.length) return new Map();
  const { data, error } = await db()
    .from('og_video_topic_cache')
    .select('video_id, chapter_slug, source')
    .eq('exam_family', EXAM_FAMILY)
    .in('video_id', videoIds);
  if (error) throw error;
  return new Map((data || []).map((row) => [row.video_id, row]));
}

async function saveTopicCache(rows) {
  if (!rows.length) return;
  const now = new Date().toISOString();
  const { error } = await db().from('og_video_topic_cache').upsert(
    rows.map((row) => ({
      video_id: row.videoId,
      exam_family: EXAM_FAMILY,
      chapter_slug: row.chapterSlug || null,
      source: row.source,
      updated_at: now,
    }))
  );
  if (error) throw error;
}

async function alignWithModel(videos) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !videos.length) return null;
  const allowed = [
    'discrete-mathematics',
    'digital-logic',
    'computer-organization',
    'programming-ds',
    'algorithms',
    'theory-of-computation',
    'compiler-design',
    'operating-systems',
    'databases',
    'computer-networks',
  ];
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_REWRITE_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Map each lecture title to one GATE CSE chapter slug or null. Reply JSON {"items":[{"videoId":"...","chapterSlug":"algorithms"|null}]}. Use only the allowed slugs.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            allowed,
            videos: videos.map((video) => ({ videoId: video.videoId, title: video.title })),
          }),
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = new Error('Topic model request failed');
    err.code = 'model_failed';
    throw err;
  }
  const json = await res.json();
  const usage = {
    prompt: Number(json.usage?.prompt_tokens) || 0,
    completion: Number(json.usage?.completion_tokens) || 0,
    total: Number(json.usage?.total_tokens) || 0,
  };
  const text = json.choices?.[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { items: [], usage };
  }
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return {
    usage,
    items: items
      .map((item) => ({
        videoId: String(item.videoId || ''),
        chapterSlug: chapterBySlug(item.chapterSlug) ? item.chapterSlug : null,
        source: 'llm',
      }))
      .filter((item) => item.videoId),
  };
}

function matchedCount(videos, cache) {
  return videos.filter((video) => {
    const row = cache.get(video.videoId);
    if (row) return Boolean(row.chapter_slug);
    return Boolean(matchGateChapter(video.title));
  }).length;
}

async function findOwnedPath(email, hash) {
  const { data, error } = await db()
    .from('og_ai_jobs')
    .select('id, path_id, status, consumed')
    .eq('user_email', email)
    .eq('content_hash', hash)
    .eq('status', 'completed')
    .not('path_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function practiceRow(pathId, sectionLabel, step) {
  return {
    path_id: pathId,
    type: 'PRACTICE_CHAPTER',
    title: step.title,
    external_url: `/gate-cse/${step.subject}/${step.chapter}/practice`,
    external_slug: `gate-cse/${step.subject}/${step.chapter}`,
    section_label: sectionLabel,
    is_premium: false,
    meta: {
      area: 'gate-cse',
      subject: step.subject,
      chapter: step.chapter,
      completionPercent: 70,
    },
  };
}

function mockRow(pathId, sectionLabel, mock) {
  return {
    path_id: pathId,
    type: 'MOCK_TEST',
    title: `Mock: ${mock.name}`,
    external_url: `/mock-test/gate-cse/attempt/${mock.id}`,
    external_slug: mock.id,
    section_label: sectionLabel,
    is_premium: false,
    meta: {
      examCategory: 'gate-cse',
      testId: mock.id,
    },
  };
}

function layoutSection(section, mocks, usedMocks, plan) {
  const allSteps = section.key === 'other' ? [] : practiceStepsFor(section.key);
  const chosen = (plan?.sections || []).find((item) => item.key === section.key);
  const allowed = new Set(chosen?.chapters || []);
  const steps = allowed.size ? allSteps.filter((step) => allowed.has(step.chapter)) : allSteps;
  const blocks = layoutLearningBlocks(section.videos, steps);
  const items = [];
  blocks.forEach((block, index) => {
    const blockSection = { ...section, label: block.label || section.label };
    for (const video of block.videos) {
      items.push({ kind: 'video', video, section: blockSection });
    }
    if (!block.step || !block.videos.length) return;
    items.push({ kind: 'practice', step: block.step, section: blockSection });
    for (const extra of block.extraSteps || []) {
      items.push({ kind: 'practice', step: extra, section: blockSection });
    }
    const chapterMock = pickSubjectMock(mocks, {
      label: block.step.chapter,
      chapters: [block.step.chapter, ...(block.extraSteps || []).map((step) => step.chapter)],
      used: usedMocks,
    });
    const checkpoint = !chapterMock && (index + 1) % 3 === 0
      ? pickFullMock(mocks, usedMocks)
      : null;
    const mock = chapterMock || checkpoint;
    if (mock) {
      usedMocks.add(mock.id);
      items.push({ kind: 'mock', mock, section: blockSection });
    }
  });
  return items;
}

function sectionsFrom(snapshot, cache) {
  const tagged = snapshot.videos.map((video) => {
    const cached = cache.get(video.videoId);
    const chapter = chapterBySlug(cached?.chapter_slug) || matchGateChapter(video.title);
    return {
      video,
      key: chapter?.slug || null,
      label: chapter?.title || 'Other',
    };
  });
  const counts = new Map();
  for (const item of tagged) {
    if (!item.key) continue;
    counts.set(item.key, (counts.get(item.key) || 0) + 1);
  }
  let dominant = null;
  let dominantCount = 0;
  for (const [key, count] of counts) {
    if (count > dominantCount) {
      dominant = key;
      dominantCount = count;
    }
  }
  const unify = Boolean(dominant && dominantCount / Math.max(tagged.length, 1) >= 0.55);
  const sections = [];
  const sectionIndex = new Map();
  for (const item of tagged) {
    const key = unify ? dominant : (item.key || 'other');
    const label = unify
      ? (chapterBySlug(dominant)?.title || 'Path')
      : (item.key ? item.label : 'Other');
    if (!sectionIndex.has(key)) {
      sectionIndex.set(key, sections.length);
      sections.push({ key, label, videos: [] });
    }
    sections[sectionIndex.get(key)].videos.push(item.video);
  }
  return sections;
}

function catalogPlan(sections, mocks) {
  const used = new Set();
  const planned = [];
  for (const section of sections) {
    if (section.key === 'other') continue;
    const steps = practiceStepsFor(section.key);
    const mock = pickSubjectMock(mocks, {
      label: section.label,
      chapters: steps.map((step) => step.chapter),
      used,
    });
    if (mock) used.add(mock.id);
    planned.push({
      key: section.key,
      chapters: steps.map((step) => step.chapter),
      mockId: mock?.id || null,
    });
  }
  const full = planned.some((section) => section.mockId) ? null : pickFullMock(mocks, used);
  return { sections: planned, fullMockId: full?.id || null, source: 'catalog' };
}

async function planStudyMix(sections, mocks) {
  const fallback = catalogPlan(sections, mocks);
  const key = process.env.OPENAI_API_KEY;
  const subjects = fallback.sections;
  if (!key || !subjects.length) return { plan: fallback, usage: { prompt: 0, completion: 0, total: 0 } };

  const mockChoices = mocks
    .filter((mock) => !String(mock.name || '').toLowerCase().includes('mock of the day'))
    .slice(0, 40)
    .map((mock) => ({ id: mock.id, name: mock.name }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_REWRITE_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Build a GATE CSE study tracker: lectures plus the practice chapters and one real mock that belong with them. Use only the given practice chapter slugs and mock ids. Do not invent any. Keep the core chapters of each subject, and drop a chapter only when the lecture titles clearly are not about it. Pick at most one mock whose name matches the subject. Reply JSON {"sections":[{"key":"operating-systems","chapters":["deadlock"],"mockId":null}],"fullMockId":null}.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            sections: subjects.map((section) => {
              const source = sections.find((item) => item.key === section.key);
              return {
                key: section.key,
                label: source?.label || section.key,
                lectureCount: source?.videos?.length || 0,
                sampleTitles: (source?.videos || []).slice(0, 8).map((video) => video.title),
                practiceChapters: section.chapters,
              };
            }),
            mocks: mockChoices,
          }),
        },
      ],
    }),
  });
  const usage = { prompt: 0, completion: 0, total: 0 };
  if (!res.ok) return { plan: fallback, usage };
  const json = await res.json();
  usage.prompt = Number(json.usage?.prompt_tokens) || 0;
  usage.completion = Number(json.usage?.completion_tokens) || 0;
  usage.total = Number(json.usage?.total_tokens) || 0;
  let parsed;
  try {
    parsed = JSON.parse(json.choices?.[0]?.message?.content || '{}');
  } catch {
    return { plan: fallback, usage };
  }

  const allowedMocks = new Set(mocks.map((mock) => mock.id));
  const byKey = new Map(subjects.map((section) => [section.key, new Set(section.chapters)]));
  const planned = subjects.map((section) => {
    const picked = (Array.isArray(parsed.sections) ? parsed.sections : []).find((item) => item.key === section.key);
    const allowed = byKey.get(section.key) || new Set();
    const chapters = (Array.isArray(picked?.chapters) ? picked.chapters : [])
      .map((chapter) => String(chapter || ''))
      .filter((chapter) => allowed.has(chapter));
    const mockId = allowedMocks.has(picked?.mockId) ? picked.mockId : null;
    return {
      key: section.key,
      chapters: chapters.length ? chapters : section.chapters,
      mockId,
    };
  });
  const fullMockId = allowedMocks.has(parsed.fullMockId) ? parsed.fullMockId : fallback.fullMockId;
  const anyMock = planned.some((section) => section.mockId);
  return {
    plan: {
      sections: planned,
      fullMockId: anyMock ? null : fullMockId,
      source: 'ai',
    },
    usage,
  };
}

async function writePath(job, snapshot, cache, plan) {
  const supabase = db();
  const ownerBit = normalizeSlug(String(job.user_email).split('@')[0] || 'user').slice(0, 12);
  const slug = normalizeSlug(`ai-${snapshot.contentHash.slice(0, 10)}-${ownerBit || 'user'}`);
  const uniqueSlug = `${slug}-${String(job.id).slice(0, 8)}`;
  const sections = sectionsFrom(snapshot, cache);

  const { data: path, error: pathError } = await supabase
    .from('og_paths')
    .insert({
      slug: uniqueSlug,
      title: snapshot.title || 'My GATE playlist',
      description: 'Private GATE CSE tracker: your lectures, plus the practice chapters and mock tests for those subjects.',
      category: 'GATE CSE',
      tags: ['ai', 'gate-cse', 'private'],
      icon: 'Sparkles',
      sort_order: 0,
      is_premium: false,
      is_active: true,
      owner_email: job.user_email,
      source: 'ai_playlist',
      playlist_id: snapshot.playlistId,
    })
    .select('id, slug')
    .single();
  if (pathError) throw pathError;

  const mocks = await fetchGateCseMocks(supabase);
  const usedMocks = new Set();
  const laidOut = sections.flatMap((section) => layoutSection(section, mocks, usedMocks, plan));
  if (!laidOut.some((item) => item.kind === 'mock')) {
    const full = (plan?.fullMockId && mocks.find((mock) => mock.id === plan.fullMockId)) || pickFullMock(mocks, usedMocks);
    const last = laidOut[laidOut.length - 1];
    if (full && last) {
      laidOut.push({ kind: 'mock', mock: full, section: last.section });
    }
  }

  const resources = [];
  laidOut.forEach((item, order) => {
    if (item.kind === 'video') {
      const video = item.video;
      resources.push({
        path_id: path.id,
        type: 'VIDEO',
        sort_order: order,
        title: video.title,
        youtube_video_id: video.videoId,
        duration_seconds: video.durationSeconds || null,
        section_label: item.section.label,
        is_premium: false,
        meta: {},
      });
      return;
    }
    const row = item.kind === 'practice'
      ? practiceRow(path.id, item.section.label, item.step)
      : mockRow(path.id, item.section.label, item.mock);
    resources.push({ ...row, sort_order: order });
  });

  if (resources.length) {
    const inserted = await supabase.from('og_resources').insert(resources);
    if (inserted.error) {
      await supabase.from('og_paths').delete().eq('id', path.id);
      throw inserted.error;
    }
  }
  return {
    ...path,
    videoCount: resources.filter((row) => row.type === 'VIDEO').length,
    practiceCount: resources.filter((row) => row.type === 'PRACTICE_CHAPTER').length,
    mockCount: resources.filter((row) => row.type === 'MOCK_TEST').length,
  };
}

/**
 * Add practice chapters and real mock tests to a video-only generated path.
 * Existing video rows stay so saved progress is kept. Sort order is rewritten
 * so practice sits with the lectures for that topic.
 */
export async function applyStudyMixToPath(pathId) {
  const supabase = db();
  const loaded = await supabase
    .from('og_resources')
    .select('id, type, title, youtube_video_id, duration_seconds, section_label, sort_order')
    .eq('path_id', pathId)
    .order('sort_order', { ascending: true });
  if (loaded.error) throw loaded.error;
  const rows = loaded.data || [];
  if (rows.some((row) => row.type === 'PRACTICE_CHAPTER' || row.type === 'MOCK_TEST')) {
    return { skipped: true, pathId };
  }

  const videos = rows.filter((row) => row.type === 'VIDEO');
  const sections = [];
  const sectionIndex = new Map();
  for (const video of videos) {
    const chapter = matchGateChapter(video.section_label) || matchGateChapter(video.title);
    const key = chapter?.slug || 'other';
    const label = video.section_label || chapter?.title || 'Other';
    if (!sectionIndex.has(key)) {
      sectionIndex.set(key, sections.length);
      sections.push({ key, label, videos: [] });
    }
    sections[sectionIndex.get(key)].videos.push({
      id: video.id,
      title: video.title,
      videoId: video.youtube_video_id,
      durationSeconds: video.duration_seconds,
    });
  }

  const mocks = await fetchGateCseMocks(supabase);
  const usedMocks = new Set();
  const laidOut = sections.flatMap((section) => layoutSection(section, mocks, usedMocks));
  if (!laidOut.some((item) => item.kind === 'mock')) {
    const full = pickFullMock(mocks, usedMocks);
    const last = laidOut[laidOut.length - 1];
    if (full && last) laidOut.push({ kind: 'mock', mock: full, section: last.section });
  }

  const inserts = [];
  const orderUpdates = [];
  laidOut.forEach((item, order) => {
    if (item.kind === 'video') {
      orderUpdates.push({ id: item.video.id, sort_order: order, section_label: item.section.label });
      return;
    }
    const row = item.kind === 'practice'
      ? practiceRow(pathId, item.section.label, item.step)
      : mockRow(pathId, item.section.label, item.mock);
    inserts.push({ ...row, sort_order: order });
  });

  if (inserts.length) {
    const inserted = await supabase.from('og_resources').insert(inserts);
    if (inserted.error) throw inserted.error;
  }

  for (const update of orderUpdates) {
    const saved = await supabase
      .from('og_resources')
      .update({
        sort_order: update.sort_order,
        section_label: update.section_label,
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id);
    if (saved.error) throw saved.error;
  }

  await supabase
    .from('og_paths')
    .update({
      description: 'Private GATE CSE tracker: your lectures, plus the practice chapters and mock tests for those subjects.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', pathId);

  return {
    skipped: false,
    pathId,
    practice: inserts.filter((row) => row.type === 'PRACTICE_CHAPTER').length,
    mocks: inserts.filter((row) => row.type === 'MOCK_TEST').length,
  };
}

async function updateJob(id, patch, expectedUpdatedAt) {
  let query = db().from('og_ai_jobs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt);
  const { data, error } = await query.select('*').maybeSingle();
  if (error) throw error;
  return data;
}

async function finishRejected(job, code, message) {
  return updateJob(
    job.id,
    { status: 'rejected', error_code: code, error_message: message, consumed: false },
    job.updated_at
  );
}

export async function listAiHome(email) {
  const userEmail = normalizeEmail(email);
  const entitlement = await getAiEntitlement(userEmail);
  if (entitlement.setupRequired) return { entitlement, jobs: [], paths: [] };
  const { data, error } = await db()
    .from('og_ai_jobs')
    .select('id, status, error_code, error_message, playlist_id, path_id, videos_total, videos_done, consumed, quota_month, prompt_tokens, completion_tokens, total_tokens, created_at')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    if (isSetupError(error)) return { entitlement: { ...entitlement, setupRequired: true, code: 'setup_required' }, jobs: [], paths: [] };
    throw error;
  }
  const pathIds = (data || []).map((row) => row.path_id).filter(Boolean);
  let slugs = new Map();
  const mixes = new Map();
  if (pathIds.length) {
    const paths = await db().from('og_paths').select('id, slug, title').in('id', pathIds);
    slugs = new Map((paths.data || []).map((row) => [row.id, row]));
    const resources = await db().from('og_resources').select('path_id, type').in('path_id', pathIds);
    for (const row of resources.data || []) {
      const current = mixes.get(row.path_id) || { videoCount: 0, practiceCount: 0, mockCount: 0 };
      if (row.type === 'VIDEO') current.videoCount += 1;
      if (row.type === 'PRACTICE_CHAPTER') current.practiceCount += 1;
      if (row.type === 'MOCK_TEST') current.mockCount += 1;
      mixes.set(row.path_id, current);
    }
  }
  const monthTokens = await monthTokenTotal(userEmail, entitlement.month);
  return {
    entitlement,
    monthTokens,
    jobs: (data || []).map((row) =>
      jobView(row, {
        pathSlug: slugs.get(row.path_id)?.slug || null,
        ...(mixes.get(row.path_id) || {}),
      })
    ),
  };
}

async function monthTokenTotal(email, month) {
  const { data, error } = await db()
    .from('og_ai_jobs')
    .select('total_tokens')
    .eq('user_email', email)
    .eq('quota_month', month);
  if (error) return 0;
  return (data || []).reduce((sum, row) => sum + (Number(row.total_tokens) || 0), 0);
}

export async function createAiJob(email, playlistUrl) {
  const userEmail = normalizeEmail(email);
  const playlistId = parsePlaylistId(playlistUrl);
  if (!playlistId) {
    return { ok: false, code: 'playlist_invalid', error: 'Paste a YouTube playlist link.' };
  }
  const entitlement = await getAiEntitlement(userEmail);
  if (entitlement.setupRequired) {
    return { ok: false, code: 'setup_required', error: 'AI tracker tables are not installed yet.' };
  }
  if (!entitlement.entitled) {
    const blocked = quotaBlock({
      used: entitlement.code === 'quota_exceeded' ? MONTHLY_LIMIT : 0,
      dailyUsed: entitlement.code === 'daily_quota_exceeded' ? DAILY_LIMIT : 0,
    });
    const message =
      entitlement.code === 'plan_excludes_ai'
        ? 'The 24-hour pass includes practice, not AI trackers. A 3-month or 6-month plan includes 5 generations a month, with 2 a day.'
        : blocked?.error || 'An active 3-month or 6-month subscription is required.';
    return { ok: false, code: entitlement.code, error: message, entitlement };
  }

  const open = await db()
    .from('og_ai_jobs')
    .select('*')
    .eq('user_email', userEmail)
    .eq('playlist_id', playlistId)
    .in('status', OPEN_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (open.error) throw open.error;
  if (open.data) return { ok: true, job: jobView(open.data), entitlement };

  const { data, error } = await db()
    .from('og_ai_jobs')
    .insert({
      user_email: userEmail,
      playlist_id: playlistId,
      playlist_url: String(playlistUrl || '').slice(0, 500),
      exam_family: EXAM_FAMILY,
      status: 'queued',
      quota_month: entitlement.month,
      consumed: false,
    })
    .select('*')
    .single();
  if (error) {
    if (isSetupError(error)) {
      return { ok: false, code: 'setup_required', error: 'AI tracker tables are not installed yet.' };
    }
    throw error;
  }
  const held = await usageCounts(userEmail, entitlement.month, kolkataDayRange());
  if (held.used > MONTHLY_LIMIT || held.dailyUsed > DAILY_LIMIT) {
    await db().from('og_ai_jobs').delete().eq('id', data.id).eq('status', 'queued');
    const again = await getAiEntitlement(userEmail);
    const blocked = quotaBlock({
      used: held.used > MONTHLY_LIMIT ? MONTHLY_LIMIT : 0,
      dailyUsed: held.dailyUsed > DAILY_LIMIT ? DAILY_LIMIT : 0,
    });
    return { ok: false, code: blocked.code, error: blocked.error, entitlement: again };
  }
  const refreshed = await getAiEntitlement(userEmail);
  return { ok: true, job: jobView(data), entitlement: refreshed };
}

export async function tickAiJob(email, jobId) {
  const userEmail = normalizeEmail(email);
  const supabase = db();
  const loaded = await supabase
    .from('og_ai_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_email', userEmail)
    .maybeSingle();
  if (loaded.error) throw loaded.error;
  const job = loaded.data;
  if (!job) return { ok: false, code: 'not_found', error: 'Job not found.' };
  if (!OPEN_STATUSES.includes(job.status)) {
    const path = job.path_id
      ? await supabase.from('og_paths').select('slug').eq('id', job.path_id).maybeSingle()
      : null;
    return { ok: true, job: jobView(job, { pathSlug: path?.data?.slug || null }) };
  }

  try {
    if (job.status === 'queued') {
      const snapshot = await loadOrFetchSnapshot(job.playlist_id);
      if (!snapshot.videos.length) {
        const rejected = await finishRejected(job, 'irrelevant', 'That playlist has no public videos.');
        return { ok: true, job: jobView(rejected || job) };
      }
      const existing = await findOwnedPath(userEmail, snapshot.contentHash);
      if (existing?.path_id) {
        const path = await supabase.from('og_paths').select('slug').eq('id', existing.path_id).maybeSingle();
        const done = await updateJob(
          job.id,
          {
            status: 'completed',
            content_hash: snapshot.contentHash,
            path_id: existing.path_id,
            videos_total: snapshot.videos.length,
            videos_done: snapshot.videos.length,
            consumed: false,
            error_code: null,
            error_message: null,
          },
          job.updated_at
        );
        return { ok: true, job: jobView(done || job, { pathSlug: path.data?.slug || null }) };
      }
      const cache = await loadTopicCache(snapshot.videos.map((video) => video.videoId));
      const hits = matchedCount(snapshot.videos, cache);
      const ratio = hits / snapshot.videos.length;
      if (hits < MATCH_COUNT && ratio < MATCH_RATIO) {
        const rejected = await finishRejected(
          job,
          'irrelevant',
          'This playlist does not look like GATE CSE. No generation was used.'
        );
        return { ok: true, job: jobView(rejected || job) };
      }
      const next = await updateJob(
        job.id,
        {
          status: 'aligning',
          content_hash: snapshot.contentHash,
          videos_total: snapshot.videos.length,
          videos_done: hits,
          error_code: null,
          error_message: null,
        },
        job.updated_at
      );
      return { ok: true, job: jobView(next || job) };
    }

    if (job.status === 'aligning') {
      const snapshot =
        (await readSnapshot(job.playlist_id, job.content_hash)) ||
        (await loadOrFetchSnapshot(job.playlist_id));
      const cache = await loadTopicCache(snapshot.videos.map((video) => video.videoId));
      const lexiconRows = [];
      const pending = [];
      for (const video of snapshot.videos) {
        if (cache.has(video.videoId)) continue;
        const chapter = matchGateChapter(video.title);
        if (chapter) {
          lexiconRows.push({ videoId: video.videoId, chapterSlug: chapter.slug, source: 'lexicon' });
          cache.set(video.videoId, { chapter_slug: chapter.slug, source: 'lexicon' });
        } else {
          pending.push(video);
        }
      }
      await saveTopicCache(lexiconRows);
      const batch = pending.slice(0, LLM_BATCH);
      let spent = { prompt: 0, completion: 0, total: 0 };
      if (batch.length && process.env.OPENAI_API_KEY) {
        const aligned = await alignWithModel(batch);
        spent = aligned.usage || spent;
        const known = new Set((aligned.items || []).map((row) => row.videoId));
        const rows = [
          ...(aligned.items || []),
          ...batch
            .filter((video) => !known.has(video.videoId))
            .map((video) => ({ videoId: video.videoId, chapterSlug: null, source: 'llm' })),
        ];
        await saveTopicCache(rows);
      } else if (batch.length) {
        await saveTopicCache(
          batch.map((video) => ({ videoId: video.videoId, chapterSlug: null, source: 'none' }))
        );
      }
      const refreshed = await loadTopicCache(snapshot.videos.map((video) => video.videoId));
      const doneCount = snapshot.videos.filter((video) => refreshed.has(video.videoId)).length;
      const finished = doneCount >= snapshot.videos.length;
      const next = await updateJob(
        job.id,
        {
          status: finished ? 'writing' : 'aligning',
          videos_done: doneCount,
          videos_total: snapshot.videos.length,
          prompt_tokens: (Number(job.prompt_tokens) || 0) + spent.prompt,
          completion_tokens: (Number(job.completion_tokens) || 0) + spent.completion,
          total_tokens: (Number(job.total_tokens) || 0) + spent.total,
        },
        job.updated_at
      );
      return { ok: true, job: jobView(next || job) };
    }

    if (job.status === 'writing') {
      if (job.error_code === 'claim') {
        const age = Date.now() - new Date(job.updated_at).getTime();
        if (age < 120000) return { ok: true, job: jobView(job) };
      }
      const claimed = await updateJob(job.id, { error_code: 'claim' }, job.updated_at);
      if (!claimed) return { ok: true, job: jobView(job) };
      const held = await usageCounts(
        userEmail,
        claimed.quota_month || quotaMonth(),
        kolkataDayRange()
      );
      if (held.monthDone >= MONTHLY_LIMIT || held.dayDone >= DAILY_LIMIT) {
        const blocked = quotaBlock({
          used: held.monthDone >= MONTHLY_LIMIT ? MONTHLY_LIMIT : 0,
          dailyUsed: held.dayDone >= DAILY_LIMIT ? DAILY_LIMIT : 0,
        });
        const rejected = await finishRejected(claimed, blocked.code, blocked.error);
        return { ok: true, job: jobView(rejected || claimed) };
      }
      const snapshot =
        (await readSnapshot(claimed.playlist_id, claimed.content_hash)) ||
        (await loadOrFetchSnapshot(claimed.playlist_id));
      const cache = await loadTopicCache(snapshot.videos.map((video) => video.videoId));
      const sections = sectionsFrom(snapshot, cache);
      const mocks = await fetchGateCseMocks(supabase);
      const planned = await planStudyMix(sections, mocks);
      const path = await writePath(claimed, snapshot, cache, planned.plan);
      claimed.prompt_tokens = (Number(claimed.prompt_tokens) || 0) + planned.usage.prompt;
      claimed.completion_tokens = (Number(claimed.completion_tokens) || 0) + planned.usage.completion;
      claimed.total_tokens = (Number(claimed.total_tokens) || 0) + planned.usage.total;
      const done = await updateJob(
        claimed.id,
        {
          status: 'completed',
          path_id: path.id,
          videos_done: snapshot.videos.length,
          videos_total: snapshot.videos.length,
          prompt_tokens: claimed.prompt_tokens,
          completion_tokens: claimed.completion_tokens,
          total_tokens: claimed.total_tokens,
          consumed: true,
          error_code: null,
          error_message: null,
        },
        claimed.updated_at
      );
      return {
        ok: true,
        job: jobView(done || { ...job, status: 'completed', path_id: path.id }, {
          pathSlug: path.slug,
          videoCount: path.videoCount,
          practiceCount: path.practiceCount,
          mockCount: path.mockCount,
        }),
      };
    }
  } catch (err) {
    const failed = await updateJob(job.id, {
      status: 'failed',
      error_code: err.code || 'failed',
      error_message: err.message || 'Generation failed',
      consumed: false,
    }).catch(() => null);
    return {
      ok: false,
      code: err.code || 'failed',
      error: err.message || 'Generation failed',
      job: jobView(failed || job),
    };
  }

  return { ok: true, job: jobView(job) };
}
