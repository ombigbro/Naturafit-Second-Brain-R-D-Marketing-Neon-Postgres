import { NextResponse } from 'next/server';
import db, { serializeState } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (user.role !== 'SUPER_ADMIN' && project.admin_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sparringSummary, competitorData } = body;

    const payload = {
      sparringSummary: sparringSummary || {},
      competitorData: competitorData || {},
      lockedAt: new Date().toISOString()
    };

    await db.project.update({
      where: { id: params.id },
      data: {
        phase_2_state: serializeState(payload) as string,
      },
    });

    return NextResponse.json({ success: true, state: payload });

  } catch (error) {
    console.error('Lock Phase 2 strategy error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}
