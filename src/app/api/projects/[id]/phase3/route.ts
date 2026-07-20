import { NextResponse } from 'next/server';
import db, { serializeState } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Lock Phase 3 brand book
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
    const { brandName, visualAesthetic, image2dUrl, image3dUrl, chatHistory } = body;

    if (!brandName || !visualAesthetic || !image2dUrl || !image3dUrl) {
      return NextResponse.json({ error: 'Brand Name, Visual Aesthetic, 2D layout, and 3D mockup are all required to lock the brand book.' }, { status: 400 });
    }

    const payload = {
      brandName,
      visualAesthetic,
      image2dUrl,
      image2dApproved: true,
      image3dUrl,
      image3dApproved: true,
      chatHistory: chatHistory || [],
      lockedAt: new Date().toISOString()
    };

    await db.project.update({
      where: { id: params.id },
      data: {
        phase_3_state: serializeState(payload) as string,
      },
    });

    return NextResponse.json({ success: true, state: payload });

  } catch (error) {
    console.error('Lock Phase 3 strategy error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}

// Reset/unlock Phase 3 brand book
export async function DELETE(
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

    await db.project.update({
      where: { id: params.id },
      data: {
        phase_3_state: null,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reset Phase 3 state error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error: ' + msg }, { status: 500 });
  }
}
