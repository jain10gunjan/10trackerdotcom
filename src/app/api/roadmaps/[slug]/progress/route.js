import { NextResponse } from 'next/server';
import { requireSessionEmail } from '@/lib/credits/requireSession';
import { getProgressUserId } from '@/lib/progressIdentity';
import {
  getRoadmapBySlug,
  normalizeSlug,
  upsertTaskProgress,
  assertCanEditTask,
  buildRoadmapDetail,
  fetchRoadmapDays,
} from '@/lib/roadmaps/roadmapService';

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

export async function POST(request, { params }) {
  try {
    const { email, error, status } = await requireSessionEmail();
    if (error) {
      return NextResponse.json({ success: false, error }, { status });
    }

    const { slug: slugParam } = await params;
    const slug = normalizeSlug(slugParam);
    const body = await request.json();
    const { taskId, status: taskStatus, userNotes } = body;

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json({ success: false, error: 'taskId required' }, { status: 400 });
    }

    const roadmap = await getRoadmapBySlug(slug);
    if (!roadmap?.is_active) {
      return NextResponse.json({ success: false, error: 'Roadmap not found' }, { status: 404 });
    }

    const daysRaw = await fetchRoadmapDays(roadmap.id);
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

    const nextStatus = taskStatus === 'completed' ? 'completed' : 'not_completed';
    const userId = getProgressUserId({ email });

    await upsertTaskProgress(userId, roadmap.id, taskId, {
      status: nextStatus,
      user_notes: typeof userNotes === 'string' ? userNotes : undefined,
    });

    const refreshed = await buildRoadmapDetail(slug, email);

    return NextResponse.json({
      success: true,
      progress: refreshed.progress,
      progressMap: refreshed.progressMap,
    });
  } catch (err) {
    console.error('POST /api/roadmaps/[slug]/progress', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save progress' },
      { status: 500 }
    );
  }
}
