import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await db.globalSettings.findUnique({
      where: { id: 1 },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      ai_text_key,
      ai_text_model,
      ai_image_key,
      ai_image_model,
      phase_1_prompt,
      phase_2_prompt,
      phase_3_prompt,
      phase_4_prompt,
      master_template_url,
    } = body;

    const updatedSettings = await db.globalSettings.upsert({
      where: { id: 1 },
      update: {
        ai_text_key: ai_text_key ?? undefined,
        ai_text_model: ai_text_model ?? undefined,
        ai_image_key: ai_image_key ?? undefined,
        ai_image_model: ai_image_model ?? undefined,
        phase_1_prompt: phase_1_prompt ?? undefined,
        phase_2_prompt: phase_2_prompt ?? undefined,
        phase_3_prompt: phase_3_prompt ?? undefined,
        phase_4_prompt: phase_4_prompt ?? undefined,
        master_template_url: master_template_url ?? undefined,
      },
      create: {
        id: 1,
        ai_text_key: ai_text_key || '',
        ai_text_model: ai_text_model || 'gpt-4',
        ai_image_key: ai_image_key || '',
        ai_image_model: ai_image_model || 'dall-e-3',
        phase_1_prompt: phase_1_prompt || '',
        phase_2_prompt: phase_2_prompt || '',
        phase_3_prompt: phase_3_prompt || '',
        phase_4_prompt: phase_4_prompt || '',
        master_template_url: master_template_url || null,
      },
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
