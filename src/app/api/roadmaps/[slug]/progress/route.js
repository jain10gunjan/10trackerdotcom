import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/features/credits/lib/requireSession';
import { getProgressUserId } from '@/lib/progressIdentity';
import {
  getRoadmapBySlug,
  normalizeSlug,
  upsertTaskProgress,
  upsertTaskProgressBatch,
  assertCanEditTask,
  buildRoadmapDetail,
  fetchRoadmapDays,
} from '@/features/roadmaps/lib/roadmapService';

function findTaskDayNumber(days, taskId) {
  for (const day of days || []) {
    for (const fa of day.focus_areas || []) {
      for (const t of fa.tasks || []) {
        if (t.task_id === taskId) return day.day_number;
      }
    }
  }
  return null;
}

function normalizeTaskPayload(entry) {
  if (!entry || typeof entry.taskId !== 'string' || !entry.taskId.trim()) {
    return null;
  }
  return {
    taskId: entry.taskId.trim(),
    status: entry.status === 'completed' ? 'completed' : 'not_completed',
    userNotes: typeof entry.userNotes === 'string' ? entry.userNotes : '',
  };
}

async function assertTasksEditable(email, roadmap, daysRaw, tasks) {
  for (const task of tasks) {
    const dayNumber = findTaskDayNumber(daysRaw, task.taskId);
    if (dayNumber == null) {
      return { ok: false, status: 404, error: `Task not found: ${task.taskId}` };
    }
    const allowed = await assertCanEditTask(email, roadmap, dayNumber);
    if (!allowed) {
      return {
        ok: false,
        status: 403,
        error: 'Purchase required to update one or more tasks',
      };
    }
  }
  return { ok: true };
}

export async function POST(request, { params }) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const { slug: slugParam } = await params;
    const slug = normalizeSlug(slugParam);
    const body = await request.json();

    const roadmap = await getRoadmapBySlug(slug);
    if (!roadmap?.is_active) {
      return NextResponse.json({ success: false, error: 'Roadmap not found' }, { status: 404 });
    }

    const daysRaw = await fetchRoadmapDays(roadmap.id);
    const userId = getProgressUserId({ email });

    if (Array.isArray(body.tasks)) {
      const tasks = body.tasks.map(normalizeTaskPayload).filter(Boolean);
      if (!tasks.length) {
        return NextResponse.json(
          { success: false, error: 'No valid tasks to save' },
          { status: 400 }
        );
      }

      const access = await assertTasksEditable(email, roadmap, daysRaw, tasks);
      if (!access.ok) {
        return NextResponse.json(
          { success: false, error: access.error },
          { status: access.status }
        );
      }

      await upsertTaskProgressBatch(userId, roadmap.id, tasks);
    } else {
      const { taskId, status: taskStatus, userNotes } = body;
      if (!taskId || typeof taskId !== 'string') {
        return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 });
      }

      const dayNumber = findTaskDayNumber(daysRaw, taskId);
      if (dayNumber == null) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }

      const allowed = await assertCanEditTask(email, roadmap, dayNumber);
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: 'Purchase required to update this task' },
          { status: 403 }
        );
      }

      await upsertTaskProgress(userId, roadmap.id, taskId, {
        status: taskStatus === 'completed' ? 'completed' : 'not_completed',
        user_notes: typeof userNotes === 'string' ? userNotes : undefined,
      });
    }

    const refreshed = await buildRoadmapDetail(slug, email);

    return NextResponse.json({
      success: true,
      progress: refreshed.progress,
      progressMap: refreshed.progressMap,
      savedCount: Array.isArray(body.tasks) ? body.tasks.length : 1,
    });
  } catch (err) {
    console.error('POST /api/roadmaps/[slug]/progress', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save progress' },
      { status: 500 }
    );
  }
}
